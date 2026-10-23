// Apply a decisions file produced by a human reviewer on the #/review page.
// Usage: npm run review:apply -- path/to/decisions.json [--dry-run]
// This is the ONLY code path that can mark content human-reviewed. It never runs automatically.
import { readFileSync, writeFileSync } from "node:fs";
import { DecisionFileSchema, applyDecisions, buildQueue, type Decision } from "../src/lib/review.ts";
import { parseElection } from "../src/lib/election.ts";
import { validateProfiles } from "../src/lib/candidate.ts";
import { DEBATES } from "../src/lib/debates.ts";
import { atlasNodes } from "../src/lib/atlas.ts";

const file = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));
if (!file) {
  console.error("Usage: npm run review:apply -- decisions.json [--dry-run]");
  process.exit(2);
}
const dry = process.argv.includes("--dry-run");
const ELECTION = "data/elections/colorado-2026.json";
const LOG = "data/review/decisions.json";
const raw = JSON.parse(readFileSync(ELECTION, "utf8"));
const election = parseElection(raw);
const profiles = validateProfiles(JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8")), election.contests);
const log = JSON.parse(readFileSync(LOG, "utf8")) as Decision[];
const parsed = DecisionFileSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
if (!parsed.success) {
  console.error("Invalid decisions file:\n" + parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}
const queue = buildQueue({ election, profiles, debates: DEBATES, atlasCount: atlasNodes.length, log, builtOn: "" });
const result = applyDecisions(election, log, parsed.data, queue.map((q) => q.id));
if (result.errors.length) {
  console.error("Refusing to apply:\n" + result.errors.map((e) => `  ${e}`).join("\n"));
  process.exit(1);
}
parseElection(result.election); // the result must still validate
console.log(`${dry ? "Dry run: would apply" : "Applying"} ${result.applied.length} decision(s):`);
for (const d of parsed.data) console.log(`  ${d.decision.padEnd(15)} ${d.itemId} (${d.reviewer}, ${d.on})`);
if (!dry) {
  writeFileSync(ELECTION, JSON.stringify(result.election, null, 2) + "\n");
  writeFileSync(LOG, JSON.stringify(result.log, null, 2) + "\n");
  console.log("Wrote data. Now run: npm run health && npm test && npm run build, then commit.");
}
