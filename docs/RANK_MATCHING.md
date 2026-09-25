# 等级标签匹配报告

> 2026-09-25 更新：按店主决定不再使用中国自动化学会（CAA）目录（其官网写“版权所有 不得转载”），`data/ranks/caa2024.yml` 已删除，下文中 CAA 的标签和条目已删去。

生成日期：2026-09-25。数据：ccfddl commit `b6d3e8e91e671f30fb07644e413424bdd8e4e641`（as-of 2026-09-25）、`data/ranks/` 的三份目录、`data/ranks/mapping.yml`。

这份报告说明每个系列的等级标签是怎么挂上的、哪些是人工判断、哪些还没解决。标签规则见 `docs/DATA_GUIDE.md` §9.4：标签只来自三份目录（CCF、CAAI、科协），从不猜；CORE、THCPL 只照抄 ccfddl，界面标"取自 ccfddl"；ccfddl 的 CCF 值只用来对照，不显示。

重新生成清单：`pnpm ranks:report`（加 `--unlinked` 列出还没有系列的目录条目，加 `--json` 给脚本用）。

## 1. 结论

- **系列**：499 个（2026-09-25 第二轮）：438 个之外，新建了 CCF 第七版 57 个 ccfddl 没有的会（照目录条目建，没有届次）和 ESMO、ESC Congress、ECS、NAM 四个医学、化学会议。ccfddl 导入（commit b6d3e8e，as-of 2026-09-25）建了 345 个上游系列和 291 个上游届次；之后各学科整理步骤核对官网，把一部分改成 curated，并新建了工程、医学等学科的系列，现在还是上游的届次 251 个。
- **有标签的系列**：410 个至少有一份目录的标签；算上 ccfddl 的 CORE/THCPL，426 个有标签。
- **各目录**：CCF 387 个系列（A 58、B 133、C 196；386 个条目，ETAPS 一条同时挂在 etaps 和 TACAS 上，TACAS 带限定语"ETAPS 成员会"）；CAAI 133 个；科协 4 个（ccc-control、cac、prcv、internetware，只属于 2025 届，数据里没有 2025 届，所以列表里暂时看不到）；CORE 279 个、THCPL 201 个（取自 ccfddl）。
- **HSCC 和 CAV 都在**：HSCC（2027 年起 HSCC+ICCPS）CCF B（手工挂，目录仍写 HSCC）；CAV CCF A。
- **匹配报告**：有歧义 0、只撞缩写或 dblp 0、一条被几个系列抢 0。本轮在 `mapping.yml` 加了 11 条 links、3 条 not（§3）。
- **CCF 以第七版为准**：ccfddl 的 CCF 值和第七版在其余所有系列上一致；2 处不一致，按第七版不显示 CCF（§2）。
- **还没有系列的目录条目**：CCF 0 条（`pnpm validate` 现在要求每个 CCF 条目都有系列）、CAAI 25 条、科协 702 条（§6）。
- **许可说明不进 App**：三份目录的许可说明只留在 `data/ranks/*.yml` 和这份文档里给维护者看；App 的弹层只写目录名、版次、发布日期、官方链接和发布方自己的说明。

## 2. CCF 第七版和 ccfddl 的 CCF 值

ccfddl 每个系列带一个 CCF 值。导入后逐个和第七版对照：两边都有的全部一致；下面是不一致或需要解释的。**显示一律以第七版为准**，ccfddl 的值不上界面。

| 系列 | ccfddl 写的 CCF | CCF 第七版 | 处理 |
|---|---|---|---|
| apweb-waim | C | 没有 APWeb-WAIM 这一条；分列 APWeb（C）和 WAIM（C），第 5 类第 37 页 | 手工挂 APWeb，显示 CCF C（§3） |
| sigspatial | C | “SIGSPATIAL：ACM Special Interest Group on Spatial Information”（C，第 10 类第 72 页），用学会名指它的 GIS 年会 | 手工挂，显示 CCF C（§3） |
| dfrws-apac | C | **没有这一条**。只有 DFRWS（C，第 3 类第 22 页，dblp conf/dfrws） | 不显示 CCF。DFRWS APAC 是 DFRWS 的亚太分会，目录那一条是否包括它，没有原文可依（§5） |
| ijcar | B | **没有这一条**。只有 CADE（B，第 6 类第 42 页）；CADE 偶数年并入 IJCAR | 不显示 CCF。ccfddl 的 B 是从 CADE 推出来的，要不要写成“CCF B（经 CADE）”由人决定（§5） |

