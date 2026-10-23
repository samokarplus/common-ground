# Election data architecture

How to add a state without loosening the editorial rules.

1. **Dataset.** One JSON file per state and election in `data/elections/` (`colorado-2026.json` is the model), validated by `src/lib/election.ts` (zod). Every record cites source ids from the dataset's own `sources` list, with https URLs and retrieval dates. Measures, contests, deadlines, known gaps and an explicit `notCovered` list are required.
2. **Coverage.** `src/lib/states.ts` lists all 50 states and DC. A state is `statewide-verified` only once its dataset exists, passes tests, and a human has checked it against the state's official election office. All others are `unsupported`, and the UI says so and links to the official office.
3. **Editorial gating.** Plain-language explanations stay `draft` and hidden until a named human reviewer and date are recorded. Automation may update facts such as deadlines but must never mark text reviewed.
4. **Privacy.** No addresses or locations are collected. District and local races are never guessed; users go to the official sample-ballot tool.
5. **Freshness.** Each dataset carries `dataVerifiedAt` and `staleAfterDays`; the UI warns when data is stale and `npm run health` reports it.

Currently supported: Colorado (statewide only). The other 50 jurisdictions are unsupported.
