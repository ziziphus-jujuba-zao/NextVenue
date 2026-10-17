# Copyright (c) 2026 Zayier Xie
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Top topics among a venue's ACCEPTED papers, counted from the paper titles that dblp lists.

Python 3 standard library only. Not run in CI: CI only validates the JSON it writes
(schema/topics.schema.json, via `pnpm validate`). See scripts/topics/README.md.

What it does
  1. Fetches the titles of the papers dblp lists for one proceedings volume, with one query per volume
     to dblp's SPARQL endpoint (https://sparql.dblp.org/sparql). dblp metadata is CC0 1.0.
  2. Matches every title against a curated topic map (regex synonyms; a title can match several topics).
  3. Writes data/topics/<series>-<year>.json (top 15 topics by number of accepted papers, with the share of
     all accepted papers and the change from the previous year) and data/topics/taxonomy.json.

It counts accepted papers only. dblp has no rejected papers, so this can never give an acceptance rate,
and the JSON schema forbids one.

Being polite to dblp
  * dblp.org, dblp.uni-trier.de and dblp.dagstuhl.de answered scripted clients with a bot check on
    2026-09-25; this script does not try to get past it and only uses the SPARQL endpoint.
  * dblp FAQ "Am I allowed to crawl the dblp website?": wait "at least one or two second between two
    consecutive requests" and honour "429 Too Many Requests" + "Retry-After". Both are implemented.
  * Every response is cached under --cache-dir; later runs make no requests unless --refresh is given.

Usage (from the repo root)
  python3 scripts/topics/dblp_topics.py                     # all editions; fetches only what is not cached
  python3 scripts/topics/dblp_topics.py --offline           # cache only, never touch the network
  python3 scripts/topics/dblp_topics.py --offline --check   # rebuild in memory, compare with data/topics
  python3 scripts/topics/dblp_topics.py --edition cvpr-2025 # print one edition (and its neighbours)
  python3 scripts/topics/dblp_topics.py --qa                # also write n-gram phrases etc. to the cache dir
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT_DIR = os.path.join(ROOT, "data", "topics")
DEFAULT_CACHE = os.path.join(HERE, ".cache")

METHOD_VERSION = "0.1.0"
USER_AGENT = ("NextVenue-topics/0.1 (+https://github.com/ziziphus-jujuba-zao/NextVenue; one SPARQL query per "
              "proceedings volume; responses cached; python-urllib)")
SPARQL_ENDPOINT = "https://sparql.dblp.org/sparql"
MIN_DELAY_S = 2.0          # dblp FAQ: "at least one or two second between two consecutive requests"
MAX_RETRIES = 3
TOP_N = 15                 # the JSON keeps 15; the app shows the first 10
# Spot checks (2026-09-25) found these two topics match wrongly more often; the app marks them with "*".
LOW_PRECISION = {"robustness", "benchmark"}

# --------------------------------------------------------------------------------------------------
# Editions. `tocs` are dblp TOC keys; `procs` restricts to proceedings records where dblp lists two
# volumes on one TOC page. `official` is the organisers' accepted count, used for the coverage check;
# it must equal the row in data/stats/<series>.yml (pnpm validate checks this).
# --------------------------------------------------------------------------------------------------
SCOPE_MAIN = "主会"
SCOPE_NEURIPS = "主会；去掉了 Datasets & Benchmarks 和 Position 赛道的论文"
SCOPE_ACL = "主会长文和短文；Findings、demo、industry、学生研讨会不算"


def _official(value, src, source_url, quote):
    return dict(value=value, source_url=source_url, quote=quote, src=src, quote_check="snapshot")


