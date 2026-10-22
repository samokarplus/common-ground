# HANDOFF — Common Ground 2.2 (Live Civic Research + Help Me Vote)

_Written Oct. 22, 2026, ~4:55 p.m. Mountain Time, at the end of a Claude Code session, for the next session that takes over._
_Rule for this document: anything not explicitly marked **Verified** was not checked. Do not upgrade a claim's status without verifying it yourself._

---

## 0. Where the project is (read first)

| Item | Value |
| --- | --- |
| Repository | https://github.com/samokarplus/common-ground (public) |
| Branch | `main` (the only branch used; GitHub Pages publishes from `main` → `/docs`) |
| Latest pushed commit | `7b46328` "Add research pipeline, source registry, health report, and docs" |
| Previous commits | `a6ef9bc` "Add Help Me Vote for Colorado's 2026 ballot" · `7075786` original public edition (before this session) |
| Working directory used | `/home/claude/common-ground` in an ephemeral cloud workspace. **It will not exist for the next session.** Start from a fresh clone. |
| Commit state | Everything through `7b46328` is committed and pushed. **This `HANDOFF.md` is the only uncommitted file** unless the owner asked for it to be committed and pushed. |
| Live site | https://samokarplus.github.io/common-ground/ — **not verified after either push** (see §6) |

**Separate private project — do not touch.** `~/Documents/common-ground` on the owner's Mac is the **private server beta** (Next.js, Cloudflare Workers/Wrangler, Drizzle database, `.env.example`, `.openai/`). It is **not** this repository. This session only listed its top-level contents and copied nothing from it. Never merge, copy, or publish anything from it. Folder access to it was granted for this session only.

---

## 1. What was completed from the master prompt

In priority order of what was actually done:

1. **Phase A audit.** Fresh clone of `7075786`: 17/17 tests, lint clean, build reproducible (rebuilt `/docs` byte-identical to committed), secret scan 0 findings. Written up in `docs/current-state.md`. Roadmap in `docs/roadmap.md`.
2. **Help Me Vote — Colorado 2026 (Priority 7 / Phase E).** Built first because Election Day is **Nov. 3, 2026**.
   - Typed and validated dataset `data/elections/colorado-2026.json`:
     - all 14 certified statewide measures, plus district-only Ballot Issue 7A;
     - statewide contests (U.S. Senate; Governor/Lt. Gov.; Secretary of State; Treasurer; Attorney General);
     - judicial retention (Supreme Court: William W. Hood, III; Court of Appeals: 6 judges);
     - Secretary of State deadlines;
     - official links, known gaps, and an explicit "not covered" list.
   - Schema, rules, and pure logic in `src/lib/election.ts`:
     - 55% threshold for constitutional measures, majority for statutory;
     - duplicate, unknown-source, and bad-date rejection;
     - retention questions can't carry a party;
     - deadline and election-phase logic in Mountain Time;
     - stale-data detection;
     - review gating;
     - private-guide helpers.
   - UI in `src/components/help-me-vote.tsx`, on hash routes:
     - `#/vote`, `#/vote/colorado`
     - `#/vote/colorado/measures`, `#/vote/colorado/measure/:id`
     - `#/vote/colorado/contests`, `#/vote/colorado/contest/:id`
     - `#/vote/my-guide`, `#/vote/how-to-read`, `#/vote/demo`
     - the old `#/ballot` route now renders the vote landing.
   - **Plain-language summaries, YES/NO meanings, fiscal notes, and "what's unclear" are drafted for all 15 measures but hidden** (`draft.review.status: "draft"`). The UI shows Blue Book page references instead. The queue is in `docs/editorial-review.md`.
   - **Private research guide:**
     - kept in memory by default, with opt-in `localStorage` (`cg-vote-guide`);
     - print/PDF layout, JSON download, and delete with confirmation;
     - added to the global export and delete keys.
