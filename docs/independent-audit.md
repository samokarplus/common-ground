# Independent engineering audit — October 22, 2026

This report separates the deployed site from the fixes on `codex/independent-audit`. Reviewable changes: [pull request #1](https://github.com/samokarplus/common-ground/pull/1). No main-branch push or automatic merge was authorized for this audit. The private server beta was not accessed or copied. No paid services, keys, billing changes, or new dependencies were used.

## Scope and evidence

Fetched `26787d7`, inspected history, all application routes, data modules, tests, workflow, and relevant documentation. Subsequently incorporated concurrent documentation-only commit `c4c370c` without overwriting its domain guidance. Used a separate worktree. The initial production build reproduced the live site's HTML and asset entry byte for byte. Older README/current-state/handoff claims (19 Atlas nodes, no Congress, hidden explanations) were stale.

### Existing functionality actually present

| Area | Verified behavior | Limits |
| --- | --- | --- |
| Home/navigation/search | Hash deep links, global search, election entry points, mobile navigation | Search is local to included content |
| Federal Register / Policy Explorer | Filters, agency/keyword search, document details, original citations, dated fallback | API returned 403 locally and in the live browser; fallback worked. Policy cards/questions are editorial, not comprehensive policy research |
| Congress | 160 selected GovInfo bills, search/status/chamber filters, details, source links, action histories | Not all bills; CRS summaries can be shortened; no member scorecards or parsed vote tallies |
| Help Me Vote | 14 statewide measures plus district 7A; statewide races and retention; explanations, sources, comparisons, official personal-ballot handoff | No address matching or verified county/municipal ballot; statewide overview is not a personalized ballot |
| Candidate research | 13 attributed profiles and explicit research gaps, consistent comparison questions | Coverage uneven; statements and campaign claims are attributed rather than independently proved |
| Private guide | Session notes, opt-in persistence, download, print and deletion | No sync; device storage is readable by others using the browser |
| Values / debate | Local reflections, exports, deletion, real-measure tradeoffs, six argument maps and claim-type filters | Deterministic tools, not generative AI; no automated fact-checking or personalized persuasion |
| Thought Atlas / pathways / record | 86 ideas, 161 edges, linked readings; guided paths; promise-to-outcome stages distinguish missing evidence | Editorial material, not peer-reviewed; record feature has one worked example |
| Research/editorial dashboards | Source age, gaps, review queue and decision-file export | No shipped human decisions; applying a file is a maintainer action, not a browser publication action |

Visual inspection covered the live desktop home, mobile measure list, and tablet Congress page. The design has a clear hierarchy, direct official-source access, restrained typography and responsive navigation. Browser checks additionally cover the major journeys at 1360×900, 768×1024 and 390×844. Automated accessibility checks do not constitute accessibility certification or prove political neutrality.

## Defects corrected on this branch

1. **Privacy deletion retained ballot notes in memory.** The global Privacy page cleared storage but not the module guide cache. Returning to the guide could show deleted notes and a later edit could save them again. It now clears notes, persistence consent and storage error state; other tabs also clear cached guides on storage deletion. Regression journeys cover saved and session notes, navigation, subsequent edits and reload.
2. **Requested editorial changes could leave approved explanations public.** Request-changes now revokes approval metadata, hides the explanation pending review, and appears as changes-requested in the queue. Shipped content is still not marked human-reviewed.
3. **Separate chamber votes were treated as agreement.** The status mapper now distinguishes passage of versions with agreement unconfirmed; enrollment/concurrence evidence is required for passed-both. It still derives status heuristically and directs readers to the official record.
4. **Malformed XML could be accepted.** Truncated/mismatched source XML and DTD/entity declarations now fail ingestion, preserving the snapshot. Bill and roll-call citations also reject insecure URLs, embedded credentials and non-official/lookalike hosts.
5. **Unchanged Federal Register checks did not record recovery.** A successful unchanged check now clears the current error and records `lastCheckedAt`, preserving content hashes, retrieval timestamps and changelogs. Congress successful checks also record time. Source-health ages use successful checks when available; historical failures remain in provenance.
6. **Source labels overstated human review and automation.** Registry categories now say scripted or manual-source-checked. A script's existence does not prove that scheduling works.
7. **Workflow omitted Congress and the bot-to-Pages step.** Replacement refreshes sources independently, validates before committing, detects new files, avoids force pushing, refuses private repositories, and requests Pages only on the default branch. See automation evidence below.
8. **Browser tests swallowed assertions.** Removed caught assertion failures, scoped debate checks to cards rather than the filter button, and required related-reading content. Local preview tests no longer silently reuse an unrelated server. Generated browser reports are excluded from publication scans, like other ignored outputs; they remain ignored by Git.

### Useful additions

- Complete bill timeline expansion/collapse, beyond the original 25-action cutoff.
- Accessible heading and direct official-search fallback for unknown/rotated-out bills, explaining that absence is not evidence of withdrawal.
- Bill detail language now says no enactment is recorded **in the snapshot**, rather than asserting an unqualified current legal status.
- Source-health UI shows the last successful check separately from content change time.

## Civic data verification

Downloaded current official sources to ignored audit scratch space; no private attachment or raw audit download was published.

- [Secretary of State certification and deadlines](https://www.coloradosos.gov/pubs/newsRoom/pressReleases/2026/PR20260904BallotCertification.html): checked all 14 statewide designations, district-only 7A, November 3 election and all eight dated deadline entries (October 2, 9, 12, 19, 26 twice, 27 and November 3). Standard Election Day receipt/in-line deadline is 7 p.m.; military/overseas rules are distinct on the official page.
- [Official candidate workbook](https://www.coloradosos.gov/pubs/elections/vote/files/2026/2026GeneralCandidateListOfficial.xlsx): compared all 34 statewide entries, affiliations, write-in status, seven running mates, cell-style and rich-text strike formatting. All matched; none of these statewide entries was struck through in this downloaded version. This is not a promise that later withdrawals will not occur.
- [English Blue Book](https://content.leg.colorado.gov/sites/default/files/2026-blue-book-en-accessible.pdf): checked thresholds for all 15 included measures. Amendments 81–86 require 55%; Amendment 87 requires a majority, as already corrected before this audit. Remaining included propositions and 7A use a majority. No threshold correction was needed.
- [Fiscal statements](https://content.leg.colorado.gov/sites/default/files/2026-fiscal-impact-statements-english-accessible.pdf): checked cited dollar figures for 81, 84, 86, 87, NN, 132 and 137 against extracted official tables/text; visually inspected Amendment 87 revenue table. Confirmed $958.4 million/$1,972.0 million revenue estimates, distinct from the Blue Book's maximum-revenue figure; checked other included fiscal references, not a full independent fiscal analysis. District 7A amounts are in the Blue Book notice.
- Judicial names were verified against the workbook. Individual performance evaluations/recommendations were **not independently verified**; the official evaluation site blocked automated access. The site provides links and does not invent ratings.
- No candidate-profile claim received a new human approval. The source comparison is AI-assisted engineering verification, not human editorial review or a legal opinion. Full legal texts, Spanish wording, county ballots, and every candidate-policy claim remain outside this verification.

Source download SHA-256 fingerprints:

| File | SHA-256 |
| --- | --- |
| Official XLSX | `a12c4776d4b819a49f985724e2172331b8a38763b838afbc16875c05f7cefd92` |
| English Blue Book | `137ba55ce1c6880e871d67a077312072686e6aec9a475c387e482d9700164248` |
| Fiscal PDF | `2b9ddec19d1ae5fc286aa99ecc979a8507d4a472f49e4b6a020fae52ad9b7efc` |

## Validation results

- Baseline: 128 unit tests and 288 browser tests passed; lint, types, election validation, build and publication scan passed. Live HTML matched the initial build.
- Improved branch: 300 browser tests passed, including all three viewports, axe WCAG A/AA checks, critical guide deletion, complete timeline and unknown bill journeys. Final local verification: 132 unit tests passed; lint, TypeScript, election-data validation, production build and publication scan passed. After the final citation/schema and health changes, 33 targeted browser/accessibility checks also passed.
- Live site: 273 distinct smoke/accessibility cases passed across three sizes after correcting the test selector and allowing the existing automation wording. Initial run had four test-assertion failures (269 passed); six targeted rechecks passed. These rechecks did not publish fixes or make production deletion claims.
- Citation recheck: 54 links, 49 responded, zero confirmed dead, five inconclusive (403/timeouts). Inconclusive is not equivalent to working or broken.
- npm dependency audit: zero reported vulnerabilities across all severities. Publication pattern scan found no secrets or personal paths; this is a targeted scan, not a guarantee against every possible secret.
- Real local GovInfo refresh: 160 bills checked, unchanged content preserved. Real local Federal Register refresh: HTTP 403, snapshot unchanged, failure recorded. Integration regression runs the actual FR script with fixture responses twice, verifies unchanged content/changelog, verifies error recovery, then verifies 403 failure preservation. Fixture success is not represented as live API success.

## Automation evidence

The original default-branch workflow had **zero runs** when queried. It refreshed only Federal Register, stopped immediately on its failure, missed untracked additions, and relied on bot pushes to deploy. The previous proposal added Congress but still lacked explicit publication.

[GitHub documents that GITHUB_TOKEN pushes do not trigger Pages builds](https://docs.github.com/en/actions/concepts/security/github_token). The replacement uses the [Pages build request endpoint](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build), with `pages: write`, and restricts that request to the default branch. [Standard runners in a public repository are free](https://docs.github.com/en/billing/concepts/product-billing/github-actions); no caches, artifacts, large runners or paid service were added.

The existing Git credential could push application code but rejected workflow updates for missing `workflow` scope. The signed-in GitHub editor successfully committed the exact proposed YAML on the audit branch. Its author uses the approved no-reply email. No token was exposed or broadened, and no account-wide Actions permissions were changed.

A real branch-only dispatch was started: [run 39893778468](https://github.com/samokarplus/common-ground/actions/runs/39893778468). Federal Register succeeded on the GitHub runner even though it failed locally. It completed successfully in 1m48s: both official source steps, verification/build/scan and branch bot push succeeded. Bot commit `3f784ca` recorded both successful checks with unchanged content; Pages was correctly skipped. The runner emitted a Node 20 action deprecation warning for checkout/setup-node v4 (forced to Node 24 by GitHub) and an ubuntu-latest migration notice; these did not fail the run. Upgrade/pin these actions and runner in a separately verified maintenance change. The default branch and live site are deliberately untouched; daily scheduling and the default-branch Pages request require verification after reviewed merge.

## Remaining work and next priorities

1. Coordinate review/merge with the other developer; then dispatch on main and verify bot commit, Pages job and live hash. Observe a scheduled run before calling daily automation operational.
2. Human-review the 15 explanations and 13 profiles against full primary text; obtain official judicial evaluations. Bind approval decisions to content hashes in a future change so old approvals cannot survive revisions accidentally.
3. Improve candidate coverage fairly across parties, with dated primary records and explicit missing information.
4. Add verified county/district ballot datasets using official sources, preserving the address-free privacy model and coverage labels.
5. Replace heuristic congressional stage inference with richer structured action evidence, broaden selection and attach reviewable real-document explainers to policy topics.

Generative debate AI, national/local ballot completeness, human editorial certification, accounts/sync and broad outcomes tracking are not implemented. They must not be advertised as complete. No paid backend should be introduced to fill these gaps.
