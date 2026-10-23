import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseComparison, ADVICE_WORDS } from "../src/lib/compare.ts";
import { ISSUES } from "../src/lib/issues.ts";

const raw = JSON.parse(readFileSync("data/compare/texas-senate-2026.json", "utf8"));
const c = parseComparison(raw);

test("the Texas comparison covers all nine issues exactly once", () => {
  assert.deepEqual(c.issues.map((i) => i.issue).sort(), ISSUES.map((i) => i.id).sort());
});
test("every entry has an https source and a retrieval date, and nothing is human-reviewed", () => {
  for (const b of c.issues) for (const list of Object.values(b.positions)) for (const e of list) { assert.ok(e.sourceUrl.startsWith("https://")); assert.ok(e.retrievedOn); }
  assert.equal(c.review.status, "machine-checked");
});
test("a campaign statement is never typed as a documented action", () => {
  for (const b of c.issues) for (const list of Object.values(b.positions)) for (const e of list) if (/jamestalarico\.com|kenpaxton\.com/.test(e.sourceUrl)) assert.equal(e.kind, "own-statement", e.text.slice(0, 60));
});
test("documented actions come from an official or news record, not a campaign site", () => {
  for (const b of c.issues) for (const list of Object.values(b.positions)) for (const e of list) if (e.kind === "documented-action") assert.ok(!/jamestalarico\.com|kenpaxton\.com/.test(e.sourceUrl));
});
test("no advice, ranking or loaded language in editorial text", () => {
  const editorial = [c.summary, ...c.limitations, ...c.issues.map((i) => i.relationNote)];
  for (const t of editorial) assert.ok(!ADVICE_WORDS.test(t), t);
});
test("entries copied from agency pages that could not be opened say so", () => {
  for (const b of c.issues) for (const list of Object.values(b.positions)) for (const e of list) if (e.sourceUrl.includes("texasattorneygeneral.gov/news/releases/")) assert.match(e.note ?? "", /could not be opened/);
});
test("relation labels must match the entries", () => {
  const bad = structuredClone(raw);
  bad.issues.find((i: { issue: string }) => i.issue === "public-lands").relation = "differ";
  assert.throws(() => parseComparison(bad));
  const bad2 = structuredClone(raw);
  bad2.issues.find((i: { issue: string }) => i.issue === "immigration").positions.paxton = [];
  assert.throws(() => parseComparison(bad2));
});
test("human-reviewed requires a named reviewer", () => {
  const bad = structuredClone(raw);
  bad.review = { status: "human-reviewed" };
  assert.throws(() => parseComparison(bad));
});
test("undated pages say nothing about the date they were written", () => {
  assert.ok(c.limitations.some((l) => /no dates/.test(l)));
});
