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