反方向（第七版有等级、ccfddl 写 N）：没有。

## 3. 本轮写进 `mapping.yml` 的

### 3.1 手工挂上（links）

| 系列 | 目录条目 | 显示 | 为什么自动匹配挂不上 |
|---|---|---|---|
| sigspatial | CCF 第七版 sigspatial：SIGSPATIAL ACM Special Interest Group on Spatial Information | CCF C | 目录用学会名，全称对不上 |
| apweb-waim | CCF 第七版 apweb：APWeb Asia Pacific Web Conference | CCF C | 两会合办，目录分列两条；同为 C，挂 APWeb 一条（解读） |
| apweb-waim | CAAI 2024 apweb：APWeb Asia Pacific Web Conference | CAAI C | 同上 |
| ijcnlp | CAAI 2024 aaclijcnlp：AACL/IJCNLP Conference of the Asia-Pacific Chapter of the Association for Computational Linguistics / International Joint Conference on Natural | CAAI C | CAAI 把 AACL 和 IJCNLP 写成一条，PDF 里全称折断 |
| iss | CAAI 2024 its：ITS ACM International Conference on Interactive Tabletops and Surfaces | CAAI B | CAAI 仍写旧名 ITS；本来靠 dblp 键已自动挂上，写明改名来历 |
| prcv | 科协 2025 417： The 8th Chinese Conference on Pattern Recognition and Computer Vision PRCV 2025 | 科协（只属于 2025 届） | 科协写的是具体一届的全称（带届次和 PRCV 2025），没有缩写字段 |
| internetware | 科协 2025 385： International Conference on Internetware | 科协（只属于 2025 届） | 科协写 International Conference on Internetware，CCF 写 Asia-Pacific Symposium on Internetware |
| etaps | CCF 第七版 etaps：ETAPS European Joint Conferences on Theory and Practice of Software | CCF B | 本来能自动挂；因为 TACAS 也挂这一条，写明以免被当成占用 |
| tacas | CCF 第七版 etaps：ETAPS European Joint Conferences on Theory and Practice of Software | CCF B（ETAPS 成员会） | CCF 只列联合会议 ETAPS（解读，带限定语） |

更早写好的 links 仍然有效：hscc → CCF、ccc-control → 科协 314、cac → 科协 440。

### 3.2 永远不挂（not）

| 系列 | 目录条目 | 那一条其实是 |
|---|---|---|
| its-wc | CAAI 2024 its（ITS） | CAAI 的 ITS 是 ACM Interactive Tabletops and Surfaces（人机交互），不是 ITS World Congress（智能交通世界大会）。 |
| ccc-control | CCF 第七版 ccc（CCC） | CCF 的 CCC 是 Conference on Computational Complexity（计算复杂性），不是中国控制会议；中国控制会议没有 CCF 等级。 |
| ccs | 科协 2025 377（CCS） | 科协 2025 目录第 377 条 CCS 是中国电子学会的“2025网络空间安全学术大会”（Conference on Cyberspace Security），不是 ACM CCS。 |
| 3dv | 科协 2025 416（无缩写） | 科协 2025 目录第 416 条是中国图象图形学学会的“第四届中国三维视觉大会（3DV 2025）”，不是 International Conference on 3D Vision。 |

## 4. 自动匹配里全称对不上、人工看过的

下面这些是靠 dblp 键加缩写（3 分）、dblp 键加相近全称（2 分）或缩写加相近全称（1 分）自动挂上的，目录全称和系列全称差得比较多。逐条看过：都是同一个会，差别来自改名、目录写法或 ccfddl 的写法（包括 ccfddl 的拼写错误）。