EDITIONS: dict[str, dict] = {
    "iclr-2023": dict(series="iclr", venue="ICLR", year=2023, tocs=["conf/iclr/iclr2023"], scope=SCOPE_MAIN,
                      official=_official(1574, "iclr-2023-fact-sheet", "https://media.iclr.cc/Conferences/ICLR2023/ICLR2023-Fact_Sheet.pdf",
                                         "Record number of abstract submissions - 6,381 4,938 submissions 1,574 accepted papers ... 31% acceptance rate")),
    "iclr-2024": dict(series="iclr", venue="ICLR", year=2024, tocs=["conf/iclr/iclr2024"], scope=SCOPE_MAIN,
                      official=_official(2260, "iclr-2024-fact-sheet", "https://media.iclr.cc/Conferences/ICLR2024/ICLR2024-Fact_Sheet.pdf",
                                         "7262 submissions, 2260 accepted ... 31% acceptance rate (last year: 31%)")),
    "iclr-2025": dict(series="iclr", venue="ICLR", year=2025, tocs=["conf/iclr/iclr2025"], scope=SCOPE_MAIN,
                      official=_official(3704, "iclr-2025-fact-sheet", "https://media.iclr.cc/Conferences/ICLR2025/ICLR2025_Fact_Sheet.pdf",
                                         "11,603 submissions, 3704 accepted ... 32% acceptance rate (last year: 31%)")),
    "neurips-2023": dict(series="neurips", venue="NeurIPS", year=2023, tocs=["conf/nips/neurips2023"], track="neurips_main", scope=SCOPE_NEURIPS,
                         official=_official(3218, "neurips-2023-fact-sheet", "https://media.neurips.cc/Conferences/NeurIPS2023/NeurIPS2023-Fact_Sheet.pdf",
                                            "3,218 main conference track ... 12,343 main conference track ... Paper acceptance rate: ■ 26.1% main conference track")),
    "neurips-2024": dict(series="neurips", venue="NeurIPS", year=2024, tocs=["conf/nips/neurips2024"], track="neurips_main", scope=SCOPE_NEURIPS,
                         official=_official(4037, "neurips-2024-fact-sheet", "https://media.neurips.cc/Conferences/NeurIPS2024/NeurIPS2024-Fact_Sheet.pdf",
                                            "4,037 main conference track ... 15,671 main conference track ... Paper acceptance rate: ■ 25.8% main conference track")),
    "neurips-2025": dict(series="neurips", venue="NeurIPS", year=2025, tocs=["conf/nips/neurips2025"], track="neurips_main", scope=SCOPE_NEURIPS,
                         official=_official(5290, "neurips-2025-pc-reflections",
                                            "https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/",
                                            "The main track this year received 21,575 valid paper submissions, of which 5,290 were accepted. "
                                            "That is, the main track had an acceptance rate of 24.52%")),
    "cvpr-2023": dict(series="cvpr", venue="CVPR", year=2023, tocs=["conf/cvpr/cvpr2023"], scope=SCOPE_MAIN,
                      official=_official(2359, "cvpr-2023-front-matter", "https://www.computer.org/csdl/proceedings-article/cvpr/2023/012900z301/1POTbxllic8",
                                         "CVPR 2023 received 9155 submissions, a 12% increase from the 8161 submissions to CVPR 2022. ... "
                                         "At the end of this process, 2359 papers were accepted (25.8% acceptance rate).")),
    "cvpr-2024": dict(series="cvpr", venue="CVPR", year=2024, tocs=["conf/cvpr/cvpr2024"], scope=SCOPE_MAIN,
                      official=_official(2719, "cvpr-2024-front-matter", "https://www.computer.org/csdl/proceedings-article/cvpr/2024/530000z343/20hLmVNRbY4",
                                         "CVPR 2024 received 11,532 valid paper submissions, a 26% increase from CVPR 2023. ... "
                                         "At the end of this process, 2,719 papers were accepted, for a 23.6% overall acceptance rate.")),
    "cvpr-2025": dict(series="cvpr", venue="CVPR", year=2025, tocs=["conf/cvpr/cvpr2025"], scope=SCOPE_MAIN,
                      official=_official(2872, "cvpr-2025-front-matter", "https://www.computer.org/csdl/proceedings-article/cvpr/2025/436400z382/299bDhaj7A4",
                                         "CVPR 2025 received 13008 valid paper submissions, a 13% increase from last CVPR. ... "
                                         "At the end of this process, 2,872 papers were accepted, for a 22.1% overall acceptance rate.")),
    "acl-2023": dict(series="acl", venue="ACL", year=2023, tocs=["conf/acl/acl2023-1", "conf/acl/acl2023-2"],
                     procs=["conf/acl/2023-1", "conf/acl/2023-2"], scope=SCOPE_ACL,
                     official=_official(1074, "acl-2023-front-matter", "https://aclanthology.org/2023.acl-long.0.pdf",
                                        "In total, we considered 4864 (3872 long and 992 short) papers [...] We accepted 910 (23.50%) long and "
                                        "164 (16.53%) short papers for the main conference [...] To sum long and short papers, ACL 2023 "
                                        "accepted 1074 (22.08%) papers for the conference and 901 (40.60% including the papers for the main "
                                        "conference) papers for Findings.")),
    # dblp lists ACL 2024 Volume 2 (short papers, proceedings record conf/acl/2024short) on the SRW TOC page acl2024s.
    "acl-2024": dict(series="acl", venue="ACL", year=2024, tocs=["conf/acl/acl2024-1", "conf/acl/acl2024s"],
                     procs=["conf/acl/2024-1", "conf/acl/2024short"], scope=SCOPE_ACL,
                     official=_official(940, "acl-2024-front-matter", "https://aclanthology.org/2024.acl-long.0.pdf",
                                        "In total, the denominator for the acceptance rate calculation is 4244 + 3 + 160= 4407. Among these, "
                                        "2931 were committed to ACL. Among the committed papers, 940 were accepted to the Main Conference. "
                                        "The acceptance rate for Main Conference papers is therefore 940 / 4407 = 21.3%.")),
    "acl-2025": dict(series="acl", venue="ACL", year=2025, tocs=["conf/acl/acl2025-1", "conf/acl/acl2025-2"],
                     procs=["conf/acl/2025-1", "conf/acl/2025-2"], scope=SCOPE_ACL,
                     official=_official(1699, "acl-2025-front-matter", "https://aclanthology.org/2025.acl-long.0.pdf",
                                        "In total, there are 1,699 papers accepted to the Main Conference and 1,392 papers accepted to "
                                        "Findings. [...] In total, we had 8,360 unique submissions across the December 2024 and February 2025 "
                                        "ARR cycles of which 5,501 papers were committed to ACL. The acceptance rate is 20.3% for the Main "
                                        "Conference papers and a further 16.7% for Findings papers.")),
    "acl-2026": dict(series="acl", venue="ACL", year=2026, tocs=["conf/acl/acl2026-1", "conf/acl/acl2026-2"],
                     procs=["conf/acl/2026-1", "conf/acl/2026-2"], scope=SCOPE_ACL,
                     official=_official(2296, "acl-2026-front-matter", "https://aclanthology.org/2026.acl-long.0.pdf",
                                        "Acceptance Rate. In total, there are 2,296 papers accepted to the Main Conference and 2,163 papers "
                                        "accepted to Findings. [...] In total, we had 12,148 unique submissions across the October 2025 (1,630) "
                                        "and January 2026 ARR (10,518). The acceptance rate is 18.9% for Main Conference papers and 17.8% for "
                                        "Findings papers.")),
}
# Not generated yet because dblp is far from complete (TOC census, 2026-09-25). Re-run once coverage is >= 98%:
#   iclr-2026: 257 of 5,357 accepted papers in dblp;  cvpr-2026: 1,397 of 4,090.
MIN_COVERAGE, MAX_COVERAGE = 0.98, 1.02

