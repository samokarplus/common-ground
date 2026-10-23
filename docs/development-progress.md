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

## Multi-state architecture (session 3)
- `src/lib/states.ts` lists all 50 states and DC; only Colorado is `statewide-verified`. The Help Me Vote landing has a state picker that opens the Colorado guide or honestly declines other states and links to the official election office. `docs/election-architecture.md` documents how to add a state. Tests: 61 unit, 126 browser, all passing locally.

## Federal Register feed filters (session 3)
- Added "Published within" (7/30 days) and "Open for public comment" filters on the Federal Register feed, with a tested pure helper (`src/lib/feed-filter.ts`). Filters apply only to records loaded in the current feed (40 per page), and the date window uses each record's publication date. Agency selection beyond keyword search, pagination controls, document-type timelines and topic filters remain undone. 65 unit and 132 browser checks pass locally.

## Candidate profiles published (2026-10-22)
- Four profiles are live in `data/elections/colorado-2026-profiles.json`: Governor (Phil Weiser, Victor Marx) and U.S. Senate (John Hickenlooper, Mark Baisley). Content is limited to what each candidate's own campaign site says about positions and background (labeled "the candidate's own statement") plus one official record (Colorado General Assembly page for Baisley). Campaign sites were located via search, then read with a summarizing fetch tool, so the text is a paraphrase; each profile page says so and links the exact page. Hickenlooper's Congress.gov page returned 403, so no documented voting record is included for anyone. Coverage is uneven because campaign sites differ (Marx and Hickenlooper pages give little issue detail).
- Deliberately excluded: press-reported controversies and allegations about any candidate, which would need direct, reviewed sources. Other statewide candidates (Secretary of State, Treasurer, Attorney General, third-party and unaffiliated candidates) are still "not yet researched". A human should spot-check each profile's paraphrase against its source page before the election.
- Tests: 66 unit, 141 browser (incl. axe) passing locally.

## Ballot measure explanations source-checked and published with a label (2026-10-22)
- The English Blue Book PDF (an official publication) was downloaded through the fetch tool, text-extracted locally, and used to check all 15 drafts. Six drafts were corrected (see `docs/editorial-review.md`), arguments for and against were added from the Blue Book for the 14 statewide measures, and Ballot Issue 7A got a summary from the district's printed ballot title.
- **Decision for the owner:** per the latest instruction to publish explanations that pass source verification, the 15 explanations are now visible with a new status `source-checked` and a prominent "Source-checked, not human-reviewed" label on every page. This deliberately does not use `reviewed` and records no reviewer, so the original human-review safeguard is intact; changing `publishedExplanation()` in `src/lib/election.ts` to accept only `reviewed` hides them again. The Spanish Blue Book and the fiscal impact statement PDF were not checked.
- Tests: 69 unit, 150 browser. A measure-page overflow at 768px (second status badge) was fixed. Smoke tests now tolerate rate-limited Federal Register requests (HTTP 429) because the app falls back to its snapshot.

## Congress improvements and automation instructions (2026-10-22)
- Real BILLSTATUS files nest recorded votes inside action items; the parser now collects them (with the official action text, which usually states the tally) and bill pages link to the roll calls. After refreshing, 8 of 60 snapshot bills have recorded votes. Tallies are shown as the official action text, not parsed into numbers. Bill summaries (CRS), sponsors, committees, and status-change history (`data/changelog/congress.jsonl`) were already in place.
- Workflow: cannot be activated from here (token lacks `workflow` scope). `docs/enable-automation.md` has the exact manual steps. Congress is still refreshed by hand until then.
- Still not done for Congress: the snapshot covers only the 15 most recently updated bills per type; no House/Senate member-level vote positions; no bill text or provisions summary beyond the CRS summary.

## Agency filter and voter-flow tests (2026-10-22)
- Federal Register feed: agency filter (options are the agencies in the currently loaded records, most frequent first), tested. End-to-end voter workflow test added (`e2e/voter-flow.spec.ts`): mark a measure, write a private note, see it in the guide, export (no address/location fields), confirm nothing is written to browser storage until the opt-in is checked, then delete and confirm storage is cleared. 71 unit and 159 browser checks pass locally.