| 系列 | 标签 | 目录写法 | 本系列写法 |
|---|---|---|---|
| aamas | CCF B | International Joint Conference on Autonomous Agents and Multi-agent Systems | International Conference on Autonomous Agents and Multiagent Systems |
| appt | CCF C | International Symposium on Advanced Parallel Processing Technology | International Symposium on Advanced Parallel Programming Technologies |
| ccgrid | CCF C | IEEE/ACM International Symposium on Cluster, Cloud and Grid Computing | IEEE International Symposium on Cluster, Cloud and Internet Computing |
| colt | CCF B | Annual Conference on Computational Learning Theory | Annual Conference on Learning Theory |
| eurocrypt | CCF A | International Conference on the Theory and Applications of Cryptographic Techniques | European Cryptology Conference |
| eurographics | CCF B | Annual Conference of the European Association for Computer Graphics | Eurographics |
| eurographics | CAAI B | Annual Conference of the European Association for Computer Graphics | Eurographics |
| forte | CCF C | International Conference on Formal Techniques for Distributed Objects, Components, and Systems | International Conference on Formal Techniques for (Networked and) Distributed Systems |
| hotstorage | CCF C | HotStorage | ACM Workshop on Hot Topics in Storage and File Systems |
| ictai | CCF C | IEEE International Conference on Tools with Artificial Intelligence | International Conference on Tools with Artificial Intellignce |
| ictai | CAAI C | IEEE International Conference on Tools with Artificial Intelligence | International Conference on Tools with Artificial Intellignce |
| ifip-wg-11-9 | CCF C | IFIP Working Group 11.9 International Conference on Digital Forensics | IFIP WG 11.9 International Conference on Digital Forensics |
| interact | CCF C | International Conference on Human-Computer Interaction of International Federation for Information Processing | IFIP TC13 International Conference on Human-Computer Interaction |
| mobihoc | CCF B | International Symposium on Theory, Algorithmic Foundations, and Protocol Design for Mobile Networks and Mobile Computing | International Symposium on Mobile Ad Hoc Networking and Computing |
| msst | CCF B | Mass Storage Systems and Technologies | International Conference on Massive Storage Systems and Technology |
| nsdi | CCF A | Symposium on Network System Design and Implementation | USENIX Symposium on Networked Systems Design and Implementation |
| recomb | CCF B | Annual International Conference on Research in Computational Molecular Biology | International Conference on Research inComputational Molecular Biology |
| siggraph | CCF A | ACM Special Interest Group on Computer Graphics | ACM SIGGRAPH Annual Conference |
| siggraph | CAAI A | ACM Special Interest Group on Computer Graphics | ACM SIGGRAPH Annual Conference |
| sigmetrics | CCF B | International Conference on Measurement and Modeling of Computer Systems | ACM Special Interest Group on Measurement and Evaluation |
| sigmod | CCF A | ACM SIGMOD Conference | ACM Conference on Management of Data |
| sigmod | CAAI A | ACM SIGMOD Conference | ACM Conference on Management of Data |
| vr | CAAI A | IEEE Conference on Virtual Reality and 3D User Interfaces | IEEE Virtual Reality |
| wasa | CCF C | The International Conference on Wireless Artificial Intelligent Computing Systems and Applications | International Conference on Wireless Algorithms, Systems, and Applications |

不同目录给同一个会不同等级是正常的，不是错：例如 HPCA 是 CCF A、CAAI C；IROS 是 CCF C、CAAI B。每个标签只代表它那份目录。

## 5. 还没解决、要人判断的