# --------------------------------------------------------------------------------------------------
# Curated topic map (method v0.1.0). A title belongs to a topic if ANY pattern matches the normalised
# title (lower case, accents stripped, hyphens/slashes -> spaces). A pattern can be a (regex, requires)
# tuple: it then only counts if the title also matches topic `requires` (used for "alignment").
# --------------------------------------------------------------------------------------------------
TOPICS: list[dict] = [
    dict(id="llm", en="LLMs / language models", zh="大语言模型", pats=[
        r"\bllms?\b", r"\blarge language models?\b",
        r"\b(?<!vision )(?<!visual )(?<!video )(?<!vision and )(?<!image )language models?\b", r"\blms\b", r"\bslms?\b",
        r"\bchatgpt\b", r"\bgpt ?[234o]", r"\bllama\b", r"\bqwen\b", r"\bdeepseek\b"]),
    dict(id="multimodal", en="Multimodal / vision-language", zh="多模态 / 视觉-语言", pats=[
        r"\bmulti ?modal", r"\bcross ?modal", r"\bomni ?modal", r"\bvision ?(and )?language\b", r"\bvisual ?language\b",
        r"\bvlms?\b", r"\bmllms?\b", r"\blvlms?\b", r"\blmms?\b", r"\bimage ?text\b", r"\bvisual question answering\b",
        r"\bvqa\b", r"\bclip\b", r"\baudio ?visual\b", r"\bvision ?language ?action\b", r"\bvlas?\b"]),
    dict(id="diffusion", en="Diffusion / flow-matching models", zh="扩散模型 / 流匹配", pats=[
        r"\bdiffusion\b", r"\bscore ?based (generative|models?|diffusion)", r"\bflow matching\b", r"\brectified flows?\b",
        r"\bconsistency models?\b"]),
    dict(id="generation", en="Image / video / 3D generation & editing", zh="图像/视频/3D 生成与编辑", pats=[
        r"\btext ?to ?(image|video|3d|speech|audio|motion|music)\b",
        r"\b(image|video|3d|4d|motion|scene|audio|music|speech|human|avatar|layout|texture|shape|face|portrait|talking head|world) (generation|synthesis|editing)\b",
        r"\bimage editing\b", r"\bvideo editing\b", r"\bgenerative models?\b", r"\bgans?\b", r"\bgenerative adversarial\b",
        r"\bvaes?\b", r"\bvariational auto ?encoders?\b", r"\bnormali[sz]ing flows?\b"]),
    dict(id="rl", en="Reinforcement learning", zh="强化学习", pats=[
        r"\breinforcement learning\b", r"\brl\b", r"\bmarl\b", r"\brlhf\b", r"\brlvr\b", r"\bgrpo\b", r"\bppo\b",
        r"\bq ?learning\b", r"\bpolicy gradients?\b", r"\bpolicy optimi[sz]ation\b", r"\bactor ?critic\b", r"\boffline rl\b",
        r"\bmarkov decision process", r"\bmdps?\b"]),
    dict(id="agents", en="Agents (LLM / RL / multi-agent)", zh="智能体", pats=[
        r"\bagents?\b", r"\bagentic\b", r"\bmulti ?agent\b"]),
    dict(id="3d", en="3D vision (NeRF / Gaussian splatting / point clouds)", zh="3D 视觉（NeRF/高斯泼溅/点云）", pats=[
        r"\b3d\b", r"\b4d\b", r"\bgaussian splatting\b", r"\b3dgs\b", r"\bgaussians\b", r"\bnerfs?\b",
        r"\bneural radiance fields?\b", r"\bradiance fields?\b", r"\bpoint clouds?\b", r"\bnovel view synthesis\b",
        r"\bmesh(es)?\b", r"\bdepth estimation\b", r"\bmonocular depth\b", r"\bstereo\b", r"\bslam\b",
        r"\bsurface reconstruction\b", r"\bstructure from motion\b",
        r"\bmulti ?view (stereo|reconstruction|3d|geometry|diffusion|generation|synthesis|consistent|consistency)\b"]),
    dict(id="gs_nerf", en="Gaussian splatting / NeRF (neural rendering)", zh="高斯泼溅 / NeRF", pats=[
        r"\bgaussian splatting\b", r"\b3dgs\b", r"\bgaussians\b", r"\bnerfs?\b", r"\bneural radiance fields?\b",
        r"\bradiance fields?\b", r"\bneural rendering\b", r"\bnovel view synthesis\b"]),
    dict(id="safety_alignment", en="Safety & alignment", zh="安全与对齐", pats=[
        r"\bsafety\b", r"\bsafe\b", r"\bjailbreak", r"\bred ?teaming\b", r"\brlhf\b", r"\bdpo\b",
        r"\bpreference (optimi[sz]ation|learning|alignment|data|feedback)\b", r"\bharmful\b", r"\bharmless",
        r"\bguardrails?\b", r"\btrustworth", r"\bsuperalignment\b", r"\bmisalign", r"\breward (model|hacking)",
        (r"\balign(ment|ing|ed)?\b", "llm"), (r"\balign(ment|ing|ed)?\b", "multimodal"), (r"\balign(ment|ing|ed)?\b", "agents")]),
    dict(id="reasoning", en="Reasoning (CoT / math)", zh="推理（思维链/数学）", pats=[
        r"\breasoning\b", r"\breasoners?\b", r"\bchain ?of ?thoughts?\b", r"\bcot\b", r"\bmath\b", r"\bmathematical\b",
        r"\btheorem proving\b", r"\bthinking\b"]),
    dict(id="video", en="Video", zh="视频", pats=[r"\bvideos?\b"]),
    dict(id="graph", en="Graphs / GNNs", zh="图学习 / GNN", pats=[
        r"\bgraphs?\b", r"\bgnns?\b", r"\bgcns?\b", r"\bmessage passing\b", r"\bnode classification\b",
        r"\blink prediction\b", r"\bhypergraphs?\b"]),
    dict(id="transformer", en="Transformers / attention", zh="Transformer / 注意力", pats=[
        r"\btransformers?\b", r"\battention\b", r"\bvits?\b"]),
    dict(id="ssm", en="State-space models / Mamba", zh="状态空间模型 / Mamba", pats=[
        r"\bmamba\b", r"\bstate ?space models?\b", r"\bssms?\b", r"\blinear attention\b"]),
    dict(id="rag_retrieval", en="Retrieval / RAG", zh="检索 / 检索增强生成", pats=[
        r"\bretrieval\b", r"\bretrieval ?augmented\b", r"\brag\b", r"\bretrievers?\b"]),
    dict(id="efficiency", en="Efficiency (quantisation / pruning / distillation / KV cache)", zh="高效化（量化/剪枝/蒸馏/KV 缓存）", pats=[
        r"\bquantiz", r"\bquantis", r"\bpruning\b", r"\bprun(e|ed)\b", r"\bsparsit",
        r"\b(model|kv|token|context|prompt|network|llm|weight|activation|cache|gradient|vision token|visual token)s? compression\b",
        r"\bcompress(ing|ed)? (the )?(llms?|large|models?|neural|kv|tokens?|context|prompts?|networks?|transformers?|weights?)\b",
        r"\bsparse (attention|training|moe|models?|networks?|llms?|fine ?tuning|mixture|activation|transformers?|experts?)\b",
        r"\b(?<!dataset )(?<!data )distill", r"\bkv ?cache\b", r"\bspeculative decoding\b", r"\baccelerat\w* (\w+ ){0,2}(llms?|inference|training|decoding|diffusion|generation|sampling|models?|transformers?|attention|serving|reasoning)\b", r"\btoken (pruning|merging|reduction|compression)\b",
        r"\befficient (inference|training|fine ?tuning|llms?|transformers?|attention|serving|decoding|generation|video|reasoning)\b"]),
    dict(id="finetuning", en="Fine-tuning / PEFT / post-training", zh="微调 / 参数高效 / 后训练", pats=[
        r"\bfine ?tun", r"\bfinetun", r"\binstruction ?tun", r"\bparameter ?efficient\b", r"\bpeft\b", r"\blora\b",
        r"\badapters?\b", r"\bprompt tuning\b", r"\bpost ?training\b", r"\bsft\b"]),
    dict(id="icl_prompting", en="In-context learning / prompting", zh="上下文学习 / 提示", pats=[
        r"\bin ?context\b", r"\bicl\b", r"\bprompt", r"\bfew ?shot prompting\b"]),
    dict(id="robustness", en="Robustness & adversarial attacks", zh="鲁棒性与对抗攻击", pats=[
        r"\badversarial", r"\brobust", r"\bbackdoor", r"\bpoisoning\b", r"\battacks?\b", r"\bcertified\b"]),
    dict(id="privacy", en="Privacy / unlearning", zh="隐私 / 机器遗忘", pats=[
        r"\bprivacy\b", r"\bprivate\b", r"\bdifferential(ly)? priva", r"\bmembership inference\b", r"\bunlearning\b"]),
    dict(id="federated", en="Federated learning", zh="联邦学习", pats=[r"\bfederated\b"]),
    dict(id="interpretability", en="Interpretability / explainability", zh="可解释性", pats=[
        r"\binterpretab", r"\bexplainab", r"\bexplanations?\b", r"\bmechanistic\b", r"\bsparse auto ?encoders?\b",
        r"\bsaes?\b", r"\bcircuits?\b", r"\bprobing\b", r"\bsaliency\b", r"\bconcept (bottleneck|based|activation)"]),
    dict(id="hallucination", en="Hallucination & factuality", zh="幻觉与事实性", pats=[
        r"\bhallucinat", r"\bfactual", r"\bfact ?check", r"\bmisinformation\b", r"\bfaithful"]),
    dict(id="benchmark", en="Benchmarks, datasets & evaluation", zh="基准、数据集与评测", pats=[
        r"\bbenchmark", r"\bdatasets?\b", r"\bevaluat", r"\bleaderboards?\b", r"\bcorpus\b", r"\bcorpora\b"]),
    dict(id="self_supervised", en="Self-supervised / contrastive / representation learning", zh="自监督 / 对比 / 表征学习", pats=[
        r"\bself ?supervis", r"\bcontrastive\b", r"\bmasked (image|auto ?encoders?|modell?ing)\b", r"\brepresentation learning\b"]),
    dict(id="continual", en="Continual learning", zh="持续学习", pats=[
        r"\bcontinual\b", r"\blifelong\b", r"\bincremental learning\b", r"\bclass ?incremental\b", r"\bcatastrophic forgetting\b"]),
    dict(id="ood", en="Distribution shift / OOD / domain adaptation", zh="分布偏移 / 分布外 / 域适应", pats=[
        r"\bout ?of ?distribution\b", r"\bood\b", r"\bdomain (adaptation|generali[sz]ation|shifts?)\b",
        r"\bdistribution(al)? shifts?\b", r"\btest ?time (adaptation|training)\b", r"\bsource ?free\b", r"\banomal"]),
    dict(id="theory_optim", en="Optimisation & learning theory", zh="优化与学习理论", pats=[
        r"\bconvergence\b", r"\bgradient descent\b", r"\bsgd\b", r"\bstochastic (optimi[sz]ation|gradients?)\b",
        r"\bnon ?convex\b", r"\bconvex\b", r"\bgenerali[sz]ation bounds?\b", r"\bsample complexity\b", r"\bregret\b",
        r"\bminimax\b", r"\boptimi[sz]ers?\b", r"\bprovabl", r"\btheor(y|etical)\b", r"\blower bounds?\b", r"\bbandits?\b"]),
    dict(id="causal", en="Causality", zh="因果", pats=[
        r"\bcausal", r"\bcounterfactual", r"\btreatment effects?\b", r"\binterventional\b"]),
    dict(id="time_series", en="Time series / forecasting", zh="时间序列 / 预测", pats=[
        r"\btime ?series\b", r"\bforecast", r"\bspatio ?temporal\b"]),
    dict(id="ai4science", en="AI for science (molecules / proteins / PDEs)", zh="科学智能（分子/蛋白质/PDE）", pats=[
        r"\bmolecul", r"\bprotein", r"\bdrug\b", r"\bchemi", r"\bmaterials? (discovery|design|science)\b", r"\bcrystal",
        r"\bpdes?\b", r"\bpartial differential\b", r"\bneural operators?\b", r"\bphysics ?informed\b", r"\bweather\b",
        r"\bclimate\b", r"\bgenom", r"\bsingle ?cell\b", r"\bdna\b", r"\brna\b"]),
    dict(id="robotics", en="Robotics / embodied AI", zh="机器人 / 具身智能", pats=[
        r"\brobot", r"\bembodied\b", r"\bmanipulation\b", r"\bgrasp", r"\blocomotion\b", r"\bvision ?language ?action\b",
        r"\bvlas?\b", r"\bnavigation\b", r"\bimitation learning\b", r"\bhumanoids?\b", r"\bdexterous\b"]),
    dict(id="driving", en="Autonomous driving", zh="自动驾驶", pats=[
        r"\bautonomous driving\b", r"\bself ?driving\b", r"\bdriving\b", r"\bbev\b", r"\bbird'?s ?eye ?view\b",
        r"\blidar\b", r"\btrajectory prediction\b", r"\bmotion forecasting\b", r"\boccupancy\b", r"\bvehicles?\b"]),
    dict(id="segmentation", en="Segmentation", zh="分割", pats=[r"\bsegment", r"\bsam\b", r"\bmatting\b"]),
    dict(id="detection", en="Object detection", zh="目标检测", pats=[
        r"\bobject detect", r"\bdetr\b", r"\byolo", r"\bdetectors?\b",
        r"\b(3d|open ?vocabulary|open ?world|oriented|camouflaged|salient|pedestrian|small|monocular|multi ?view) (object )?detection\b"]),
    dict(id="restoration", en="Low-level vision (restoration / super-resolution)", zh="底层视觉（复原/超分）", pats=[
        r"\bsuper ?resolution\b", r"\bdeblur", r"\bderain", r"\bdehaz", r"\brestoration\b", r"\blow ?light\b",
        r"\binpainting\b", r"\bimage enhancement\b", r"\b(image|video) denois"]),
    dict(id="human", en="Pose estimation, human motion & avatars", zh="姿态估计、人体动作与数字人", pats=[
        r"\bposes?\b", r"\bhuman motion\b", r"\bmotion generation\b", r"\bavatars?\b", r"\bhands?\b", r"\bgestures?\b",
        r"\bhuman ?object interaction\b", r"\bhuman mesh\b"]),
    dict(id="tracking", en="Tracking / re-identification", zh="跟踪 / 重识别", pats=[
        r"\btracking\b", r"\btrackers?\b", r"\bre ?identification\b", r"\bre ?id\b"]),
    dict(id="open_world", en="Zero/few-shot & open-vocabulary", zh="零样本 / 小样本 / 开放词表", pats=[
        r"\bopen ?vocabulary\b", r"\bzero ?shot\b", r"\bfew ?shot\b", r"\bopen ?world\b", r"\bopen ?set\b"]),
    dict(id="speech_audio", en="Speech & audio", zh="语音与音频", pats=[
        r"\bspeech\b", r"\baudio\b", r"\basr\b", r"\bspoken\b", r"\btts\b", r"\bmusic\b", r"\bsound\b", r"\bspeakers?\b"]),
    dict(id="multilingual", en="Multilingual / machine translation", zh="多语言 / 机器翻译", pats=[
        r"\bmultilingual\b", r"\bcross ?lingual\b", r"\b(?<!image )(?<!video )(?<!domain )(?<!style )(?<!image to image )translation\b", r"\blow ?resource\b", r"\bcode ?switch",
        r"\b(chinese|arabic|african|indic|hindi|japanese|korean|indonesian|vietnamese|bangla|bengali|persian|swahili|urdu|german|french|spanish)\b"]),
    dict(id="code", en="Code generation / software", zh="代码生成 / 软件", pats=[
        r"\bcode\b", r"\bprogram (synthesis|repair|generation)\b", r"\bprogramming\b", r"\bsoftware\b", r"\bsql\b"]),
    dict(id="medical", en="Medical / clinical", zh="医学 / 医疗", pats=[
        r"\bmedical\b", r"\bclinical\b", r"\bhealth", r"\bpatholog", r"\bradiolog", r"\bmri\b", r"\bct\b",
        r"\bbiomedical\b", r"\bsurgical\b", r"\bdiseases?\b", r"\bcancer\b", r"\behrs?\b"]),
    dict(id="moe", en="Mixture of experts", zh="混合专家（MoE）", pats=[r"\bmixture ?of ?experts?\b", r"\bmoes?\b"]),
    dict(id="uncertainty", en="Uncertainty / calibration / Bayesian", zh="不确定性 / 校准 / 贝叶斯", pats=[
        r"\buncertaint", r"\bcalibrat", r"\bconformal\b", r"\bbayesian\b"]),
    dict(id="knowledge_ie", en="Knowledge graphs / information extraction", zh="知识图谱 / 信息抽取", pats=[
        r"\bknowledge graphs?\b", r"\bknowledge ?bases?\b", r"\binformation extraction\b", r"\bentit(y|ies)\b",
        r"\brelation extraction\b", r"\bevent extraction\b"]),
    dict(id="dialogue", en="Dialogue / conversational", zh="对话系统", pats=[
        r"\bdialog", r"\bconversation", r"\bchatbots?\b"]),
    dict(id="qa", en="Question answering", zh="问答", pats=[r"\bquestion answering\b", r"\bqa\b", r"\bquestions?\b"]),
    dict(id="summarization", en="Summarisation", zh="摘要生成", pats=[r"\bsummari[sz]"]),
    dict(id="fairness_bias", en="Fairness & social bias", zh="公平性与社会偏见", pats=[
        r"\bfairness\b", r"\bfair\b", r"\bdebias", r"\bstereotyp",
        r"\b(social|gender|racial|political|cultural|demographic) bias"]),
    dict(id="scaling", en="Scaling laws & test-time compute", zh="规模定律与测试时计算", pats=[
        r"\bscaling laws?\b", r"\btest ?time (scaling|compute)\b", r"\binference ?time (scaling|compute)\b",
        r"\bscaling (up )?(test|inference)"]),
    dict(id="world_models", en="World models", zh="世界模型", pats=[r"\bworld models?\b"]),
]
TOPIC_BY_ID = {t["id"]: t for t in TOPICS}