3. **Homepage and explainer (Phase B, partial):**
   - **Homepage additions:**
     - an election countdown banner;
     - six direct "paths" cards;
     - a "How government action actually happens" guide.
   - **Document explainer additions:**
     - type-specific "questions to ask" and key-terms glossary (deterministic, from document type only);
     - copy-citation and print buttons;
     - an official comment-deadline display, using the API field `comments_close_on` with a "days left to comment" tag.
   - **Fixes:**
     - Federal Register error notices now show only on feed pages;
     - the header search keeps its query after navigation.
4. **Research pipeline (Priority 7H / Phase F, partial):**
   - Pure pipeline in `src/lib/pipeline.ts`: validate → normalize → dedupe → hash → diff → bounded changelog. It writes nothing when content is unchanged.
   - Runner script `scripts/refresh-federal-register.mts`, with retries and backoff, Retry-After handling, and a timeout. On failure it leaves the snapshot untouched.
   - Typed source registry `src/lib/source-registry.ts`.
   - Health generator `scripts/research-health.mts`, which writes `docs/research-health.md`, `data/research-health.json`, and `docs/source-registry.md`.
   - Daily GitHub Actions workflow `.github/workflows/refresh-federal-register.yml`.
5. **Build fix.** Vite used to wipe `/docs` on every build, deleting docs markdown. Now `emptyOutDir: false`, and `scripts/clean-build.mjs` removes only build artifacts.
6. **Docs:** README rewritten to match tested features, plus:
   - `docs/data-sources.md`
   - `docs/editorial-methodology.md`
   - `docs/privacy-and-security.md`
   - `docs/research-pipeline.md`
   - `docs/election-data-coverage.md`
   - `docs/editorial-review.md`
   - `docs/source-registry.md`
   - `docs/research-health.md`

---

## 2. Every file created, modified, or deleted

**Commit `a6ef9bc` (Help Me Vote)**
- Created:
  - `data/elections/colorado-2026.json`
  - `src/lib/election.ts`
  - `src/components/help-me-vote.tsx`
  - `tests/election.test.mts`
  - `scripts/clean-build.mjs`
  - `docs/current-state.md`
  - `docs/roadmap.md`
  - `docs/editorial-review.md`
  - `docs/election-data-coverage.md`
  - `docs/assets/index-BLVrKoXH.js`
  - `docs/assets/index-D3EoKY_k.css`
- Modified:
  - `src/components/common-ground.tsx`:
    - nav adds "Help Me Vote" and removes "My Ballot";
    - `Ballot()` component deleted (demo moved to `#/vote/demo`);
    - homepage additions;
    - explainer questions, terms, and citation;
    - feed-notice scoping.
  - `src/main.tsx` (passes decoded `parts` to the app)
  - `src/lib/domain.ts` (`cg-vote-guide` added to `PRIVATE_KEYS`)
  - `src/styles.css` (Help Me Vote styles and print styles appended)
  - `package.json` (build script)
  - `vite.config.ts` (`emptyOutDir: false`)
  - `docs/index.html` (rebuilt)
- Deleted (replaced build artifacts): `docs/assets/index-B8Zqa6-0.js`, `docs/assets/index-e32DKh1T.css`

**Commit `7b46328` (pipeline and docs)**
- Created:
  - `.github/workflows/refresh-federal-register.yml`
  - `src/lib/pipeline.ts`
  - `src/lib/source-registry.ts`
  - `scripts/refresh-federal-register.mts`
  - `scripts/research-health.mts`
  - `tests/pipeline.test.mts`
  - `data/research-health.json`
  - `docs/data-sources.md`
  - `docs/editorial-methodology.md`
  - `docs/privacy-and-security.md`
  - `docs/research-health.md`
  - `docs/research-pipeline.md`
  - `docs/source-registry.md`
  - `docs/assets/index-DRNLbJEQ.js`
- Modified:
  - `README.md`
  - `src/components/common-ground.tsx`:
    - comment-deadline display;
    - status-page Colorado panel;
    - updated methodology and status copy;
    - fix for a date-format crash.
  - `src/lib/domain.ts` (`comments_close_on` in schema; `FR_FIELDS` / `frFieldQuery`)
  - `src/lib/free-source.ts` (requests those fields)
  - `package.json` (`refresh:fr`, `health` scripts)
  - `tsconfig.json` (includes `scripts/**/*.mts`)
  - `docs/index.html`