1. **IJCAR 要不要显示 CCF B？** 第七版只有 CADE（B）。CADE 偶数年并入 IJCAR（`data/series/cade.yml` 已写明），ccfddl 因此给 IJCAR 标 B。如果认可这个对应，在 `mapping.yml` 加 `{series: ijcar, list: ccf7, entry: cade, qualifier_zh: 含 CADE, note_zh: …}`；现在不显示。
2. **DFRWS APAC 要不要显示 CCF C？** 第七版只有 DFRWS（C），dblp 指向 conf/dfrws；DFRWS APAC 在 ccfddl 里的 dblp 是 conf/di。没有原文说目录那一条包括亚太分会，现在不显示。
3. **合办会议留下的“空”条目**：CCF 和 CAAI 的 WAIM（都是 C）由 apweb-waim 覆盖；CAAI 的 ECML（机器学习类 B）和 ECML PKDD（知识工程类 B）是同一个会，ecml-pkdd 挂了后者。这三条在 `--unlinked` 里仍会出现，不代表缺会。
4. **科协标签只属于 2025 届**：prcv、internetware 的科协标签和 ccc-control、cac 一样只在 2025 届显示。数据里目前没有 2025 届，所以列表行看不到“科协”，这是设计如此。
5. **等系列文件的 links**：没有了。ccc-control → cast2025/314、cac → cast2025/440 的系列文件已建好，标签已生效（validate：0 条在等）。
6. **科协 385 Internetware**：条目写“国际网构软件大会 International Conference on Internetware（中国计算机学会）”，本项目按“只有这一个 Internetware 系列”挂上。只影响 2025 届，如有疑问删掉这条 link 即可。
7. **TACAS 挂 ETAPS**：这是解读，界面写“CCF B（ETAPS 成员会）”。ETAPS 的其他成员会（ESOP、FASE、FoSSaCS）建系列时照此处理；iFS（原 iFM）是否算 ETAPS，没有依据，不挂。

以下系列（2026-09-25 复核时共 85 个）在三份目录里都没有对应条目，只可能有 ccfddl 的 CORE/THCPL。来自 ccfddl 的已按缩写和全称逐个查过；医学、生命科学、物理、化学、数学、地学、社科和一部分工程会议本来就不在这三份目录的范围里：

aacr、aag、aan、acs-fall、acs-spring、aera、agu、aiaa-aviation、ams、aom、aps-psych、aps-summit、apsa、apsys、arr、asbmb、asco、ash、ashg、ashrae、asms、assa、bis、bps、cccg、cictp、cog、colm、cpal、cps-fall、cvc、dfrws-apac、ecce、ecr、egu、enar、esann、eurogp、eusipco、euvip、evoapplications、evocop、evomusart、goldschmidt、hicss、iau-ga、icaif、iciam、iedm、iiswc、ijcar、imece、ims、indocrypt、isbi、isit、ismrm、its-wc、jmm、jsm、log、mlsys、mmsys、mrs-fall、mrs-spring、netys、noms、ofc、pdcat、pes-gm、pes-im、photonics-west、probml、rsna、ruleml-rr、sai、satml、sfn、sigcse、siggraph-asia、trb、turbo-expo、vinci、vtc、wicon。

## 6. 还没有系列的目录条目

这是“CCF 目录全部导入”和工程学科建系列的待办清单。建系列时：ccfddl 有的写 `ccfddl` 键；全称照官网写；建好后跑 `pnpm ranks:report --series <id>` 看有没有自动挂上。

### 6.1 CCF 第七版（57 条，已全部建好系列）

ccfddl 没有收这些会。2026-09-25 第二轮已照目录条目为每条建了 `data_level: curated` 的系列文件（缩写、全称、dblp 照录目录，方向取类别默认值再按内容改），都还没有届次，App 里能搜到、能关注，写"日期暂未收录"。WAIM 另建了一条（2017 年起与 APWeb 合办为 APWeb-WAIM，那边有日期）。下表留作记录。

