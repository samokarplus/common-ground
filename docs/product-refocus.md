# Evidence-first refocus (Common Ground 2.0)

Branch `product/evidence-first`, built on top of the warm redesign (PR #2). This document records what exists, where the data comes from, how it is updated and what is still missing. It states only what was checked.

## Navigation
Five destinations: **Today** (`#/`), **Issues** (`#/issues`), **Government** (`#/government`), **Data** (`#/data`), **Explore** (`#/explore`). **Help Me Vote** (`#/vote`) appears as a separate pill until the election has passed. Search and the reading list stay in the header. Every old route still works; legacy routes map to the destination that now owns them (e.g. `#/congress`, `#/chain`, `#/action` highlight Government; `#/debate`, `#/values`, `#/atlas`, `#/paths` highlight Explore; `#/policy` highlights Issues). Saved items remain backward compatible.

## New routes
| Route | What it is |
| --- | --- |
| `#/` | Calm home: hero, rule-selected recent developments with originals, briefing cards, source freshness |
| `#/issues` | Index of evidence briefings |
| `#/issues/federal-spending` | Revenue, outlays, deficit, debt (Treasury) |
| `#/issues/ukraine-assistance` | Appropriations for Ukraine response (CRS) |
| `#/issues/abortion-statistics` | CDC surveillance counts and rates, 2013–2022 |
| `#/government` | Actions explorer: stage ladder, filters, Congress + Federal Register feed |
| `#/data` | Data hub: briefings, datasets and source freshness |
| `#/explore` | Debate Lab, Values Explorer, Thought Atlas, Pathways |

## Briefing system (`src/lib/briefing.ts`)
Question → short answer → evidence (stat tiles, accessible charts with data tables) → historical context → what changed recently → what happens next → what people disagree about (factual vs values) → original sources → limitations → related. Every claim has a kind (fact, estimate, interpretation, prediction, opinion, unknown). The schema refuses: fact/estimate claims without a source, unknown source ids, bar charts that do not start at zero, "human-reviewed" without reviewer and date, and a values disagreement typed as fact. Null values render as "Not reported", never zero.

## Data sources and updates
| Data | Source | File | Update |
| --- | --- | --- | --- |
| Receipts, outlays, deficit by fiscal year | Treasury Fiscal Data, Monthly Treasury Statement Table 9 | `data/fiscal/treasury.json` | `npm run refresh:fiscal` (unchanged on failure) |
| Debt (fiscal-year ends, milestones, latest) | Treasury Fiscal Data, Debt to the Penny | same | same |
| Ukraine response appropriations (5 acts) | CRS R47275, April 26, 2024 update | `data/fiscal/ukraine-appropriations.json` | manual; CRS publishes revisions irregularly |
| Abortion surveillance 2013–2022 | CDC MMWR Surveillance Summaries 73(7) | `data/stats/abortion-cdc.json` | manual, annual |
| Bills | GovInfo BILLSTATUS | `data/congress/bills.json` | `npm run refresh:congress` |
| Federal Register documents | federalregister.gov API | `data/federal-register/` | `npm run refresh:fr` |

Ingestion is separate from publication: scripts only write snapshots; briefing prose is code in `src/lib/briefings.ts` and its numbers are computed from the snapshots (tests check the prose equals the chart data). Briefings are queued for review in `#/review` as "Machine-checked, not human-reviewed"; they become human-reviewed only through `npm run review:apply` with a decisions file.

## Government actions
Stages: introduced, passed one chamber, passed Congress, signed into law, presidential action, proposed rule, final rule, agency notice. Each stage states what it means and what it is not. Executive orders are never shown as laws (tested). The feed is a selection (the most recently updated bills and newest Federal Register documents), labeled "Selected, not comprehensive", with snapshot dates and a stale warning.

## Home developments
`src/lib/developments.ts` picks items by fixed rules (latest debt milestone, latest fiscal-year deficit, most recent enacted law, most recent executive order, soonest-closing open proposed rule). Each states why it was chosen and links to the original. Only fiscal items link to a briefing; others have none and say so rather than inventing a link.

## Design
Two font families (Fraunces headings, DM Sans body), warm palette, real photographs with credits (`#/credits`). Charts follow `src/components/chart.tsx`: source, units, date range, definition, truncated-axis warning, table alternative.

## Tests
`npm run verify` (lint, typecheck, unit tests, election validation, build, secret scan) and `npm run e2e` (Playwright at 1360/768/390 plus axe on every route, including the new ones).

## Known gaps (not hidden)
- Executive-order list could not be refreshed: federalregister.gov returned HTTP 403 to the development machine's IP. Only the snapshot's orders appear.
- No immigration briefing: the Census API needs a key and no verified table was ingested. The abortion briefing is the third flagship.
- Ukraine: appropriations only (April 2024 update). Obligations, outlays and military-equipment valuation are not reconciled and are said to be missing.
- Abortion Table 1 was transcribed with a summarizing fetch tool; the 2021–22 values and the stated 5-year changes were cross-checked in tests, other cells need a human check against the PDF. Figures are not a national total (California, DC, Maryland, New Hampshire, New Jersey and others missing or partial).
- Nothing is human-reviewed. No administration-comparison data. Scheduled refresh for fiscal data is not active (workflow changes need the owner's `workflow` token scope; see `docs/OWNER-ACTIONS.md`).
- Source-freshness table is dense on narrow screens (scrolls horizontally, keyboard-focusable).

## Refinement: issues at the centre, candidates, presidential actions (branch `product/issues-and-comparison`)

**Chain:** issue → numbers → government action → candidate → competing arguments → original source. Implemented as follows.

| Piece | Route | Notes |
| --- | --- | --- |
| Nine issues | `#/issues`, `#/issues/<issue>` | Cost of living, health care, immigration, abortion, climate/energy, spending/debt, corruption/ethics, public lands, foreign policy. Each page: what is happening and the numbers (from a briefing if one exists, otherwise an explicit "No evidence briefing yet"), government actions tagged to the issue, what people argue, candidate positions, official data pointers. |
| Briefings | `#/issues/consumer-prices` (new), plus the earlier three | The prices briefing uses BLS CPI-U (`npm run refresh:cpi`). October 2025 was never published (lapse in appropriations) and is stored as null, shown as "Not reported". Every briefing page now ends with the connected government actions and candidate positions for its issue. |
| Presidential actions | `#/government/president` | whitehouse.gov Presidential Actions listing, newest 60 documents (`npm run refresh:presidential`), grouped by month, filter by issue/type, commemorative proclamations hidden by default (title heuristic). Five items have an explanation (what changes, effective date, outcomes, uncertainty), drafted by Claude from the official text, **not human-reviewed**. The Federal Register list is still blocked (HTTP 403), so this is the primary source. |
| Candidate comparison | `#/compare`, `#/compare/texas-senate-2026` | Reusable schema (`src/lib/compare.ts`). Each entry is typed (own statement, documented action, independent finding, allegation, opinion), sourced and dated. Each issue has an editorial relation label (differ, overlap, different focus, one undocumented, neither documented) that the schema checks against the entries. "Nothing documented here" is never turned into "no position". No scores, rankings or recommendations; a test scans editorial text for advice words. |
| Review queue | `#/review` | Comparisons, presidential explanations and (previously missing from `review:apply`) briefings are queued as machine-checked and become human-reviewed only through a decisions file. |

**Issue tagging:** by CRS policy area or title keyword (`src/lib/issues.ts`). The page says so; it can miss or misplace items.

**Texas comparison coverage:** all nine issues. Candidate statements come from each campaign's issue pages (read 2026-10-23), plus a few dated official records: Paxton's 2023 impeachment acquittal (Texas Tribune), and Attorney General lawsuits (Texas AG news releases, whose pages our tool could not open; wording follows search excerpts and is flagged on each entry). Talarico's dated legislative examples are his own descriptions and are labelled as such. Voting records and sponsored bills were not compiled.

**Known gaps:** only one race; no immigration or health-care briefing (official data pointers only); no state or federal legislator pages; executive-order status (challenged, blocked) not checked; Federal Register blocked; the five explanations are AI drafts; Paxton's issue page is undated.