## Debate Lab: debate maps (2026-10-22)
- New `#/debate/maps` with three maps built on Colorado ballot questions (mail-ballot ID, graduated income tax, keep-and-spend for schools). Each map has: facts both sides can accept (every fact cites the official Blue Book), each side's strongest arguments with a claim-type tag (factual / prediction / definition / value) and a note on what evidence would inform it, areas of agreement, uncertainties, common misconceptions, reflection questions, a steelman exercise (text stays on the page and is not stored), and a claim-type filter.
- Quality checks in `tests/debates.test.mts`: schema; every map links to a real measure; both sides must include a value claim and be within one argument of each other in length (this caught a real imbalance during authoring); every argument states what evidence would inform it; no loaded language; quoted figures must also appear in the source-checked measure explanation.
- Limits: only facts from the Blue Book are used, with no outside studies, so empirical claims are described as unquantified in the official source rather than resolved. Arguments are the Blue Book's summaries of what supporters and opponents submitted, not independently written. Three maps only. The maps carry the same "source-checked, not human-reviewed" label. An accessibility check also found undersized disclosure controls (WCAG 2.2 target size), now fixed. 76 unit and 174 browser checks pass locally.

## Values Explorer: real tradeoffs, export and delete (2026-10-22)
- New "Real tradeoffs on the ballot" view: seven value tensions (e.g. easy access vs. confidence in verification; limits on government revenue vs. public investment), each linked to the Colorado measures where it appears, described with the Blue Book's supporter and opponent arguments. Tests enforce that every statewide measure is connected, both sides appear in each line, and no text maps values to parties, ideologies or identities or predicts how anyone will vote. Added "Download my reflections" and "Delete all" (with confirmation, clears storage); revision of answers was already possible in the journal.
- Limits: still no validated psychological model (and none claimed); the scenarios remain fictional and were not changed; the tradeoff wording is an editorial draft, not human-reviewed. 80 unit and 178 browser checks pass locally.

## Live deploy check and a hosting observation (2026-10-22)
- Live build matched local (`index-B2o2u4J9.js`). 118 of 120 desktop/mobile live checks passed; the 2 failures were a test artifact, not an app bug: https://samokarplus.github.io/common-ground/ answers **301 to `http://samo.karplus.org/common-ground/`** (a custom domain configured outside this repository), so a full-page `goto` to the github.io base URL discarded the in-memory guide. The voter-flow test now changes the hash in-app and passes locally and live.
- **For the owner:** that redirect target is plain `http://`. If the custom domain is intended, check Settings → Pages → "Enforce HTTPS" and the DNS setup. I did not touch this (account-level configuration).

## Attorney General profiles and a parity rule (2026-10-22)
- Profiles added for the two Attorney General major-party candidates (Jena Griswold, Michael J. Allen), from their own campaign sites, same method and caveats as the other four (6 profiles total). A new test enforces **parity**: if any candidate in a contest has a published profile, every Democratic and Republican candidate on that ballot must too.
- Not published: Secretary of State and Treasurer. Campaign sites for James Wiley (SoS) and Kevin Grantham (Treasurer) could not be found through search, so by the parity rule their opponents (Amanda Gonzalez, Jeff Bridges) are also left unprofiled even though their sites were located (amandaforcolorado.com, bridgesforcolorado.com, per press questionnaires, not opened). Third-party and unaffiliated candidates are unprofiled in every contest. A researcher with direct access should add these.
- Judicial guide: still not verified against official pages (site returns 403); individual judge evaluations are not reproduced.

## Phase 1 — live audit (2026-10-22)
- Live (`https://samo.karplus.org/common-ground/`, serving `index-BfRtIqCU.js`, same as local): full suite passed on desktop, tablet and mobile, 180/180 at that point. Corrects an earlier note: the redirect chain ends on HTTPS (see `docs/deployment-and-domain.md`); only the intermediate hop is `http://` and it is GitHub-controlled.
- New `e2e/privacy.spec.ts` (passes locally and live): the whole voter journey makes only GET requests to the site and www.federalregister.gov, never carries a note in a URL or body, sets no cookies, stores nothing before opt-in.
- New `npm run check:links`: 40 external links in election, profile, debate and Atlas data: 37 OK, 0 dead, 3 inconclusive (judicial performance site returns 403 and a Blue Book portal timed out for automated requests; a legislature page returned 406). Inconclusive is not a verdict.
- Fixed: the federal document page showed no heading while loading or when unavailable; it now has a heading and an explanation. 189 browser checks pass locally.