| 缩写 | 全称 | 等级 | 类别、PDF 页 |
|---|---|---|---|
| CC | International Conference on Compiler Construction | B | 软件工程/系统软件/程序设计语言，第 29 页 |
| I3D | ACM SIGGRAPH Symposium on Interactive 3D Graphics and Games | B | 计算机图形学与多媒体，第 48 页 |
| NOCS | ACM/IEEE International Symposium on Networks-on-Chip | C | 计算机体系结构/并行与分布计算/存储系统，第 8 页 |
| FPL | International Conference on Field-Programmable Logic and Applications | C | 计算机体系结构/并行与分布计算/存储系统，第 8 页 |
| HiPC | IEEE International Conference on High Performance Computing, Data and Analytics | C | 计算机体系结构/并行与分布计算/存储系统，第 8 页 |
| MASCOTS | International Symposium on Modeling, Analysis, and Simulation of Computer and Telecommunication Systems | C | 计算机体系结构/并行与分布计算/存储系统，第 8 页 |
| NPC | IFIP International Conference on Network and Parallel Computing | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| CASES | International Conference on Compilers, Architectures, and Synthesis for Embedded Systems | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| ISLPED | International Symposium on Low Power Electronics and Design | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| HOTI | IEEE Symposium on High-Performance Interconnects | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| VTS | IEEE VLSI Test Symposium | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| NAS | International Conference on Networking, Architecture and Storages | C | 计算机体系结构/并行与分布计算/存储系统，第 9 页 |
| ANCS | ACM/IEEE Symposium on Architectures for Networking and Communication Systems | C | 计算机网络，第 15 页 |
| APNOMS | Asia-Pacific Network Operations and Management Symposium | C | 计算机网络，第 15 页 |
| MASS | IEEE International Conference on Mobile Adhoc and Sensor Systems | C | 计算机网络，第 15 页 |
| P2P | IEEE International Conference on Peer-to-Peer Computing | C | 计算机网络，第 15 页 |
| IPCCC | IEEE International Performance Computing and Communications Conference | C | 计算机网络，第 15 页 |
| IM | IFIP/IEEE International Symposium on Integrated Network Management | C | 计算机网络，第 16 页 |
| DRM | ACM Workshop on Digital Rights Management | C | 网络与信息安全，第 22 页 |
| PASTE | ACM SIGPLAN-SIGSOFT Workshop on Program Analysis for Software Tools and Engineering | C | 软件工程/系统软件/程序设计语言，第 30 页 |
| ICSSP | International Conference on Software and System Process | C | 软件工程/系统软件/程序设计语言，第 30 页 |
| ICSR | International Conference on Software Reuse | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| ICWE | International Conference on Web Engineering | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| SPIN | International Symposium on Model Checking of Software | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| LOPSTR | International Symposium on Logic-based Program Synthesis and Transformation | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| WICSA | Working IEEE/IFIP Conference on Software Architecture | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| MEMOCODE | International Conference on Formal Methods and Models for Co-Design | C | 软件工程/系统软件/程序设计语言，第 31 页 |
| DEXA | International Conference on Database and Expert System Applications | C | 数据库/数据挖掘/内容检索，第 37 页 |
| ESWC | Extended Semantic Web Conference | C | 数据库/数据挖掘/内容检索，第 37 页 |
| WebDB | International Workshop on Web and Databases | C | 数据库/数据挖掘/内容检索，第 37 页 |
| ER | International Conference on Conceptual Modeling | C | 数据库/数据挖掘/内容检索，第 37 页 |
| MDM | International Conference on Mobile Data Management | C | 数据库/数据挖掘/内容检索，第 37 页 |
| SSDBM | International Conference on Scientific and Statistical Database Management | C | 数据库/数据挖掘/内容检索，第 37 页 |
| WAIM | International Conference on Web Age Information Management | C | 数据库/数据挖掘/内容检索，第 37 页 |
| SSTD | International Symposium on Spatial and Temporal Databases | C | 数据库/数据挖掘/内容检索，第 37 页 |
| CSL | Computer Science Logic | C | 计算机科学理论，第 43 页 |
| FSTTCS | Foundations of Software Technology and Theoretical Computer Science | C | 计算机科学理论，第 43 页 |
| DSAA | IEEE International Conference on Data Science and Advanced Analytics | C | 计算机科学理论，第 43 页 |
| ICTAC | International Colloquium on Theoretical Aspects of Computing | C | 计算机科学理论，第 43 页 |
| IPCO | International Conference on Integer Programming and Combinatorial Optimization | C | 计算机科学理论，第 43 页 |
| MFCS | International Conference on Mathematical Foundations of Computer Science | C | 计算机科学理论，第 43 页 |
| STACS | Symposium on Theoretical Aspects of Computer Science | C | 计算机科学理论，第 43 页 |
| VRST | ACM Symposium on Virtual Reality Software and Technology | C | 计算机图形学与多媒体，第 49 页 |
| CAD/Graphics | International Conference on Computer-Aided Design and Computer Graphics Processing | C | 计算机图形学与多媒体，第 49 页 |
| ICIG | International Conference on Image and Graphics | C | 计算机图形学与多媒体，第 50 页 |
| ASRU | Automatic Speech Recognition and Understanding Workshop | C | 计算机图形学与多媒体，第 50 页 |
| ILP | International Conference on Inductive Logic Programming | C | 人工智能，第 60 页 |
| CoopIS | International Conference on Cooperative Information Systems | C | 人机交互与普适计算，第 66 页 |
| MobiQuitous | International Conference on Mobile and Ubiquitous Systems: Computing, Networking and Services | C | 人机交互与普适计算，第 66 页 |
| AVI | International Working Conference on Advanced Visual Interfaces | C | 人机交互与普适计算，第 66 页 |
| GPC | Conference on Green, Pervasive and Cloud Computing | C | 人机交互与普适计算，第 66 页 |
| ICXR | CCF International Conference on Extended Reality | C | 人机交互与普适计算，第 66 页 |
| AMIA | American Medical Informatics Association Annual Symposium | C | 交叉/综合/新兴，第 72 页 |
| COSIT | International Conference on Spatial Information Theory | C | 交叉/综合/新兴，第 72 页 |
| SAGT | International Symposium on Algorithmic Game Theory | C | 交叉/综合/新兴，第 72 页 |
| ICSS | International Conference on Service Science | C | 交叉/综合/新兴，第 72 页 |
| IJTCS-FAW | International Joint Conference on Theoretical Computer Science - Frontier of Algorithmic Wisdom | C | 交叉/综合/新兴，第 72 页 |

