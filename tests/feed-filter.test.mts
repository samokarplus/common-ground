import assert from "node:assert/strict";
import { test } from "node:test";
import { agencyOptions, applyFeedFilters } from "../src/lib/feed-filter.ts";

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

test("agency filter matches exact agency names and options are most-frequent first", () => {
  const d = [
    { title: "a", document_number: "1", agencies: [{ name: "Agency B" }], status: "Final rule", publication_date: "2026-10-20" },
    { title: "b", document_number: "2", agencies: [{ name: "Agency A" }, { name: "Agency B" }], status: "Final rule", publication_date: "2026-10-20" },
    { title: "c", document_number: "3", agencies: [{ name: "Agency A" }], status: "Final rule", publication_date: "2026-10-20" },
  ] as never[];
  assert.deepEqual(agencyOptions(d), ["Agency A", "Agency B"]);
  const f = { query: "", status: "All actions", openForComment: false, sinceDays: 0 };
  assert.equal(applyFeedFilters(d, { ...f, agency: "Agency B" }, now).length, 2);
  assert.equal(applyFeedFilters(d, { ...f, agency: "Agency C" }, now).length, 0);
  assert.equal(applyFeedFilters(d, { ...f, agency: "" }, now).length, 3);
});