# --------------------------------------------------------------------------------------------------
# n-gram phrase extraction (discovery only): synonym canonicalisation + RAKE-style chunking.
# --------------------------------------------------------------------------------------------------
PHRASE_SYNONYMS: list[tuple[str, str]] = [   # applied in order to the normalised title
    (r"\bmulti ?modal large language models?\b|\bmllms?\b|\blvlms?\b|\blarge vision ?language models?\b", " mllm "),
    (r"\bvision ?language models?\b|\bvlms?\b", " vlm "),
    (r"\bvision ?language ?action( models?)?\b|\bvlas?\b", " vla "),
    (r"\blarge language models?\b|\bllms?\b", " llm "),
    (r"\b3d gaussian splatting\b|\bgaussian splatting\b|\b3dgs\b", " gaussian_splatting "),
    (r"\bneural radiance fields?\b|\bnerfs?\b", " nerf "),
    (r"\bmulti ?agent reinforcement learning\b|\bmarl\b", " marl "),
    (r"\breinforcement learning from human feedback\b|\brlhf\b", " rlhf "),
    (r"\breinforcement learning\b", " rl "),
    (r"\bdiffusion models?\b", " diffusion "),
    (r"\bgraph neural networks?\b|\bgnns?\b", " gnn "),
    (r"\bin ?context learning\b", " in_context_learning "),
    (r"\bin ?context\b", " in_context "),
    (r"\blong ?context\b", " long_context "),
    (r"\bchain ?of ?thoughts?\b", " chain_of_thought "),
    (r"\bretrieval ?augmented generation\b|\brag\b", " rag "),
    (r"\bmixture ?of ?experts?\b|\bmoes?\b", " moe "),
    (r"\btext ?to ?image\b", " text_to_image "),
    (r"\btext ?to ?video\b", " text_to_video "),
    (r"\bfine ?tuning\b|\bfinetuning\b", " fine_tuning "),
    (r"\bvision transformers?\b|\bvits?\b", " vit "),
    (r"\bfederated learning\b", " federated_learning "),
    (r"\bself ?supervised\b", " self_supervised "),
    (r"\bout ?of ?distribution\b|\bood\b", " ood "),
    (r"\bzero ?shot\b", " zero_shot "),
    (r"\bfew ?shot\b", " few_shot "),
    (r"\bopen ?vocabulary\b", " open_vocabulary "),
    (r"\bmulti ?agent\b", " multi_agent "),
    (r"\bpoint clouds?\b", " point_cloud "),
    (r"\bautonomous driving\b", " autonomous_driving "),
    (r"\bquestion answering\b", " question_answering "),
    (r"\bmachine translation\b", " machine_translation "),
    (r"\bknowledge graphs?\b", " knowledge_graph "),
    (r"\bstate ?space models?\b|\bssms?\b", " ssm "),
    (r"\btime ?series\b", " time_series "),
    (r"\btest ?time\b", " test_time "),
    (r"\bmulti ?modal\b", " multimodal "),
    (r"\bmulti ?view\b", " multi_view "),
    (r"\bmulti ?task\b", " multi_task "),
    (r"\bpre ?training\b|\bpretraining\b", " pretraining "),
    (r"\bpre ?trained\b", " pretrained "),
    (r"\bpost ?training\b", " post_training "),
    (r"\bsparse auto ?encoders?\b|\bsaes?\b", " sparse_autoencoder "),
    (r"\bsuper ?resolution\b", " super_resolution "),
    (r"\bneural networks?\b", " neural_network "),
    (r"\bdeep learning\b", " deep_learning "),
    (r"\bmachine learning\b", " machine_learning "),
    (r"\blanguage models?\b|\blms\b", " language_model "),
]
# Words that break a phrase (English function words + generic CS title verbs/adjectives).
STOPWORDS = set("""
a an the and or nor but of for to in on at by from with without within into onto over under via as vs versus than
is are be been being was were do does did can could should would will may might must shall not no yes
it its this that these those their our your we you they them he she his her one two three all any each every both
what when where which who whom whose why how if then so such also only just more most less least very much many
few new novel toward towards through across between beyond among against around about after before during while
up down out off again further once here there other another same own too
improving improve improved improves enhancing enhance enhanced boosting boost rethinking revisiting exploring
leveraging leverage enabling enable achieving achieve making make makes using use uses used based driven aware
efficient effective simple simply fast faster better scalable unified universal general generalized generalizable
adaptive adaptively robustly provably principled practical large small scale scaling-free free
learn learns learned learnable learnability study studies understanding understand analysis analyzing analysing
approach approaches method methods framework frameworks system systems technique techniques strategy strategies
via e.g i.e case beyond need needs all towards meets matter matters really truly
""".split())
# Tokens that are too generic to be a phrase on their own (unigram) but fine inside a longer phrase.
GENERIC_UNIGRAMS = set("""
learning model network neural deep data task training generation image images representation representations
performance problem problems optimization inference prediction information knowledge feature features space
structure structured estimation modeling modelling detection recognition classification control policy
language visual vision text neural_network deep_learning machine_learning language_model models tasks
understanding reasoning? dynamic dynamics complex high low multi single self cross time
guided level view object semantic function linear optimal algorithm domain supervised long context grained fine
aware conditioned conditional driven perspective
""".replace("?", "").split())
NO_SINGULAR = {"physics", "dynamics", "robotics", "statistics", "mathematics", "semantics", "kinetics", "economics",
               "linguistics", "graphics", "diagnostics", "ethics", "genomics", "news", "series", "species", "bias",
               "lens", "gas", "analysis", "basis", "axis", "synthesis", "hypothesis", "diagnosis", "class", "loss",
               "process", "corpus", "focus", "consensus", "status", "virus", "continuous", "various", "previous",
               "anomalous", "autonomous", "heterogeneous", "homogeneous", "simultaneous", "towards", "gaussians",
               "this", "its", "llms", "less", "across", "is", "was", "has", "does", "cvs", "ms"}