### 6.2 CAAI 2024（38 条）

| 缩写 | 全称 | 等级 | 类别 |
|---|---|---|---|
| AIED | International Conference on Artificial Intelligence in Education | B | 人工智能交叉与应用 |
| VLSIC | Symposium on VLSI Technology and Circuits | B | 智能芯片与计算系统 |
| ECML | European Conference on Machine Learning | B | 机器学习 |
| HAPTICS | IEEE Haptics Symposium | B | 跨媒体智能与人机交互 |
| I3D | ACM SIGGRAPH Symposium on Interactive 3D Graphics and Games | B | 跨媒体智能与人机交互 |
| ER | International Conference on Conceptual Modeling | C | 人工智能交叉与应用 |
| AIES | AAAI/ACM Conference on AI, Ethics, and Society | C | 人工智能伦理、安全与治理 |
| AIESD | International Conference on AI Ethics and Sustainable Development | C | 人工智能伦理、安全与治理 |
| ICDSP | International Conference on Digital Signal Processing | C | 人工智能基础与综合 |
| ICISCI | IEEE International Conference on Intelligent Systems and Computational Intelligence | C | 人工智能基础与综合 |
| WCCI | IEEE World Congress on Computational Intelligence | C | 人工智能基础与综合 |
| CYBER | IEEE International Conference on CYBER Technology in Automation, Control and Intelligent Systems | C | 智能机器人与系统 |
| A-SSCC | Asian Solid-State Circuits Conference | C | 智能芯片与计算系统 |
| ACIVS | Advanced Concepts for Intelligent Vision Systems | C | 模式识别与计算机视觉 |
| ACPR | Asian Conference on Pattern Recognition | C | 模式识别与计算机视觉 |
| ICCP | IEEE International Conference on Computational Photography | C | 模式识别与计算机视觉 |
| ICVS | International Conference on Computer Vision Systems | C | 模式识别与计算机视觉 |
| VISAPP | International Conference on Computer Vision Theory and Applications | C | 模式识别与计算机视觉 |
| ICFHR | International Conference on Frontiers in Handwriting Recognition | C | 模式识别与计算机视觉 |
| ICIAP | International Conference on Image Analysis and Processing | C | 模式识别与计算机视觉 |
| ICMVA | International Conference on Machine Vision and Applications | C | 模式识别与计算机视觉 |
| ICPRAI | International Conference on Pattern Recognition and Artificial Intelligence | C | 模式识别与计算机视觉 |
| ICPRAM | International Conference on Pattern Recognition Application and Methods | C | 模式识别与计算机视觉 |
| DAS | International Workshop on Document Analysis Systems | C | 模式识别与计算机视觉 |
| S+SSPR | Joint IAPR International Workshops on Statistical Techniques in Pattern Recognition and Structural and Syntactic Pattern Recognition | C | 模式识别与计算机视觉 |
| ESWC | Extended Semantic Web Conference | C | 知识工程与数据挖掘 |
| MDM | International Conference on Mobile Data Management | C | 知识工程与数据挖掘 |
| SSDBM | International Conference on Scientific and Statistical Database Management | C | 知识工程与数据挖掘 |
| WAIM | International Conference on Web Age Information Management | C | 知识工程与数据挖掘 |
| SSTD | International Symposium on Spatial and Temporal Databases | C | 知识工程与数据挖掘 |
| WebDB | International Workshop on Web and Databases | C | 知识工程与数据挖掘 |
| DEXA | International Conference on Database and Expert System Applications | C | 知识工程与数据挖掘 |
| SIGIR-AP | ACM SIGIR Conference on Research and Development in Information Retrieval in the Asia Pacific Region | C | 知识工程与数据挖掘 |
| AVI | International Working Conference on Advanced Visual Interfaces | C | 跨媒体智能与人机交互 |
| VRST | ACM Symposium on Virtual Reality Software and Technology | C | 跨媒体智能与人机交互 |
| VRIPHYS | Virtual Reality Interactions and Physical Simulations | C | 跨媒体智能与人机交互 |
| CAD/Graphics | International Conference on Computer-Aided Design and Computer Graphics | C | 跨媒体智能与人机交互 |
| MobiQuitous | International Conference on Mobile and Ubiquitous Systems: Computing, Networking and Services | C | 跨媒体智能与人机交互 |

