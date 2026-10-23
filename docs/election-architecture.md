# Election data architecture

How to add a state without loosening the editorial rules.

1. **Dataset.** One JSON file per state and election in `data/elections/` (`colorado-2026.json` is the model), validated by `src/lib/election.ts` (zod). Every record cites source ids from the dataset's own `sources` list, with https URLs and retrieval dates. Measures, contests, deadlines, known gaps and an explicit `notCovered` list are required.
2. **Coverage.** `src/lib/states.ts` lists all 50 states and DC. A state is `statewide-verified` only once its dataset exists, passes tests, and a human has checked it against the state's official election office. All others are `unsupported`, and the UI says so and links to the official office.
3. **Editorial gating.** Plain-language explanations stay `draft` and hidden until a named human reviewer and date are recorded. Automation may update facts such as deadlines but must never mark text reviewed.
4. **Privacy.** No addresses or locations are collected. District and local races are never guessed; users go to the official sample-ballot tool.
5. **Freshness.** Each dataset carries `dataVerifiedAt` and `staleAfterDays`; the UI warns when data is stale and `npm run health` reports it.

Currently supported: Colorado (statewide only). The other 50 jurisdictions are unsupported.

## Onboarding checklist for a new state
1. Create `data/elections/<state>-<year>.json` (and optionally `-profiles.json`) following the Colorado files.
2. Run `npm run validate:elections`. It parses every dataset with the same schema, checks the jurisdiction, and refuses a dataset whose state is not yet marked supported.
3. Have a human check the dataset against the state's official election office; record what was checked in `verificationLog`, including what could not be checked.
4. Only then flip the state's entry in `src/lib/states.ts`. `tests/states.test.mts` fails if coverage claims and datasets disagree.
5. List address-dependent races in a `notCovered` array and add the state's sample-ballot tool link; never claim a personalized ballot (see `docs/address-lookup-design.md`).