def normalise(title: str) -> str:
    t = unicodedata.normalize("NFKD", title)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.lower().strip()
    t = re.sub(r"\.$", "", t)
    t = t.replace("’", "'").replace("‘", "'")
    t = re.sub(r"[‐-―\-/]", " ", t)          # hyphens, dashes, slashes -> space
    t = re.sub(r"[^a-z0-9'_ ]+", " ", t)                # drop punctuation (keeps 3d, gpt 4)
    return re.sub(r"\s+", " ", t).strip()


LEMMA = {"evaluating": "evaluation", "evaluate": "evaluation", "benchmarking": "benchmark", "agentic": "agent",
         "reasoner": "reasoning", "aligning": "alignment", "aligned": "alignment", "generating": "generation",
         "diffusion_model": "diffusion", "segmenting": "segmentation"}


def singular(tok: str) -> str:
    tok = LEMMA.get(tok, tok)
    if tok in NO_SINGULAR or "_" in tok or len(tok) <= 3:
        return tok
    if tok.endswith("ies") and len(tok) > 4:
        return tok[:-3] + "y"
    if tok.endswith(("ss", "us", "is", "ics")):
        return tok
    if tok.endswith("s"):
        return tok[:-1]
    return tok


COMPILED = []
for _t in TOPICS:
    _plain, _cond = [], []
    for _p in _t["pats"]:
        if isinstance(_p, tuple):
            _cond.append((re.compile(_p[0]), _p[1]))
        else:
            _plain.append(_p)
    COMPILED.append((_t["id"], re.compile("|".join(_plain)) if _plain else None, _cond))
