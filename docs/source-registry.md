# Source registry

_Generated from `src/lib/source-registry.ts` by `npm run health`._

Integration types: **automated** (scheduled refresh), **browser-live** (fetched by the visitor's browser), **manual-reviewed** (transcribed by a maintainer, checked, versioned), **link-only** (we send visitors there; no data is copied), **planned** (not yet used).

## Federal Register API

- **Publisher:** Office of the Federal Register / GPO · **Jurisdiction:** United States · Federal · **Authority:** official-primary
- **URL:** https://www.federalregister.gov/developers/documentation/api/v1
- **Format / access:** REST API (JSON) · Keyless; CORS allows browser requests
- **Updates:** Each federal business day · **Integration:** automated
- **Terms:** U.S. government work; public domain
- **Known gaps:** Agency rules, notices, and presidential documents only; no bills, court rulings, or state actions.

## Colorado amendments and propositions on the 2026 ballot

- **Publisher:** Colorado Secretary of State · **Jurisdiction:** Colorado · **Authority:** official-primary
- **URL:** https://www.coloradosos.gov/pubs/elections/Initiatives/ballot/contacts/2026.html
- **Format / access:** HTML · Public web page; no API
- **Updates:** As measures are certified or committees register · **Integration:** manual-reviewed
- **Terms:** Public government information
- **Known gaps:** Committee lists noted as not final; check TRACER for campaign finance.

## Colorado 2026 General Election official candidate list

- **Publisher:** Colorado Secretary of State · **Jurisdiction:** Colorado · **Authority:** official-primary
- **URL:** https://www.coloradosos.gov/pubs/elections/vote/generalCandidates.html
- **Format / access:** XLSX · Public page with downloadable XLSX
- **Updates:** Updated after certification and withdrawals · **Integration:** manual-reviewed
- **Terms:** Public government information
- **Known gaps:** Withdrawals shown with strikethrough formatting; district races require address-level lookup.

## 2026 State Ballot Information Booklet (Blue Book)

- **Publisher:** Colorado Legislative Council Staff · **Jurisdiction:** Colorado · **Authority:** official-analysis
- **URL:** https://content.leg.colorado.gov/publications/2026-statewide-ballot-information-booklet
- **Format / access:** PDF · Public PDF (English and Spanish, audio edition available)
- **Updates:** Once per election, with possible corrections · **Integration:** manual-reviewed
- **Terms:** Public government information
- **Known gaps:** Statewide measures only, plus district notices; judges listed by area.

## 2026 fiscal impact statements

- **Publisher:** Colorado Legislative Council Staff · **Jurisdiction:** Colorado · **Authority:** official-analysis
- **URL:** https://content.leg.colorado.gov/publications/2026-fiscal-impact-statements
- **Format / access:** PDF · Public PDF
- **Updates:** Once per election · **Integration:** manual-reviewed
- **Terms:** Public government information
- **Known gaps:** Estimates, not guarantees.

## Judicial performance evaluations

- **Publisher:** Colorado Office of Judicial Performance Evaluation · **Jurisdiction:** Colorado · **Authority:** official-analysis
- **URL:** https://judicialperformance.colorado.gov/
- **Format / access:** HTML · Public web pages
- **Updates:** Each retention election · **Integration:** link-only
- **Terms:** Public government information
- **Known gaps:** Common Ground links to evaluations and does not summarize or rate judges.

## GoVoteColorado

- **Publisher:** Colorado Secretary of State · **Jurisdiction:** Colorado · **Authority:** official-directory
- **URL:** https://www.govotecolorado.gov/
- **Format / access:** HTML · Voter-facing lookup; requires personal information entered on the official site
- **Updates:** Live · **Integration:** link-only
- **Terms:** Official voter services; Common Ground never handles this data
- **Known gaps:** Not integrated by design, to keep personal voter data off Common Ground.

## Congress.gov API

- **Publisher:** Library of Congress · **Jurisdiction:** United States · Federal · **Authority:** official-primary
- **URL:** https://api.congress.gov/
- **Format / access:** REST API (JSON) · Free API key required; key must never be shipped in browser code
- **Updates:** Daily · **Integration:** planned
- **Terms:** Public data; API terms apply
- **Known gaps:** Not yet integrated. Plan: maintainer-run snapshot with the key kept in a local environment variable.

## GovInfo bulk data — Bill Status

- **Publisher:** U.S. Government Publishing Office · **Jurisdiction:** United States · Federal · **Authority:** official-primary
- **URL:** https://www.govinfo.gov/bulkdata/BILLSTATUS
- **Format / access:** XML bulk data · Keyless bulk download
- **Updates:** Several times daily · **Integration:** manual-reviewed
- **Terms:** U.S. government work; public domain
- **Known gaps:** Refresh script exists (npm run refresh:congress) but is run by hand until the owner applies docs/proposed-refresh-workflow.yml (needs a token with workflow scope). Snapshot holds only the 15 most recently updated bills of each type (H.R., S., H.J.Res., S.J.Res.) of the 119th Congress; no concurrent/simple resolutions; vote tallies not parsed; status is derived from the action log.