### 6.3 科协 2025（704 条）

科协目录收的是 2025 年举办的具体一届，绝大多数是国内学会的年会，按学科分：数理科学 35、化学科学 16、生命科学 64、地球科学 46、工程与材料科学 152、信息科学 119、管理科学 35、医学科学 139、第二十七届中国科协年会专题论坛 98。不整表列出。和本项目方向有关、建系列时要手工挂的（写 `year: 2025`，并给系列写 `name_zh`）：

| 条目 | 中文名 | 英文名 | 申报学会 |
|---|---|---|---|
| 3 | 中国力学大会-2025 | Chinese Congress of Theoretical and Applied Mechanics 2025 | 中国力学学会 |
| 32 | 国际核工程大会 | The 32nd International Conference on Nuclear Engineering | 中国核学会 |
| 162 | 第三十二届中国汽车工程学会年会暨展览会 | The 32nd China-SAE Congress & Exhibition | 中国汽车工程学会 |
| 170 | 第二十届中国电工技术学会学术年会 | The 20th Annual Conference of China Electrotechnical Society (ACCES 2025) | 中国电工技术学会 |
| 172 | 2025中国制冷学会学术年会 | 2025 CAR Annual Academic Conference | 中国制冷学会 |
| 181 | 2025（第八届）中国航空科学技术大会 | The 8th China Aeronautical Science and Technology Conference | 中国航空学会 |
| 183 | 2025年中国航天大会 | 2025 China Space Conference | 中国宇航学会 |
| 196 | 中国土木工程学会学术年会 | 2025 Annual Academic Conference of the Chinese Society of Civil Engineering | 中国土木工程学会 |
| 203 | 第四届中国电力电子与能量转换大会暨展览会、中国电源学会第二十八届学术年会 | The 4th China Power Electronics and Energy Conversion Congress and Exposition & The 28th China Power Supply Society Conference | 中国电源学会 |
| 245 | 第17届IEEE国际电子测量与仪器学术会议 | 2025 IEEE 17th International Conference on Electronic Measurement & Instruments (ICEMI 2025) | 中国仪器仪表学会 |
| 254 | 世界交通运输大会 | World Transport Convention 2025 | 中国公路学会 |
| 315 | 第40届中国自动化学会青年学术年会 | The 40th Youth Academic Conference of CAA (YAC 2025) | 中国自动化学会 |
| 330 | CCF智能汽车学术年会 | The 3rd CCF Intelligent Vehicles Symposium, CIVS2025 | 中国计算机学会 |
| 337 | CCF数字交通大会 | 2025 CCF Intelligent Transportation Systems conference | 中国计算机学会 |
| 344 | 中国计算机大会 | China National Computer Congress (CNCC 2025) | 中国计算机学会 |
| 352 | 全国知识图谱与语义计算大会 | China Conference on Knowledge Graph and Semantic Computing | 中国中文信息学会 |
| 353 | 第二十四届中国计算语言学大会 | The 24th China National Conference on Computational Linguistics | 中国中文信息学会 |
| 360 | 第十三届国际图象图形学学术会议 | International Conference on Image and Graphics | 中国图象图形学学会 |
| 365 | 中国人工智能大会 | Chinese Congress on Artificial Intelligence | 中国人工智能学会 |
| 378 | 第19届计算机辅助设计与图形学国际学术会议 | CCF CAD/Graphics 2025 | 中国计算机学会 |
| 382 | 中国计算机学会人工智能会议 | CCFAI 2025 | 中国计算机学会 |
| 389 | CCF国际扩展现实学术会议 | CCF International Conference on Extended Reality | 中国计算机学会 |
| 397 | 国际通信大会 | International Conference on Communications in China (ICCC) | 中国通信学会 |
| 406 | 第三十一届全国信息检索学术会议 | The 31st China Conference on Information Retrieval | 中国中文信息学会 |
| 412 | 第二十五届中国虚拟现实大会 | ChinaVR 2025 | 中国图象图形学学会 |
| 425 | IEEE国际无人系统大会 | 8th IEEE International Conference on Unmanned Systems | 中国指挥与控制学会 |
| 499 | 2025中国生物医学工程大会 | 2025 China Conference on Biomedical Engineering | 中国生物医学工程学会 |