SYN_COMPILED = [(re.compile(p), r) for p, r in PHRASE_SYNONYMS]


def topics_for(norm_title: str) -> set[str]:
    hits: set[str] = set()
    for tid, rx, _ in COMPILED:
        if rx is not None and rx.search(norm_title):
            hits.add(tid)
    for tid, _, cond in COMPILED:      # conditional patterns (second pass, needs first-pass hits)
        if tid in hits:
            continue
        for rx, req in cond:
            if req in hits and rx.search(norm_title):
                hits.add(tid)
                break
    return hits


def phrases_for(norm_title: str) -> set[str]:
    t = norm_title
    for rx, rep in SYN_COMPILED:
        t = rx.sub(rep, t)
    toks = [singular(w.strip("'")) for w in t.split()]
    chunks, cur = [], []
    for w in toks:
        if not w or w in STOPWORDS or w.isdigit():
            if cur:
                chunks.append(cur)
            cur = []
        else:
            cur.append(w)
    if cur:
        chunks.append(cur)
    out: set[str] = set()
    for ch in chunks:
        for n in (1, 2, 3):
            for i in range(len(ch) - n + 1):
                g = ch[i:i + n]
                if n == 1 and (g[0] in GENERIC_UNIGRAMS or len(g[0]) < 3):
                    continue
                if n > 1 and all(x in GENERIC_UNIGRAMS for x in g):
                    continue
                out.add(" ".join(g))
    return out




