// Refresh the bundled Federal Register snapshot from the official, keyless API.
// Usage: npm run refresh:fr   (add --dry-run to report without writing)
// Writes only when official content changed. Exit code 0 = ok (changed or not), 1 = source failure.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { frFieldQuery } from "../src/lib/domain.ts";
import { appendChangelog, planRefresh, retryDelayMs, type Snapshot } from "../src/lib/pipeline.ts";

const SNAPSHOT = "data/federal-register.json";
const CHANGELOG = "data/changelog/federal-register.jsonl";
const HEALTH = "data/source-status.json";
const URL_ = `https://www.federalregister.gov/api/v1/documents.json?per_page=40&order=newest&${frFieldQuery()}`;
const dryRun = process.argv.includes("--dry-run");

async function fetchWithRetry(url: string, attempts = 4) {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: { Accept: "application/json", "User-Agent": "CommonGround-civic-education (+https://github.com/samokarplus/common-ground)" },
      });
      if (res.status === 429 || res.status >= 500) {
        last = new Error(`HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, retryDelayMs(i, res.headers.get("retry-after"))));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as { results?: unknown[] };
    } catch (e) {
      last = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, retryDelayMs(i, null)));
    }
  }
  throw last;
}

async function readJSON<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return null;
  }
}

type Status = Record<string, { lastSuccess?: string; lastFailure?: string; lastError?: string; lastChange?: string }>;

async function recordStatus(patch: Status[string]) {
  const status = (await readJSON<Status>(HEALTH)) || {};
  const prev = status["federal-register"] || {};
  const next = { ...prev, ...patch };
  // Avoid churn: a repeated identical failure doesn't rewrite the file.
  if (JSON.stringify(prev) === JSON.stringify(next)) return;
  status["federal-register"] = next;
  if (!dryRun) await writeFile(HEALTH, JSON.stringify(status, null, 2) + "\n");
}

const now = new Date();
let body: { results?: unknown[] };
try {
  body = await fetchWithRetry(URL_);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`Federal Register unavailable: ${msg}. Snapshot left unchanged.`);
  await recordStatus({ lastFailure: now.toISOString().slice(0, 10), lastError: msg });
  process.exit(1);
}

const prev = await readJSON<Snapshot>(SNAPSHOT);
const plan = planRefresh(prev, Array.isArray(body.results) ? body.results : [], now);
if (!plan.ok) {
  console.error(plan.reason);
  await recordStatus({ lastFailure: now.toISOString().slice(0, 10), lastError: plan.reason });
  process.exit(1);
}
if (plan.rejected.length) console.warn(`Rejected ${plan.rejected.length} invalid record(s):`, plan.rejected);
if (!plan.changed) {
  console.log(`No change in official content (hash ${plan.contentHash.slice(0, 12)}). Nothing written.`);
  process.exit(0);
}
const { entry, snapshot } = plan;
console.log(
  `Changed: ${entry.added.length} new, ${entry.changed.length} updated, ${entry.leftWindow.length} left the newest-40 window.`,
);
if (dryRun) {
  console.log("Dry run: no files written.");
  process.exit(0);
}
await mkdir("data/changelog", { recursive: true });
await writeFile(SNAPSHOT, JSON.stringify(snapshot, null, 2) + "\n");
const existing = (await readFile(CHANGELOG, "utf8").catch(() => "")) || "";
await writeFile(CHANGELOG, appendChangelog(existing, entry));
await recordStatus({ lastSuccess: now.toISOString().slice(0, 10), lastChange: entry.at, lastError: undefined });
console.log(`Wrote ${SNAPSHOT} and appended ${CHANGELOG}.`);
