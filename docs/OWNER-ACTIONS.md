# What needs the owner

Last updated 2026-10-23. Everything else in this repository is maintained by development sessions.

## 1. Review the audit PR before enabling production refresh
The replacement workflow is committed on `codex/independent-audit`, and [real branch dispatch 39893778468](https://github.com/samokarplus/common-ground/actions/runs/39893778468) passed both fetches, verification and a bot push. It deliberately skipped Pages on the feature branch. **Daily scheduling and production publication are not yet verified.**

Coordinate with the other developer before merging. After review/merge, run the workflow on main; check the bot commit, explicit Pages rebuild and actual live content. Then observe a scheduled run. Do not enable paid fallbacks or create broader credentials. See `enable-automation.md` for exact steps and `independent-audit.md` for evidence.

## 2. Domain: keep Common Ground separate from samo.karplus.org
Common Ground is currently reachable under `samo.karplus.org` only because your account's user site has that custom domain and GitHub applies it to all project sites; this repository does not set it. See "Keeping Common Ground separate" in `docs/deployment-and-domain.md` for three options (remove the domain from the user site, give Common Ground its own domain, or move the repo to another account or organization). Pick one; sessions will not change DNS or account settings.

### HTTPS
`https://samokarplus.github.io/common-ground/` redirects to `http://samo.karplus.org/...` then to `https://samo.karplus.org/common-ground/`. In the `samokarplus/samokarplus.github.io` repository check Settings → Pages → custom domain and **Enforce HTTPS**. Details: `docs/deployment-and-domain.md`. Development sessions do not change DNS or account settings.

## 3. Human review
Nothing is human-reviewed. Open `#/review` on the site, decide on each item, download the decisions file, and have it applied with `npm run review:apply -- file.json` (see `docs/editorial-workflow.md`). Until then everything carries a "machine-checked, not human-reviewed" label. Items most worth your attention first: the 15 ballot measure explanations (especially Amendment 87's majority threshold, corrected on 2026-10-22), the 13 candidate profiles (paraphrased from news questionnaires and campaign sites), and the judicial guide (the official evaluation site blocks automated access).

## 4. Sources only a person can get
- Individual judges' official evaluations and recommendations (judicialperformance.colorado.gov returns 403 to automated tools).
- Campaign sources for third-party and unaffiliated candidates in the Senate and Governor races (see `data/elections/colorado-2026-gaps.json`).
- Any county or municipal ballot data (no verified official source was gathered).
- A native-speaker review if Spanish materials will be offered: only figures and argument counts were compared with the English edition.

## 5. Before the election (Nov 3, 2026)
Re-run `npm run check:links` and re-check deadlines against the Secretary of State's site; update `dataVerifiedAt` only after a real re-check.
