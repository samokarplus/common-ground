import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  appendChangelog,
  diffRecords,
  hashOf,
  pickFields,
  planRefresh,
  retryDelayMs,
  validateBatch,
  type Snapshot,
} from "../src/lib/pipeline.ts";
import { SOURCE_REGISTRY } from "../src/lib/source-registry.ts";

const fixture = (n: string, extra: Record<string, unknown> = {}) => ({
  document_number: `2026-0000${n}`,
  title: `Fixture document ${n}`,
  type: "Proposed Rule",
  abstract: "An abstract.",
  html_url: `https://www.federalregister.gov/documents/2026/10/22/2026-0000${n}/fixture`,
  pdf_url: null,
  publication_date: "2026-10-22",
  agencies: [{ name: "Example Agency" }],
  comments_close_on: "2026-12-07",
  ...extra,
});
const T1 = new Date("2026-10-22T12:00:00Z");
const T2 = new Date("2026-10-23T12:00:00Z");

test("first refresh writes a snapshot and a changelog entry listing new records", () => {
  const plan = planRefresh(null, [fixture("1"), fixture("2")], T1);
  assert.ok(plan.ok && plan.changed);
  assert.deepEqual(plan.entry.added, ["2026-00001", "2026-00002"]);
  assert.equal(plan.snapshot.results.length, 2);
  assert.equal(plan.snapshot.retrievedAt, T1.toISOString());
});

test("repeating a refresh with the same official content writes nothing (idempotent)", () => {
  const first = planRefresh(null, [fixture("1"), fixture("2")], T1);
  assert.ok(first.ok && first.changed);
  const second = planRefresh(first.snapshot, [fixture("1"), fixture("2")], T2);
  assert.ok(second.ok);
  assert.equal(second.changed, false);
});

test("key order and extra unused fields do not count as changes", () => {
  const first = planRefresh(null, [fixture("1")], T1);
  assert.ok(first.ok && first.changed);
  const reordered = Object.fromEntries(Object.entries(fixture("1", { excerpts: "x", score: 9 })).reverse());
  const again = planRefresh(first.snapshot, [reordered], T2);
  assert.ok(again.ok);
  assert.equal(again.changed, false);
});

test("a changed official field is detected and named; old records leaving the window are not deletions", () => {
  const first = planRefresh(null, [fixture("1"), fixture("2")], T1);
  assert.ok(first.ok && first.changed);
  const next = planRefresh(first.snapshot, [fixture("1", { comments_close_on: "2026-12-21" }), fixture("3")], T2);
  assert.ok(next.ok && next.changed);
  assert.deepEqual(next.entry.added, ["2026-00003"]);
  assert.deepEqual(next.entry.changed, [{ id: "2026-00001", fields: ["comments_close_on"] }]);
  assert.deepEqual(next.entry.leftWindow, ["2026-00002"]);
  assert.equal(next.entry.previousHash, first.contentHash);
});

test("malformed, off-origin, and duplicate records are rejected or removed, never silently fixed", () => {
  const { records, rejected } = validateBatch([
    fixture("1"),
    fixture("1"),
    fixture("2", { publication_date: "2026-02-30" }),
    fixture("3", { html_url: "https://evil.example/doc" }),
    fixture("4", { type: "Blog Post" }),
    "not an object",
  ]);
  assert.deepEqual(records.map((r) => r.document_number), ["2026-00001"]);
  assert.equal(rejected.length, 4);
  assert.ok(rejected.some((r) => r.reason === "unexpected source origin"));
});

test("an empty or all-invalid response never replaces the snapshot", () => {
  const plan = planRefresh(null, [], T1);
  assert.equal(plan.ok, false);
  const bad = planRefresh(null, [{ nonsense: true }], T1);
  assert.equal(bad.ok, false);
});

test("the bundled snapshot is valid input to the pipeline", () => {
  const snap = JSON.parse(readFileSync(new URL("../data/federal-register.json", import.meta.url), "utf8")) as Snapshot;
  const { records, rejected } = validateBatch(snap.results);
  assert.equal(rejected.length, 0);
  assert.equal(records.length, snap.results.length);
  const replay = planRefresh({ ...snap, contentHash: hashOf(snap.results.map(pickFields)) }, snap.results, T2);
  assert.ok(replay.ok);
  assert.equal(replay.changed, false);
});

test("changelog stays bounded and keeps the newest entries", () => {
  let log = "";
  for (let i = 0; i < 5; i++)
    log = appendChangelog(
      log,
      { at: String(i), source: "federal-register", contentHash: String(i), previousHash: null, added: [], changed: [], leftWindow: [], rejected: [] },
      3,
    );
  const lines = log.trim().split("\n").map((l) => JSON.parse(l).at);
  assert.deepEqual(lines, ["2", "3", "4"]);
});

test("retry delays back off exponentially, honor Retry-After, and are capped", () => {
  assert.equal(retryDelayMs(0, null), 1000);
  assert.equal(retryDelayMs(2, null), 4000);
  assert.equal(retryDelayMs(0, "5"), 5000);
  assert.equal(retryDelayMs(10, null), 30000);
  assert.equal(retryDelayMs(0, "999"), 30000);
});

test("diff reports nothing for identical inputs", () => {
  const rs = [pickFields(fixture("1"))];
  assert.deepEqual(diffRecords(rs, rs), { added: [], changed: [], leftWindow: [] });
});

test("source registry entries are complete, unique, and https", () => {
  const ids = SOURCE_REGISTRY.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SOURCE_REGISTRY) {
    assert.ok(s.url.startsWith("https://"), s.id);
    for (const k of ["name", "publisher", "access", "terms", "knownGaps"] as const) assert.ok(s[k].length > 3, `${s.id}.${k}`);
  }
  assert.ok(SOURCE_REGISTRY.find((s) => s.id === "congress-gov")!.access.includes("never be shipped"));
});
