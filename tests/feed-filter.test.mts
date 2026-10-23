import assert from "node:assert/strict";
import { test } from "node:test";
import { applyFeedFilters } from "../src/lib/feed-filter.ts";

const now = new Date("2026-10-22T12:00:00Z");
const mk = (id: string, status: string, pub: string, close?: string, title = "Rule") =>
  ({ title, document_number: id, agencies: [{ name: "Test Agency" }], status, publication_date: pub, comments_close_on: close }) as never;
const docs = [
  mk("a", "Proposed rule", "2026-10-20", "2026-11-20"),
  mk("b", "Proposed rule", "2026-09-01", "2026-10-01"),
  mk("c", "Final rule", "2026-10-21"),
];
const base = { query: "", status: "All actions", openForComment: false, sinceDays: 0 };
const ids = (f: Partial<typeof base>) => applyFeedFilters(docs, { ...base, ...f }, now).map((d: { document_number: string }) => d.document_number);

test("open-for-comment excludes passed and missing deadlines", () => assert.deepEqual(ids({ openForComment: true }), ["a"]));
test("a deadline that is today still counts as open", () => {
  const d = [mk("t", "Proposed rule", "2026-10-01", "2026-10-22")];
  assert.equal(applyFeedFilters(d, { ...base, openForComment: true }, now).length, 1);
});
test("date window limits by publication date", () => assert.deepEqual(ids({ sinceDays: 7 }), ["a", "c"]));
test("filters combine and keep status and keyword matching", () => {
  assert.deepEqual(ids({ status: "Proposed rule", sinceDays: 7 }), ["a"]);
  assert.deepEqual(ids({ query: "test agency" }), ["a", "b", "c"]);
  assert.deepEqual(ids({ query: "nomatch" }), []);
});
