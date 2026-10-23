// Refresh the Congress snapshot from GovInfo BILLSTATUS bulk data (official, keyless).
// Usage: npm run refresh:congress   (add --dry-run to report without writing)
// Takes the most recently updated bills per type. Leaves the snapshot untouched on any failure.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { diffBills, parseBillStatus, refreshProblem, type Bill } from "../src/lib/congress.ts";

const OUT = "data/congress/bills.json";
const CHANGELOG = "data/changelog/congress.jsonl";
const HEALTH = "data/source-status.json";
const ID = "govinfo-billstatus";
const CONGRESS = 119;
const TYPES = ["hr", "s", "hjres", "sjres"];
const PER_TYPE = Number(process.env.CONGRESS_PER_TYPE ?? 40);
const dryRun = process.argv.includes("--dry-run");
const UA = { "User-Agent": "CommonGround-civic-education (+https://github.com/samokarplus/common-ground)" };

async function get(url: string, accept?: string, attempts = 3): Promise<string> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(accept ? { Accept: accept } : {}) } });
      if (res.ok) return await res.text();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
  throw last;
}

const parseStamp = (s: string) => Date.parse(s.replace(/(\d+)-(\w+)-(\d+) /, "$1 $2 $3 ") + " UTC") || 0;

type Status = Record<string, { lastSuccess?: string; lastCheckedAt?: string; lastFailure?: string; lastError?: string; lastChange?: string }>;
async function recordStatus(patch: Status[string]) {
  if (dryRun) return;
  let status: Status = {};
  try {
    status = JSON.parse(await readFile(HEALTH, "utf8"));
  } catch {
    /* first run */
  }
  const prev = status[ID] || {};
  const next = { ...prev, ...patch };
  if (JSON.stringify(prev) === JSON.stringify(next)) return;
  status[ID] = next;
  await writeFile(HEALTH, JSON.stringify(status, null, 2) + "\n");
}
const today = new Date().toISOString().slice(0, 10);

try {
  const bills: Bill[] = [];
  for (const t of TYPES) {
    const list = JSON.parse(await get(`https://www.govinfo.gov/bulkdata/json/BILLSTATUS/${CONGRESS}/${t}`, "application/json")) as {
      files: { name: string; link: string; formattedLastModifiedTime: string; folder: boolean }[];
    };
    const recent = list.files
      .filter((f) => !f.folder && f.name.endsWith(".xml"))
      .sort((a, b) => parseStamp(b.formattedLastModifiedTime) - parseStamp(a.formattedLastModifiedTime))
      .slice(0, PER_TYPE);
    for (const f of recent) {
      bills.push(parseBillStatus(await get(f.link)));
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  bills.sort((a, b) => b.updateDate.localeCompare(a.updateDate));
  let prev: { bills?: Bill[] } = {};
  try {
    prev = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* first run */
  }
  const problem = refreshProblem(prev.bills, bills);
  if (problem) throw new Error(`refusing to replace the snapshot: ${problem}`);
  if (JSON.stringify(prev.bills) === JSON.stringify(bills)) {
    console.log("No change in official bill data. Nothing written.");
    await recordStatus({ lastSuccess: today, lastError: undefined, lastCheckedAt: new Date().toISOString() });
  } else if (dryRun) {
    console.log(`Dry run: would write ${bills.length} bills.`);
  } else {
    await mkdir("data/congress", { recursive: true });
    const snapshot = {
      source: "GovInfo BILLSTATUS bulk data (U.S. Government Publishing Office)",
      sourceUrl: `https://www.govinfo.gov/bulkdata/BILLSTATUS/${CONGRESS}`,
      congress: CONGRESS,
      retrievedAt: new Date().toISOString(),
      selection: `Most recently updated ${PER_TYPE} bills of each type (${TYPES.join(", ")}). Not a complete list.`,
      bills,
    };
    await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n");
    const changes = diffBills(prev.bills ?? [], bills);
    await mkdir("data/changelog", { recursive: true });
    const log = (await readFile(CHANGELOG, "utf8").catch(() => "")) + JSON.stringify({ at: snapshot.retrievedAt, changes }) + "\n";
    await writeFile(CHANGELOG, log);
    await recordStatus({ lastSuccess: today, lastChange: snapshot.retrievedAt, lastError: undefined, lastCheckedAt: new Date().toISOString() });
    console.log(`Wrote ${bills.length} bills to ${OUT}.`);
  }
} catch (e) {
  console.error(`GovInfo unavailable or unparseable: ${(e as Error).message}. Snapshot left unchanged.`);
  await recordStatus({ lastFailure: today, lastError: (e as Error).message });
  process.exit(1);
}
