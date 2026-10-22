import { createHash } from "node:crypto";
import { DocumentSchema, FR_FIELDS } from "./domain.ts";

/*
 * Pure functions for the Federal Register refresh pipeline:
 *   fetch -> validate -> normalize -> dedupe -> diff -> changelog -> write (only if changed)
 * IO lives in scripts/refresh-federal-register.mts. Not imported by the browser app.
 */

export type RawRecord = Record<string, unknown>;
export type Snapshot = {
  description?: string;
  source: string;
  retrievedAt: string;
  contentHash: string;
  results: RawRecord[];
};
export type ChangelogEntry = {
  at: string;
  source: "federal-register";
  contentHash: string;
  previousHash: string | null;
  added: string[];
  changed: { id: string; fields: string[] }[];
  leftWindow: string[];
  rejected: { id: string | null; reason: string }[];
};

/** Keep only the fields we use, with a stable key order, so hashes don't change with key order or extra fields. */
export function pickFields(r: RawRecord): RawRecord {
  const out: RawRecord = {};
  for (const f of [...FR_FIELDS].sort()) if (r[f] !== undefined) out[f] = r[f];
  return out;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value as object)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stable((value as Record<string, unknown>)[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}

export const hashOf = (v: unknown) => createHash("sha256").update(stable(v)).digest("hex");

/** Validate and dedupe raw API results. Invalid or off-origin records are rejected, never silently fixed. */
export function validateBatch(results: unknown[]) {
  const records: RawRecord[] = [];
  const rejected: ChangelogEntry["rejected"] = [];
  const seen = new Set<string>();
  for (const r of results) {
    const id =
      r && typeof r === "object" && typeof (r as RawRecord).document_number === "string"
        ? ((r as RawRecord).document_number as string)
        : null;
    const parsed = DocumentSchema.safeParse(r);
    if (!parsed.success) {
      rejected.push({ id, reason: parsed.error.issues[0]?.path.join(".") + ": " + parsed.error.issues[0]?.message });
      continue;
    }
    if (new URL(parsed.data.html_url).hostname !== "www.federalregister.gov") {
      rejected.push({ id, reason: "unexpected source origin" });
      continue;
    }
    if (seen.has(parsed.data.document_number)) continue;
    seen.add(parsed.data.document_number);
    records.push(pickFields(r as RawRecord));
  }
  return { records, rejected };
}

export function diffRecords(prev: RawRecord[], next: RawRecord[]) {
  const byId = (rs: RawRecord[]) => new Map(rs.map((r) => [r.document_number as string, r]));
  const p = byId(prev);
  const n = byId(next);
  const added: string[] = [];
  const changed: { id: string; fields: string[] }[] = [];
  for (const [id, rec] of n) {
    const old = p.get(id);
    if (!old) {
      added.push(id);
      continue;
    }
    const fields = [...new Set([...Object.keys(old), ...Object.keys(rec)])]
      .filter((k) => stable(old[k]) !== stable(rec[k]))
      .sort();
    if (fields.length) changed.push({ id, fields });
  }
  // The snapshot is a window of the newest documents; records leaving it were not deleted at the source.
  const leftWindow = [...p.keys()].filter((id) => !n.has(id));
  return { added, changed, leftWindow };
}

/**
 * Decide what to write. If official content is unchanged, nothing is written (idempotent):
 * re-running the refresh never creates a new commit on its own.
 */
export function planRefresh(prev: Snapshot | null, fetched: unknown[], now: Date) {
  const { records, rejected } = validateBatch(fetched);
  if (records.length === 0)
    return { ok: false as const, reason: "No valid records in the response", rejected };
  const contentHash = hashOf(records);
  const previousHash = prev ? prev.contentHash || hashOf(prev.results.map(pickFields)) : null;
  if (previousHash === contentHash)
    return { ok: true as const, changed: false as const, contentHash, rejected };
  const diff = diffRecords(prev ? prev.results.map(pickFields) : [], records);
  const at = now.toISOString();
  const snapshot: Snapshot = {
    description: "Newest Federal Register documents (dated official-source snapshot)",
    source: "https://www.federalregister.gov/api/v1/documents.json",
    retrievedAt: at,
    contentHash,
    results: records,
  };
  const entry: ChangelogEntry = { at, source: "federal-register", contentHash, previousHash, ...diff, rejected };
  return { ok: true as const, changed: true as const, contentHash, snapshot, entry, rejected };
}

/** Keep the changelog bounded: newest entries last, at most `max` lines. */
export function appendChangelog(existing: string, entry: ChangelogEntry, max = 200) {
  const lines = existing.split("\n").filter(Boolean);
  lines.push(JSON.stringify(entry));
  return lines.slice(-max).join("\n") + "\n";
}

/** Bounded retry policy with exponential backoff; honors Retry-After (seconds) up to a cap. */
export function retryDelayMs(attempt: number, retryAfter: string | null, capMs = 30000) {
  const header = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : null;
  return Math.min(header ?? 1000 * 2 ** attempt, capMs);
}
