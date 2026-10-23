# Development progress

Factual log. Only items marked verified were checked in the session that wrote them.

## Session 3 (2026-10-22)
- Starting commit: `bafed1a` (handoff doc on top of `7b46328`).
- Baseline, verified: `npm test` 42/42, lint clean, `tsc --noEmit` clean, build produces no diff, `npm run scan` 0 findings.
- Live site, verified: https://samokarplus.github.io/common-ground/ serves asset `index-DRNLbJEQ.js` (the expected `7b46328` build).
- Fixed: measures page no longer claims "ballot order" (order was never verified); home banner measure count is computed from data.

## Not yet done / unverified
- Scheduled Federal Register workflow has not been observed running; owner may need to enable "Read and write" workflow permissions and run it once.
- 15 measure explanations remain drafts, hidden pending human review (unchanged).
- Candidate/judge facts not human-verified against the official XLSX.
- Congress tracker, committed Playwright tests, axe audit, Atlas expansion: not started.

## Session 3, continued
- Real Federal Register refresh, verified locally: `npm run refresh:fr` updated 40 records (snapshot, `data/changelog/federal-register.jsonl`, `data/source-status.json` created); a second run reported "No change" (idempotent). The scheduled GitHub Actions run is still unobserved.
- Playwright smoke tests committed (`e2e/`, `npm run e2e`): 12 routes plus search/flow checks at 1360, 768 and 390px; each checks h1, no horizontal overflow, no console errors. Verified: 48/48 pass. Not yet covered: axe audit, broken external link checks, document pages.
- Congress tracker (first slice): `src/lib/congress.ts` parses GovInfo BILLSTATUS XML; `scripts/refresh-congress.mts` (`npm run refresh:congress`) fetched real data for 60 recently updated bills (H.R., S., H.J.Res., S.J.Res., 119th Congress) into `data/congress/bills.json`. UI at `#/congress`, `#/congress/bill/:id`, `#/congress/how-it-works` (lazy-loaded chunk). Status is derived conservatively from the action log; the UI says so and links Congress.gov. 4 new unit tests use a labeled fictional fixture.
- Congress limits: only the 15 most recently updated bills per type, not a full list; no vote tallies, no plain-language "major provisions" (only the CRS summary when present); not yet in the scheduled workflow, source registry or health report; status mapping is heuristic and unreviewed against many real bills; screenshots were not visually reviewed (browser pane unavailable).

## Congress automation (blocked on owner)
- Added: `data/changelog/congress.jsonl` (new bills, status changes, new latest actions via `diffBills`, unit-tested), per-source status in `data/source-status.json`, Congress rows in the source registry and `docs/research-health.md`.
- **Blocked:** pushing a change to `.github/workflows/` was rejected because the Git credentials on the development machine lack GitHub's `workflow` scope. The updated workflow (both sources run independently; job fails if either fails; commit message generalized) is saved as `docs/proposed-refresh-workflow.yml`. Owner action: copy it over `.github/workflows/refresh-federal-register.yml` (via the GitHub web editor or a token with `workflow` scope), then use "Run workflow". Until then Congress refresh is manual and the registry says so.

## Live deploy check (2026-10-22, after push `1a99c12`)
- Verified: the live site serves `index-D2FncIgf.js` (the new build) and the lazy `congress-*.js` chunk. The full 48-test Playwright suite passed against the live URL (`E2E_BASE_URL=https://samokarplus.github.io/common-ground/ npm run e2e`).
- Still unverified: the scheduled workflow (and the proposed two-source version) has never run in GitHub Actions; the Pages rebuild after a bot push is untested.

