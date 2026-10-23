# What needs the owner

Last updated 2026-10-23. Everything else in this repository is maintained by development sessions.

## 1. Turn on the scheduled data refresh (not active)
The refresh has **never run on GitHub Actions**, so it must not be described as operational. Development machines lack the `workflow` token scope, so the updated workflow is staged in `docs/proposed-refresh-workflow.yml`.
1. Copy that file over `.github/workflows/refresh-federal-register.yml` (GitHub web editor is fine).
2. Settings → Actions → General → Workflow permissions → **Read and write**.
3. Actions tab → "Refresh official research snapshots" → **Run workflow**. Only a green run, plus a bot commit or a "no change" result, counts as working. Then tell a development session so docs can be updated.
Details: `docs/enable-automation.md`.

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
