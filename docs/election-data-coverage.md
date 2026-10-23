# Election data coverage

## Colorado — 2026 General Election (November 3, 2026)

Data file: `data/elections/colorado-2026.json` · Schema and rules: `src/lib/election.ts` · Tests: `tests/election.test.mts`
Last verified against official sources: **October 22, 2026**. The site shows a stale-data warning if this is more than 7 days old.

| Area | Coverage | Source |
| --- | --- | --- |
| Statewide ballot measures (14) | **Statewide, machine-checked**: designation, short title, type, how it qualified, vote threshold, official text link, Blue Book page references | Secretary of State certification (Sept. 4, 2026) and measures page; 2026 Blue Book |
| Ballot Issue 7A (Front Range Passenger Rail District) | **Listed, district-only**: shown with a district warning, never as statewide | SoS certification; Blue Book p. 100 |
| Plain-language summaries, YES/NO meaning, fiscal notes | **Drafted, hidden until reviewed** | Blue Book; fiscal impact statements |
| U.S. Senate, Governor/Lt. Governor, Secretary of State, Treasurer, Attorney General | **Statewide, machine-checked**: candidate names and listed affiliations, write-in flags | SoS official candidate list (updated Sept. 15, 2026) |
| Colorado Supreme Court and Court of Appeals retention | **Statewide**: judge names (from the SoS list; not re-verified in the 2026-10-22 check because the official evaluation site blocks automated access); links to official performance evaluations; no ratings from us | SoS candidate list; Office of Judicial Performance Evaluation |
| Key dates and deadlines | **Verified**: shown as passed, today, or upcoming in Mountain Time | SoS certification |
| U.S. House, state legislature, State Board of Education, CU Regents | **Not covered**: depends on address | Use the official sample ballot |
| County offices, district attorneys, district and county judges | **Not covered** | Use the official sample ballot |
| City, school district, special district measures | **Not covered** | Use the official sample ballot |
| Candidate positions and backgrounds | **Not compiled**: labeled as such, never inferred from party | — |

## How personal ballots are handled

We never ask for an address, ZIP code, or location, and never infer one from IP or device location. A city or ZIP code can't determine every district, so the site never calls a list "your ballot." Voters are sent to GoVoteColorado.gov and their county clerk for their official, address-specific ballot.

## Known gaps and discrepancies

- **Proposition 135 short title:** "Prohibit Certain Surgeries **on** Minors" (SoS measures page) versus "…**for** Minors" (SoS press release). Shown on the measure page.
- **Withdrawn candidates:** the official list marks them with strikethrough, which the transcription couldn't capture. Flagged on every contest page.
- **Full ballot titles** are not reproduced. We link to the official title and text documents instead, to avoid transcription errors.
- **Quick-reference page numbers** for Propositions 132–137 are recorded as the guide's range (pp. 7–14).

## Other states

Not covered. The site links to each state's official election office (usa.gov) and vote.gov, and shows no unverified ballot content.

## Refreshing this data

There's no free machine-readable feed for Colorado ballot content, so updates are manual and reviewed:
1. Re-check the SoS certification and measures pages, the official candidate list, and any Blue Book corrections.
2. Edit the JSON, update `dataVerifiedAt`, and set affected explanations to `needs-re-review`.
3. Run `npm test` (the schema rejects duplicates, unknown sources, bad dates, wrong thresholds, and partisan labels on retention questions), then build, commit, and push.