## Phase 2 — source verification (2026-10-22)
- **Dates, measures list:** the Secretary of State's Sept. 4 certification press release (primary) was read; all deadlines match, the Oct. 27 "suggested return day" was missing and was added; the 14 statewide measures match and 7A is district-only. `dataVerifiedAt` updated.
- **Fiscal impact statements:** the English PDF was extracted and every dollar/percent figure in all 15 explanations was machine-matched against it and the Blue Book. This **reversed part of an earlier correction**: Proposition 132's $24.8 million (FY 2028-29) figure and the county cost-shift item were in the fiscal statement, so they were restored alongside the Blue Book's $68.2 million year-five estimate (note kept in `checkNotes`). Propositions 134 and 135's corrections stand (the statement's summary table shows $0 but its narrative describes minimal workload). Added 134's Jan. 1, 2027 effective date.
- **Candidate profiles, second pass:** each cited campaign page was re-fetched and each claim re-checked as supported/partly/not found. Three claims were overstated and rewritten: Hickenlooper (the page says he ran for governor in 2010 and credits results, but never states he served), Baisley (immigration wording, which describes rather than endorses the current system) and Griswold (the page cites no specific laws). All other claims were confirmed. Method limit: a summarizing fetch tool, not a human reading the pages.
- **Visible verification:** the Colorado overview now has "How we checked this, and what we couldn't" (dated entries, methods, results, and the gaps: judicial pages blocked, withdrawals invisible, no human review). Every statewide measure now cites the fiscal statements; a test requires it.
- **Not possible:** judicial information could not be verified (official site returns 403); Spanish editions and the full legal text of measures were not checked; withdrawals in the official XLSX were not visible; no human review.

## Phase 3 — Help Me Vote expansion (2026-10-22)
- Overview now says in plain words that the guide is **not personalized** and explains the nine kinds of races that depend on the voter's address (`src/lib/local-races.ts`, general civic background), with the official sample-ballot and county-office links. A test fails if the UI claims a personalized ballot.
- `docs/address-lookup-design.md`: privacy-first design in three phases (official tool only; optional in-browser matching of the contest names the voter copies from their official sample ballot; browser-side geocoding only if a suitable official service exists and the CSP is deliberately widened). No address is collected or sent today.
- Reusable pipeline: `npm run validate:elections` validates every dataset under `data/elections/`, refuses a state that has data but is not marked supported, and `docs/election-architecture.md` has an onboarding checklist for a new state.
- **Not done:** third-party and unaffiliated candidates remain unprofiled (no vetted sources, and the parity rule blocks partial coverage); no county-by-county data (no verified official source for all 64 county offices); no other state's data; Phase B/C lookup is design only.
- The secret scanner flagged a variable named SECRET in the new privacy test (false positive); the variable was renamed rather than weakening the scanner.

## Phase 4 — automatic updates (2026-10-22)
- **Audit:** the Federal Register pipeline already validates, dedupes, hashes, diffs, bounds its changelog, retries with backoff and leaves the snapshot untouched on failure (unit-tested; one real refresh ran locally and a second reported no change). The Congress script parses with a strict schema (a bad file aborts the whole refresh), now also refuses to replace the snapshot with an empty, duplicated or less-than-half-size result (`refreshProblem`, tested), records success/failure in `data/source-status.json`, and appends new bills, status changes and new latest actions to `data/changelog/congress.jsonl`.
- **Freshness warnings:** a shared `freshness()` helper; the Congress pages now show a visible "Out of date" warning when the snapshot is over 3 days old (the Colorado data already warned after 7).
- **Visible health report:** the in-app `#/status` page has a "Research health" panel with per-source age computed when the page opens, stale flags, last recorded failures, the editorial review queue and known gaps. It states that the scheduled workflow is not yet active. `tests` compare the committed health report with the election data so it cannot silently drift.
- **Never silently replace content:** automation only touches `data/federal-register.json`, `data/congress/`, changelogs and status files. Election data, explanations, profiles and review statuses are never written by a script.
- **Workflow:** `docs/proposed-refresh-workflow.yml` now regenerates the health report before running tests. **Owner action still required** (see `docs/enable-automation.md`). The currently installed workflow keeps working with the new tests (it only refreshes the Federal Register).
- **Not done:** the workflow has never run on GitHub; no alerting beyond a red workflow run; Congress still covers only recent bills.