# --------------------------------------------------------------------------------------------------
# Fetching (polite: User-Agent, >= 2 s between requests, 429/503 + Retry-After, on-disk cache)
# --------------------------------------------------------------------------------------------------
_last_request = [0.0]


def http_get(url: str, accept: str) -> tuple[int, str, bytes]:
    for attempt in range(MAX_RETRIES + 1):
        wait = _last_request[0] + MIN_DELAY_S - time.time()
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
        _last_request[0] = time.time()
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.status, r.headers.get("Content-Type", ""), r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < MAX_RETRIES:
                ra = e.headers.get("Retry-After", "60")
                delay = int(ra) if ra.isdigit() else 60
                print(f"  HTTP {e.code}; honouring Retry-After={delay}s", file=sys.stderr)
                time.sleep(min(delay, 600))
                continue
            raise
    raise RuntimeError("unreachable")


def sparql_query(ed: dict) -> str:
    tocs = " ".join(f"<https://dblp.org/db/{k}>" for k in ed["tocs"])
    return ("PREFIX dblp: <https://dblp.org/rdf/schema#>\n"
            "SELECT ?publ ?title ?toc ?proc ?page WHERE {\n"
            f"  VALUES ?toc {{ {tocs} }}\n"
            "  ?publ dblp:listedOnTocPage ?toc .\n"
            "  ?publ a dblp:Inproceedings .\n"
            "  ?publ dblp:title ?title .\n"
            "  OPTIONAL { ?publ dblp:publishedAsPartOf ?proc . }\n"
            "  OPTIONAL { ?publ dblp:primaryDocumentPage ?page . }\n"
            "}")


def fetch_sparql(cache_dir: str, key: str, ed: dict, refresh: bool, offline: bool) -> dict:
    path = os.path.join(cache_dir, f"sparql_{key}.json")
    if os.path.exists(path) and not refresh:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    if offline:
        raise SystemExit(f"{key}: not cached in {cache_dir} and --offline given")
    q = sparql_query(ed)
    url = SPARQL_ENDPOINT + "?" + urllib.parse.urlencode({"query": q})
    status, ctype, body = http_get(url, "application/sparql-results+json")
    if "json" not in ctype:
        raise SystemExit(f"{key}: unexpected content type {ctype!r} from {SPARQL_ENDPOINT}")
    res = json.loads(body)
    rows = [dict(publ=b["publ"]["value"], title=b["title"]["value"], toc=b["toc"]["value"],
                 proc=b.get("proc", {}).get("value"), page=b.get("page", {}).get("value"))
            for b in res["results"]["bindings"]]
    payload = dict(source="dblp SPARQL endpoint", endpoint=SPARQL_ENDPOINT, query=q,
                   retrieved_at=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                   http_status=status, rows=rows)
    os.makedirs(cache_dir, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=0)
    return payload


# --------------------------------------------------------------------------------------------------
# Counting
# --------------------------------------------------------------------------------------------------
def select_papers(ed: dict, rows: list[dict]) -> list[dict]:
    seen, kept = set(), []
    procs = {f"https://dblp.org/rec/{p}" for p in ed.get("procs", [])}
    for r in rows:
        if r["publ"] in seen:
            continue
        seen.add(r["publ"])
        if procs and r["proc"] not in procs:
            continue          # another volume listed on the same TOC page
        if ed.get("track") == "neurips_main":
            page = r.get("page") or ""
            if "Datasets_and_Benchmarks" in page or "Position" in page:
                continue
        kept.append(r)
    return kept