- Deleted: `docs/assets/index-BLVrKoXH.js` (replaced)

**Uncommitted:** `HANDOFF.md` (this file).

**Not yet created** (written by the pipeline on its first successful change): `data/changelog/federal-register.jsonl`, `data/source-status.json`.

---

## 3. Feature status

**Legend:**
- **Shipped (verified locally):** built, tested, and rendered in headless Chromium.
- **Partial:** some of the requirement is done.
- **Not started:** no work yet.
- **Unverified:** exists but never observed working.

| Feature | Status | Notes |
| --- | --- | --- |
| Help Me Vote routes, coverage labels, deadlines, staleness warning | **Shipped (verified locally)** | 14 routes × 2 widths, each with one H1, no console errors, no horizontal scroll at 390px |
| Colorado measure facts (designation, title, type, threshold, links, Blue Book pages) | **Shipped**, data accuracy **partly unverified** | Transcribed via a summarizing web-fetch tool, not by a human (see §6) |
| Measure plain-language / YES/NO / fiscal explanations | **Partial: drafted, hidden** | Need human review (`docs/editorial-review.md`) |
| Statewide candidate and judge lists | **Shipped**, accuracy **unverified by a human** | Displayed publicly now; withdrawals not captured |
| Candidate profiles and positions | **Not started** | UI says "Not yet researched — not inferred from party" |
| District and local races, other states | **Not started (by design for now)** | UI links to the official sample ballot and usa.gov |
| Private research guide (memory, opt-in storage, print, download, delete) | **Shipped (verified locally)** | Logic unit-tested; print layout not visually checked |
| Ballot primer and glossary; fictional demo | **Shipped** | |
| Homepage paths, election banner, government guide | **Shipped (verified locally)** | |
| Explainer: questions, key terms, citation copy, print, comment deadline | **Shipped (verified locally)** | `comments_close_on` was confirmed to exist via one API call; the live browser fetch with `fields[]` is **unverified** |
| 3–5 human-reviewed Federal Register explainers | **Not started** | |
| Federal Register refresh pipeline (logic) | **Shipped (unit-tested)** | Idempotency, diffs, rejection, and bounds are tested with fixtures |
| Scheduled refresh workflow | **Unverified** | Pushed; never observed running; may need a repo permission (see §6) |
| End-to-end real refresh changing the snapshot | **Not done** | The Federal Register is blocked from the session's shell; only the failure path was exercised |
| Source registry, research-health report | **Shipped** | Generated docs committed |
| Congress tracker (Priority 3 / Phase C) | **Not started** | Plan in `docs/roadmap.md` |
| Values Explorer upgrade (Priority 4) | **Not started** | Existing feature untouched |
| Debate Lab upgrade (Priority 5) | **Not started** | Existing feature untouched |
| Thought Atlas 19 → 75–150 nodes (Priority 6) | **Not started** | |
| Promises/votes/outcomes (Priority 8) | **Not started** | |
| Methodology and corrections (Priority 9) | **Partial** | Docs written; in-app correction channel only points to GitHub Issues |
| Accessibility, SEO, performance (Priority 10) | **Partial** | New UI uses ≥12px text, 40px touch targets, labels, `aria-*`. No axe audit, sitemap, robots.txt, or code splitting. Old CSS has 8–11px text |
| Browser smoke tests committed to repo (Priority 11) | **Not started** | Headless checks were run ad hoc from a scratch script, not committed |

---

## 4. Commands run and results (this session)

- **Environment setup.**
  - `npm ci` failed at first: the cloud shell couldn't reach the npm registry.
  - The owner enabled network egress in claude.ai settings.
  - npm then worked **only** when forced through the session proxy:
    `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 npm_config_noproxy=localhost npm ci --ignore-scripts --no-audit --no-fund`
