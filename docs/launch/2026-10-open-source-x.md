# Open-source launch · X thread (2026-10)

Images: `dist/launch/2026-10-open-source/x/` (generated locally, not in the repo). Attach `1-hero.png` to post 1, `2-route.png` to post 2, `3-rule.png` to post 3 and `5-venue.png` to post 5. Every post fits the 280-character limit. Numbers as of 2026-10-17: 509 series, 419 editions, 1,633 quotes.

---

**1/**

Rejected from NeurIPS or AAAI and need to pick the next venue fast?

I built NextVenue, an open-source planner for conference submissions. Every deadline and every rule answer is backed by a verbatim quote from the official site. 🧵

**2/**

Give each paper up to 3 target venues. NextVenue orders them into a route (submit here; if rejected, go there) and flags clashes early, e.g. when you must register an ICLR abstract before the NeurIPS decision is out.

**3/**

Rule cards answer what CFPs bury: Can I add authors after the abstract deadline? Is a withdrawal public? Does CVPR paper registration count as a submission?

When official pages contradict each other, the card says so and shows both readings instead of guessing.

**4/**

Trust, but verify: 1,633 official quotes, and CI checks every one verbatim against a saved snapshot of its source page. Tap an answer to jump to the highlighted sentence on the venue's site.

**5/**

Coverage: 509 conference series and 419 editions across 9 disciplines (CS first), with CCF/CAAI tiers, host city, visa needs, and an after-acceptance checklist: registration, visa, travel approval.

**6/**

Local-first: your papers and plans stay on your device. No account, no tracking.

The UI and rule summaries are in Chinese for now; the quotes stay in the original English.

**7/**

Code AGPL-3.0, data CC BY-SA 4.0. It's early, so issues and PRs are very welcome, especially rule cards for venues you know well.

https://github.com/ziziphus-jujuba-zao/NextVenue

Not affiliated with any conference. Always double-check the official site.
