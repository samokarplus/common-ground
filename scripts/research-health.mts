// Generate docs/research-health.md, data/research-health.json, and docs/source-registry.md.
// Usage: npm run health
import { readFile, writeFile } from "node:fs/promises";
import { SOURCE_REGISTRY } from "../src/lib/source-registry.ts";
import { parseElection, deadlineState, daysUntil, isStale, localDate } from "../src/lib/election.ts";

const now = new Date();
const today = localDate(now, "America/Denver");
const readJSON = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const snapshot = await readJSON("data/federal-register.json");
const status = await readJSON("data/source-status.json").catch(() => ({}));
const changelog = (await readFile("data/changelog/federal-register.jsonl", "utf8").catch(() => ""))
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const congress = await readJSON("data/congress/bills.json");
const election = parseElection(await readJSON("data/elections/colorado-2026.json"));

const ageDays = (iso: string) => Math.floor((now.getTime() - Date.parse(iso)) / 86400000);
const frAge = ageDays(snapshot.retrievedAt);
const review = { draft: 0, "source-checked": 0, reviewed: 0, "needs-re-review": 0 } as Record<string, number>;
for (const m of election.measures) review[m.draft.review.status]++;
const upcoming = election.deadlines
  .filter((d) => deadlineState(d.date, now, election.timeZone) !== "passed")
  .map((d) => ({ ...d, inDays: daysUntil(d.date, now, election.timeZone) }));
const discrepancies = election.measures.flatMap((m) => (m.discrepancies || []).map((d) => ({ id: m.id, note: d })));
const last = changelog.at(-1);
const cgAge = ageDays(congress.retrievedAt);

const health = {
  generatedOn: today,
  sources: {
    "federal-register": {
      snapshotRetrievedAt: snapshot.retrievedAt,
      snapshotAgeDays: frAge,
      stale: frAge > 3,
      ...(status["federal-register"] || {}),
      lastChange: last
        ? { at: last.at, added: last.added.length, changed: last.changed.length, leftWindow: last.leftWindow.length, rejected: last.rejected.length }
        : null,
    },
    "govinfo-billstatus": {
      snapshotRetrievedAt: congress.retrievedAt,
      snapshotAgeDays: cgAge,
      stale: cgAge > 3,
      billCount: congress.bills.length,
      ...(status["govinfo-billstatus"] || {}),
    },
    "colorado-2026-election": {
      dataVerifiedAt: election.dataVerifiedAt,
      ageDays: ageDays(election.dataVerifiedAt),
      stale: isStale(election, now),
      reviewQueue: review,
    },
  },
  upcomingElectionDeadlines: upcoming,
  unresolvedDiscrepancies: discrepancies,
  knownGaps: election.knownGaps,
};
await writeFile("data/research-health.json", JSON.stringify(health, null, 2) + "\n");

const fr = health.sources["federal-register"];
const co = health.sources["colorado-2026-election"];
const md = `# Research health

_Generated ${today} by \`npm run health\`. Regenerated automatically when the scheduled refresh changes data._

## Sources

| Source | Last updated in repo | Age | Status |
| --- | --- | --- | --- |
| Federal Register (automated) | ${snapshot.retrievedAt.slice(0, 10)} | ${frAge} days | ${fr.stale ? "⚠️ stale (older than 3 days)" : "OK"}${status["federal-register"]?.lastError ? ` · last error: ${status["federal-register"].lastError} (${status["federal-register"].lastFailure})` : ""} |
| Congress bills, GovInfo (script; scheduled run pending) | ${congress.retrievedAt.slice(0, 10)} | ${cgAge} days | ${health.sources["govinfo-billstatus"].stale ? "⚠️ stale (older than 3 days)" : "OK"}${status["govinfo-billstatus"]?.lastError ? ` · last error: ${status["govinfo-billstatus"].lastError} (${status["govinfo-billstatus"].lastFailure})` : ""} |
| Colorado 2026 election (manual, reviewed) | ${election.dataVerifiedAt.slice(0, 10)} | ${co.ageDays} days | ${co.stale ? "⚠️ stale — re-verify against official sources" : "OK"} |

"Last updated in repo" is when official content last changed. A check that finds no change writes nothing, so its time shows in the workflow run history, not here.

## Latest Federal Register change

${
  last
    ? `${last.at}: ${last.added.length} new, ${last.changed.length} updated, ${last.leftWindow.length} left the newest-40 window, ${last.rejected.length} rejected as invalid.`
    : "No changes recorded yet."
}

## Editorial review queue (Colorado measures)

- Draft, hidden from the site: **${review.draft}**
- Source-checked against the Blue Book, shown with a "not human-reviewed" label: **${review["source-checked"]}**
- Human-reviewed and published: **${review.reviewed}**
- Needs re-review after an official change: **${review["needs-re-review"]}**

See \`editorial-review.md\`.

## Upcoming election deadlines

${upcoming.length ? upcoming.map((d) => `- ${d.date} (in ${d.inDays} days): ${d.label}`).join("\n") : "- None remaining."}

## Unresolved discrepancies

${discrepancies.length ? discrepancies.map((d) => `- ${d.id}: ${d.note}`).join("\n") : "- None."}

## Known gaps

${election.knownGaps.map((g) => `- ${g}`).join("\n")}
`;
await writeFile("docs/research-health.md", md);

const reg = `# Source registry

_Generated from \`src/lib/source-registry.ts\` by \`npm run health\`._

Integration types: **automated** (scheduled refresh), **browser-live** (fetched by the visitor's browser), **manual-reviewed** (transcribed by a maintainer, checked, versioned), **link-only** (we send visitors there; no data is copied), **planned** (not yet used).

${SOURCE_REGISTRY.map(
  (s) => `## ${s.name}

- **Publisher:** ${s.publisher} · **Jurisdiction:** ${s.jurisdiction} · **Authority:** ${s.authority}
- **URL:** ${s.url}
- **Format / access:** ${s.format} · ${s.access}
- **Updates:** ${s.updateFrequency} · **Integration:** ${s.integration}
- **Terms:** ${s.terms}
- **Known gaps:** ${s.knownGaps}
`,
).join("\n")}`;
await writeFile("docs/source-registry.md", reg);
console.log("Wrote docs/research-health.md, data/research-health.json, docs/source-registry.md");