- **Baseline at `7075786`** (in the Linux workspace on the owner's Mac, then in the cloud): test 17/17 pass; lint clean; build OK and identical to committed `/docs`; scan 0 findings.
- **At `a6ef9bc`:** test 31/31 pass; lint clean; build OK; scan 0 findings.
- **At `7b46328`:** `npx tsc --noEmit` clean; test 42/42 pass; lint clean; build OK (about 470 KB JS, about 132 KB gzipped, single chunk); `npm run health` OK; scan 0 findings.
- **Refresh failure path.** `npm run refresh:fr -- --dry-run` printed "Federal Register unavailable: fetch failed. Snapshot left unchanged." The snapshot's md5 was unchanged before and after.
- **Headless rendering.** Playwright Chromium (`/opt/pw-browsers`) against `vite preview` on port 3021, at 1360px and 390px.
  - First sweep: 28 route checks passed.
  - Second sweep found a Source Status crash ("Invalid option"); it was fixed and re-checked.
  - The document page renders after about 1.3 seconds of snapshot fallback; it has no H1 while loading.
- **Deployments.** `git push origin main` succeeded for `a6ef9bc` and `7b46328`, including the workflow file.
  - The GitHub Pages API (`gh api .../pages`) is blocked by the session proxy (403).
  - The live-site check was **cancelled by the owner**, so post-deploy behavior is **unverified**.

---

## 5. Architecture, data, APIs, integrations

- **Stack.**
  - React 19 + TypeScript 5.9 + Vite 8; Tailwind 4 is imported, but styling is mostly hand-written CSS in `src/styles.css`.
  - zod for validation; lucide-react icons; self-hosted fonts.
  - Node's built-in test runner (`node --experimental-strip-types --test tests/*.test.mts`).
- **Hosting.**
  - Static build committed to `/docs`, served by GitHub Pages from `main`. `.nojekyll` is present.
  - Hash routing (`#/…`) in `src/main.tsx`; `CommonGround` in `src/components/common-ground.tsx` (about 2,500 lines, one file) switches on `section`.
  - Help Me Vote is a separate component tree in `help-me-vote.tsx`.
- **Database.** **None.** No server, no cloud DB. State lives in:
  - committed JSON (`data/`);
  - per-browser `localStorage`, opt-in only: `cg-values`, `cg-saved`, `cg-ballot` (legacy), `cg-vote-guide`;
  - in-memory module stores.
- **Content Security Policy** (in `index.html`): `connect-src 'self' https://www.federalregister.gov`. Any new browser-fetched source requires a deliberate CSP change.
- **APIs.**
  - **Federal Register API (keyless, CORS):**
    - The browser fetches `/api/v1/documents.json?per_page=40&order=newest&page=N&fields[]=…` and `/api/v1/documents/{id}.json`, with a 15-minute in-memory cache.
    - The committed snapshot `data/federal-register.json` is the fallback, labeled "dated snapshot, not live news."
  - **Colorado election data:** no API exists. It was transcribed manually from:
    - Secretary of State pages;
    - the official candidate list;
    - the 2026 Blue Book PDF;
    - the fiscal impact statements PDF.
  - **Planned only:**
    - Congress.gov API, which needs a key; it must never ship in browser code.
    - GovInfo BILLSTATUS bulk XML (keyless).
- **Integrations.**
  - GitHub Actions workflow: daily cron `17 13 * * *` UTC plus manual dispatch.
    - `permissions: contents: write`; standard `ubuntu-latest` runner.
    - No artifacts or cache, which keeps it $0 for a public repository.
  - No analytics, AI APIs, or paid services.

---

## 6. Unfinished work, bugs, blockers, pending permissions

**Highest priority (election-sensitive):**
1. **Human review of the 15 measure drafts.** Use `docs/editorial-review.md`. The drafts' figures came from a summarizing web-fetch tool, so they may contain errors. Each needs checking against the Blue Book and fiscal statement PDFs before being set to `reviewed`.
2. **Spot-check the publicly displayed facts**, which a human has not verified:
   - candidate names and affiliations, against the official XLSX: https://www.coloradosos.gov/pubs/elections/vote/files/2026/2026GeneralCandidateListOfficial.xlsx (withdrawals there are shown with strikethrough);
   - the 7 deadlines, against the Sept. 4 SoS release;
   - Blue Book page numbers. Propositions 132–137 quick-reference pages are recorded only as the range "7–14."
3. **Copy bug.** The measures list page says "Every statewide measure, in ballot order by type" (`help-me-vote.tsx`, `MeasureList`). Ballot order was **not** verified; change the wording.
4. **Hard-coded count.** The home banner text says "All 14 statewide measures" (`HomeVoteBanner` in `common-ground.tsx`). It's correct now but should be computed from the data.

**Deployment and automation:**
5. **Verify the live site** shows the new build. Expected asset: `docs/assets/index-DRNLbJEQ.js`. Also check `#/vote/colorado`, a measure page, deep-link refresh, and the 404 path.
6. **Workflow never observed running.**
   - **Pending permission:** Settings → Actions → General → Workflow permissions may need "Read and write" for the bot to push. Only the owner should change it.
   - Whether a push made with `GITHUB_TOKEN` triggers the Pages rebuild is **unverified**.
   - GitHub may pause scheduled workflows in inactive repositories.
7. **No end-to-end refresh demonstrated yet.** The master prompt requires one. Run "Run workflow" in the Actions tab, or `npm run refresh:fr` on a machine that can reach www.federalregister.gov. The first real run will register all 40 records as changed, because the old snapshot has extra fields (`excerpts`, `public_inspection_pdf_url`) and no `contentHash`. That's expected.

**Known bugs and quality gaps:**
8. The document page shows no heading while the live fetch is pending. It could render the snapshot record immediately.
9. `CommentStatus` counts days in America/New_York as an approximation of Federal Register comment deadlines (usually 11:59 p.m. Eastern).
10. `docs/editorial-review.md` was generated once by an ad hoc Python snippet that wasn't committed. Regenerating it isn't scripted. If you script it, preserve any checkbox edits the owner has made.
11. Old CSS uses 8–11px text in tags and notices (accessibility).
12. The JavaScript bundle is about 470 KB in a single chunk, with no route splitting.
13. There are no committed browser smoke tests and no axe accessibility audit.
14. The legacy `cg-ballot` storage key is still exported and deleted (harmless). The old free-text ballot worksheet UI was removed.

**Environment blockers seen this session** (may differ for the next session):
- **Cloud shell:**
  - npm works only through the proxy override shown in §4.
  - `www.federalregister.gov`, `coloradosos.gov`, `content.leg.colorado.gov`, `github.io`, and `api.congress.gov` are blocked from the shell.
  - Git push to GitHub works. The GitHub REST API (`gh api`) Pages endpoints are blocked.
- **Web tools:** WebSearch and WebFetch can read official civic pages, but WebFetch summarizes and won't quote long passages, which is why full ballot titles weren't captured.
- **Owner's Mac Linux workspace** (via the remote-device tools): npm and GitHub reachable; civic sites blocked.

---

## 7. Progress against the master prompt

| Master prompt area | Progress |
| --- | --- |
| Phase A audit and foundation | Done: `current-state.md`, `roadmap.md`, baseline checks. The live-site check is still outstanding. |
| Priority 1 Home | Mostly done. Missing: topic filters wired to the feed by transparent keywords (the topic cards exist but link to Policy Explorer), and breadcrumbs beyond the existing top bar. |
| Priority 2 Document explainer | Partial. Done: at-a-glance, what happened (type-based), effective vs comment dates, timeline, evidence, questions, terms, citation copy and print. Missing: reviewed explainers for real documents, related documents, correction notices. |
| Priority 3 Congress tracker | Not started. |
| Priorities 4–6 Values / Debate / Atlas | Not started (existing features preserved). |
| **Priority 7 Help Me Vote** | **Colorado slice shipped with honest gating.** All required routes, coverage states, privacy rules (no address, location, or district guessing), private guide with print and export, primer, glossary, separate demo. **Missing:** reviewed explanations; candidate research; ballot order; full ballot titles; withdrawal verification; county and district coverage; other states. |
| **Election research** | Verified via official sources (read through web tools): SoS certification (Sept. 4, 2026), measures page, candidate list page, Blue Book (Sept. 21, 2026), fiscal impact statements, judicial performance site. Facts are recorded with source IDs and retrieval dates. |
| **Priority 7H Federal Register monitoring / ongoing updates** | Pipeline logic, registry, health report, docs, and workflow are done. **Live automation is unverified, and no real end-to-end refresh has happened.** Colorado data is manual by design, with a 7-day stale warning in the UI. No automated monitoring of Colorado changes, Congress, or courts yet. |
| Priority 8 Promises | Not started. |
| Priority 9 Methodology | Docs done; the in-app page was lightly updated. |
| Priorities 10–11 Polish, tests, security | Partial. 42 unit tests, scan, and CSP; ad hoc headless checks. Missing: committed browser tests, axe audit, SEO files, code splitting. |
| Phase G release validation and report | Not completed (the live check was cancelled). |

---

## 8. How a new Claude Code session should resume

1. **Get the code, don't reuse old paths.**
   ```sh
   git clone https://github.com/samokarplus/common-ground
   cd common-ground
   git log --oneline -3   # expect 7b46328 at the top, unless someone has pushed since
   ```
   If `HANDOFF.md` isn't in the clone, the owner has it as a file from this session; ask for it.
2. **Never touch `~/Documents/common-ground` on the owner's Mac.** It's the private beta.
3. **Install and verify the baseline before changing anything.**
   ```sh
   npm ci --ignore-scripts      # if the registry is unreachable in a cloud shell, see §4 for the proxy override
   npm test && npm run lint && npm run build && npm run scan
   git status                   # build must produce no diff; if it does, investigate before committing
   ```
   Expect: 42 tests pass, lint clean, scan 0 findings.
4. **Read before writing:** `docs/current-state.md`, `docs/roadmap.md`, `docs/election-data-coverage.md`, `docs/editorial-review.md`, `docs/research-pipeline.md`.
5. **Rules that keep existing work intact:**
   - Edit `data/elections/colorado-2026.json` in place. Never regenerate it from scratch, and never set a measure's `review.status` to `reviewed` yourself. Only a named human reviewer may, with `reviewer` and `reviewedOn`.
   - Don't delete or rename existing routes (`#/vote/...`, `#/action/:id`, `#/ballot` redirect). Links may already be shared.
   - Don't overwrite `docs/*.md` wholesale. Update sections and keep the owner's edits, especially checkboxes in `editorial-review.md`.
   - `npm run build` rewrites only `docs/assets`, `docs/index.html`, `docs/favicon.svg`, and `docs/.nojekyll`. Keep it that way.
   - Commit the rebuilt `/docs` with every source change; Pages serves the committed build.
   - $0 only: no paid services, keys in code, larger runners, or Actions artifacts and caches. Ask before changing repository settings, DNS, or anything outside this repository.
6. **Suggested next tasks, in order** (Election Day is Nov. 3, 2026):
   1. Verify the live site (§6 item 5) and fix any deployment problem.
   2. Fix the two copy issues (§6 items 3–4), with a test.
   3. Help the owner review measure drafts. Present each draft beside its Blue Book pages; the owner decides.
   4. Ask the owner to run the workflow once ("Run workflow"), confirm the bot commit, and confirm the Pages rebuild. Then mark automation as verified in `docs/research-pipeline.md` and `docs/current-state.md`.
   5. Spot-check candidate names and withdrawals against the official XLSX. Update `dataVerifiedAt` only after a real re-check.
   6. Then continue the roadmap: Congress snapshot (GovInfo BILLSTATUS first), committed Playwright smoke tests, accessibility pass, Thought Atlas expansion.
7. **When finishing any session:** run all checks, commit with clear messages, push, verify the live site, and update `docs/current-state.md` and this file with what is actually verified.