def count(ed: dict, payload: dict) -> dict:
    papers = select_papers(ed, payload["rows"])
    tcount, pcount, examples = Counter(), Counter(), {}
    for p in papers:
        nt = normalise(p["title"])
        for tid in topics_for(nt):
            tcount[tid] += 1
            examples.setdefault(tid, [])
            if len(examples[tid]) < 3:
                examples[tid].append(p["title"])
        for ph in phrases_for(nt):
            pcount[ph] += 1
    return dict(n=len(papers), topics=tcount, phrases=pcount, examples=examples, retrieved_at=payload["retrieved_at"])


def pct(x: float) -> float:
    return round(100.0 * x, 1)


def iso_z(ts: str) -> str:
    return dt.datetime.fromisoformat(ts).astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def edition_json(key: str, ed: dict, c: dict, prev: dict | None) -> dict:
    n = c["n"]
    official = ed["official"]
    topics = []
    for tid, k in sorted(c["topics"].items(), key=lambda kv: (-kv[1], kv[0]))[:TOP_N]:
        t = TOPIC_BY_ID[tid]
        row = dict(rank=len(topics) + 1, id=tid, label_zh=t["zh"], label_en=t["en"], count=k, share_pct=pct(k / n))
        if prev is not None:
            pk = prev["topics"].get(tid, 0)
            row["prev"] = dict(year=ed["year"] - 1, count=pk, share_pct=pct(pk / prev["n"]),
                               delta_pp=round(pct(k / n) - pct(pk / prev["n"]), 1))
        if tid in LOW_PRECISION:
            row["low_precision"] = True
        row["examples"] = c["examples"].get(tid, [])
        topics.append(row)
    return dict(
        schema=1, edition=key, series=ed["series"], year=ed["year"], method_version=METHOD_VERSION,
        citation_zh=(f"来源：dblp 收录的 {ed['venue']} {ed['year']} 录用论文标题（CC0），NextVenue 按关键词归类统计"
                     f"（方法 v{METHOD_VERSION}，一篇论文可计入多个主题）"),
        scope_zh=ed["scope"],
        source=dict(name="dblp", license="CC0 1.0", tocs=[f"https://dblp.org/db/{t}" for t in ed["tocs"]],
                    retrieved_at=iso_z(c["retrieved_at"])),
        papers_used=n, official_accepted=official, coverage=round(n / official["value"], 4), topics=topics)


def taxonomy_json() -> dict:
    return dict(
        method_version=METHOD_VERSION,
        note_zh="只看标题；一篇论文可以算进几个主题；带条件的写法只在另一个主题也命中时才算。",
        low_precision=sorted(LOW_PRECISION),
        topics=[dict(id=t["id"], label_zh=t["zh"], label_en=t["en"],
                     patterns=[p if isinstance(p, str) else f"{p[0]}  [only if topic '{p[1]}' also matches]" for p in t["pats"]])
                for t in TOPICS])


def dumps(doc: dict) -> str:
    return json.dumps(doc, ensure_ascii=False, indent=1) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--edition", action="append", help="edition key, e.g. iclr-2025 (repeatable); prints it")
    ap.add_argument("--refresh", action="store_true", help="ignore the cache and re-fetch")
    ap.add_argument("--offline", action="store_true", help="use cached responses only")
    ap.add_argument("--check", action="store_true", help="compare with the files in data/topics instead of writing")
    ap.add_argument("--qa", action="store_true", help="also write ranks, n-gram phrases and examples to the cache dir")
    ap.add_argument("--cache-dir", default=DEFAULT_CACHE)
    args = ap.parse_args()

    counts = {}
    for key, ed in EDITIONS.items():
        cached = os.path.exists(os.path.join(args.cache_dir, f"sparql_{key}.json"))
        print(f"{key}: {'cache' if cached and not args.refresh else 'fetching'}", file=sys.stderr)
        counts[key] = count(ed, fetch_sparql(args.cache_dir, key, ed, args.refresh, args.offline))

    docs = {}
    for key, ed in EDITIONS.items():
        prev_key = f"{ed['series']}-{ed['year'] - 1}"
        prev = counts.get(prev_key) if prev_key in EDITIONS else None
        doc = edition_json(key, ed, counts[key], prev)
        if not MIN_COVERAGE <= doc["coverage"] <= MAX_COVERAGE:
            raise SystemExit(f"{key}: dblp covers {doc['coverage']:.1%} of the official count; not writing it")
        docs[key] = doc

    if args.edition:
        for key in args.edition:
            d = docs[key]
            print(f"\n== {key}: {d['papers_used']} papers, coverage {d['coverage']:.1%}")
            for t in d["topics"]:
                delta = f"  {t['prev']['delta_pp']:+.1f} pp" if "prev" in t else ""
                print(f"  {t['rank']:>2}. {t['label_zh']:<24} {t['count']:>5}  {t['share_pct']:>5.1f}%{delta}")
        return

    files = {f"{k}.json": dumps(d) for k, d in docs.items()}
    files["taxonomy.json"] = dumps(taxonomy_json())
    if args.check:
        stale = [f for f, text in files.items()
                 if not os.path.exists(os.path.join(OUT_DIR, f)) or open(os.path.join(OUT_DIR, f), encoding="utf-8").read() != text]
        if stale:
            raise SystemExit("data/topics is out of date: " + ", ".join(stale))
        print(f"data/topics matches ({len(files)} files)", file=sys.stderr)
        return
    os.makedirs(OUT_DIR, exist_ok=True)
    for f, text in files.items():
        with open(os.path.join(OUT_DIR, f), "w", encoding="utf-8") as fh:
            fh.write(text)
    print(f"wrote {len(files)} files to {os.path.relpath(OUT_DIR, ROOT)}", file=sys.stderr)
    if args.qa:
        qa = {k: dict(papers=c["n"], topics=dict(c["topics"].most_common()),
                      phrases=dict(c["phrases"].most_common(60))) for k, c in counts.items()}
        with open(os.path.join(args.cache_dir, "qa.json"), "w", encoding="utf-8") as fh:
            json.dump(qa, fh, ensure_ascii=False, indent=1)
        print(f"wrote QA to {os.path.join(args.cache_dir, 'qa.json')}", file=sys.stderr)


if __name__ == "__main__":
    main()