## Accessibility pass and Thought Atlas (session 3)
- Accessibility: `e2e/a11y.spec.ts` runs axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on 15 routes at 3 widths. Initial run found contrast failures (muted/gray text colors), an SVG `role="img"` containing interactive nodes, and sub-12px text (133 declarations raised to 12px). After fixes: 45/45 axe checks pass, plus 51 smoke checks (96 total, verified locally against the built site). Automated checks cover only part of WCAG 2.2 AA: keyboard flows, screen-reader behavior, focus order and text-resize were not manually tested. Contrast was checked only on the page backgrounds axe evaluated; layout was not visually reviewed after the font-size change.
- Thought Atlas: 19 → 86 nodes and 161 reading-path edges (`src/lib/atlas.ts`). New nodes are traditions, institutions, ethical theories and thinkers, each linked to a Stanford Encyclopedia of Philosophy entry whose URL was individually confirmed to exist while writing. New conceptual nodes have a definition, key thinkers, "where people disagree" and an example. Text is an editorial draft by Common Ground, **not peer reviewed**, and labeled as such in the UI. Graph view now shows the selected idea and its linked neighbors (a full 86-node map was unreadable); the list view browses everything. Unit tests check unique ids, valid edges, no isolated nodes, and that conceptual nodes carry competing views.
- Atlas gaps: no entries for political polarization, populism, or judicial review (no suitable SEP entry found); the 19 original nodes lack thinkers/disagreement/example fields; historical-context and further-reading fields are not yet present.

## Judicial retention guide and candidate profile system (session 3)
- Judicial guide at `#/vote/colorado/judges`: what YES/NO does, how commissions evaluate judges, what evaluations can and cannot show, questions to ask, links to the official evaluations. It sits on the retention contest pages.
- **Verification status: not verified against official pages.** judicialperformance.colorado.gov and its PDFs return 403 to automated fetches, so the process text came from search excerpts of official materials plus press coverage, and the page says so. A human should confirm it. Individual judges' recommendations and survey counts were **not** obtained and are deliberately not shown; the page links to the official evaluations instead.
- Candidate profile system: `src/lib/candidate.ts` (typed claims: own statement, documented action, independent finding, allegation, opinion; each needs an https source and retrieval date; completeness separates sourced / checked-nothing-found / unresearched), data file `data/elections/colorado-2026-profiles.json` (**currently empty**), profile page `#/vote/colorado/candidate/:contest/:name`, validation tests. Candidate rows now say "Not yet researched — 0 of 5 areas" rather than implying no position.
- Not done: no candidate has actually been researched yet, so no profile pages exist in the live data. Research should come from official sources and candidates' own sites by a human or reviewed session.
- Tests: 57 unit, 111 browser (smoke + axe) passing locally.

## Colorado data spot-check (2026-10-22, partial)
- Statewide candidate names for U.S. Senate, Governor, Secretary of State, Treasurer and Attorney General were compared with the Secretary of State's candidate-list page as read through a summarizing fetch tool: every name on that page is in the dataset, with no omissions. The dataset has two additional U.S. Senate write-ins (Powers, Apelbaum) that the summary did not mention; not resolved. Withdrawals (strikethrough in the official XLSX) still cannot be seen by this tooling.
- The 7 deadlines match the dates reported by a web search of press and county pages that repeat the Secretary of State's calendar; the official calendar itself was not read directly. `dataVerifiedAt` was **not** changed.
- Added: search box on the measures list (e2e covered). 57 unit and 114 browser checks pass locally.

## Corrections process (session 3)
- `#/corrections` page, footer link, `data/corrections.json` (empty history), and pre-filled GitHub issue links for the five problem types. Links carry only the page route and type, never notes or guide entries (unit-tested). Requires a GitHub account to post; there is no private or anonymous channel yet. 59 unit and 120 browser checks pass locally.
- Candidate research was **not** attempted: campaign sites could not be located or fetched with available tools, and press-summary search results include allegations about named people that should not be published without direct, reviewed sources. Needs a human researcher or direct page access.

## Live verification after delayed push (2026-10-22)
- Pushes failed intermittently ("remote end hung up") and landed after a backoff loop; origin/main contained `e0176c8` afterwards. Live site served `index-DJpjbNZI.js` (matching the local build). The suite ran against the live URL (desktop and mobile): 82/82 passed, including the judicial guide, corrections page, measure search and the candidate "0 of 5 areas" labels. The candidate **profile pages** themselves are not live because no profiles exist yet.
