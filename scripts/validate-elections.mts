// Validate every election dataset in data/elections/ and print its coverage. Usage: npm run validate:elections
// This is the gate a new state's data must pass before it can be marked supported in src/lib/states.ts.
import { readdirSync, readFileSync } from "node:fs";
import { JURISDICTIONS, coverageOf } from "../src/lib/states.ts";
import { parseElection } from "../src/lib/election.ts";
import { validateProfiles } from "../src/lib/candidate.ts";

const dir = "data/elections";
let failed = false;
for (const f of readdirSync(dir).filter((x) => /^[a-z-]+-\d{4}\.json$/.test(x))) {
  try {
    const e = parseElection(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")));
    const known = JURISDICTIONS.some(([c]) => c === e.state);
    if (!known) throw new Error(`unknown jurisdiction code ${e.state}`);
    if (coverageOf(e.state) !== "statewide-verified") throw new Error(`${e.state} has data but is not marked supported in src/lib/states.ts`);
    const profilesFile = `${dir}/${f.replace(/\.json$/, "-profiles.json")}`;
    let profiles = 0;
    try {
      profiles = validateProfiles(JSON.parse(readFileSync(profilesFile, "utf8")), e.contests).length;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    console.log(`OK ${f}: ${e.state}, ${e.measures.length} measures, ${e.contests.length} contests, ${profiles} profiles, verified ${e.dataVerifiedAt.slice(0, 10)}`);
  } catch (err) {
    failed = true;
    console.error(`FAIL ${f}: ${(err as Error).message}`);
  }
}
process.exit(failed ? 1 : 0);