## 7. 给建新系列的人：撞名清单

只按缩写匹配会挂错的会。自动匹配不会只凭缩写挂标签，但建系列、写 `mapping.yml` 时要注意：

| 缩写 | 不要混 | 说明 |
|---|---|---|
| CCC | `ccc` 计算复杂性（CCF B） / `ccc-control` 中国控制会议（科协 314） | 两条 not 已写 |
| ITS | CAAI 的 ITS 是 ACM Interactive Tabletops and Surfaces（现名 ISS，已挂 `iss`） / `its-wc` ITS 世界大会 | not 已写 |
| CCS | `ccs` ACM CCS（CCF A） / 科协 377 网络空间安全学术大会 | not 已写 |
| 3DV | `3dv` International Conference on 3D Vision（CCF C） / 科协 416 中国三维视觉大会 | not 已写 |
| FSE | `fse` Fast Software Encryption（CCF fse-3，B） / `fse-se` ACM FSE（CCF fse-4，A） | 已按全称分开 |
| SEC | `sec` ACM/IEEE Edge Computing（CCF sec-1） / `sec-sc` IFIP 信息安全会议（CCF sec-3） | 已按全称分开 |
| HAPTICS | CAAI 的 HAPTICS 是 IEEE Haptics Symposium / `whc` World Haptics Conference（CCF C、CAAI C） | 两个会 |
| ICCC | 科协 397 的 ICCC 是 IEEE/CIC International Conference on Communications in China | 别的 ICCC 不要挂 |

工程和交叉学科的会里，下面这些 ccfddl 已经有系列，**直接用现有 id，不要再建**（改成 curated 时在原文件上改）：`icc`、`globecom`、`wcnc`、`infocom`、`iscas`、`icassp`、`icip`、`interspeech`、`dac`、`date`、`iccad`、`asp-dac`、`miccai`、`bibm`、`ismb`、`recomb`、`isit`、`eusipco`、`smc`、`ipsn`、`sensys`、`rtas`、`rtss`、`emsoft`、`hscc`、`cav`。
