import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { DecisionFileSchema, applyDecisions, buildQueue, type Decision } from "../src/lib/review.ts";
import { parseElection, publishedExplanation } from "../src/lib/election.ts";
import { validateProfiles } from "../src/lib/candidate.ts";
import { DEBATES } from "../src/lib/debates.ts";

const election = parseElection(JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8")));
const profiles = validateProfiles(JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8")), election.contests);
const log = JSON.parse(readFileSync("data/review/decisions.json", "utf8")) as Decision[];
const queue = buildQueue({ election, profiles, debates: DEBATES, atlasCount: 86, log, builtOn: "2026-10-22" });
const ids = queue.map((q) => q.id);
const d = (over: Partial<Decision>): Decision => ({ itemId: "measure:amendment-81", decision: "approve", reviewer: "Test Reviewer", on: "2026-10-23", ...over });

test("the queue lists every measure, profile and debate with sources, a date and outstanding questions", () => {
  assert.equal(queue.filter((q) => q.kind === "measure").length, election.measures.length);
  assert.equal(queue.filter((q) => q.kind === "profile").length, profiles.length);
  assert.equal(queue.filter((q) => q.kind === "debate").length, DEBATES.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const q of queue) assert.ok(q.outstanding.length > 0, `${q.id} lists no outstanding questions`);
  for (const q of queue.filter((x) => ["measure", "profile", "debate"].includes(x.kind))) {
    assert.ok(q.sources.length > 0, q.id);
    assert.ok(q.verifiedOn, q.id);
  }
});

test("nothing in the shipped data is human-reviewed, and the shipped decision log is empty", () => {
  assert.deepEqual(log, []);
  assert.ok(queue.every((q) => q.state !== "human-reviewed"));
});

test("decisions need a named reviewer and a note unless approving", () => {
  assert.ok(DecisionFileSchema.safeParse([d({})]).success);
  assert.ok(!DecisionFileSchema.safeParse([d({ reviewer: " " })]).success);
  assert.ok(!DecisionFileSchema.safeParse([d({ decision: "reject" })]).success);
  assert.ok(!DecisionFileSchema.safeParse([d({ decision: "request-changes", note: "" })]).success);
  assert.ok(DecisionFileSchema.safeParse([d({ decision: "reject", note: "Figure is wrong" })]).success);
  assert.ok(!DecisionFileSchema.safeParse([]).success);
});

test("approving a measure records the human reviewer and keeps it published; nothing else changes", () => {
  const r = applyDecisions(election, log, [d({})], ids);
  assert.deepEqual(r.errors, []);
  const m = r.election.measures.find((x) => x.id === "amendment-81")!;
  assert.equal(m.draft.review.status, "reviewed");
  assert.equal(m.draft.review.reviewer, "Test Reviewer");
  assert.ok(publishedExplanation(m));
  for (const other of r.election.measures.filter((x) => x.id !== "amendment-81")) assert.equal(other.draft.review.status, "source-checked");
  assert.equal(r.log.length, 1);
  assert.equal(election.measures[0].draft.review.status, "source-checked", "the input is not mutated");
});

test("rejecting hides the explanation and records why; requesting changes keeps it but records the note", () => {
  const rej = applyDecisions(election, log, [d({ decision: "reject", note: "Wrong threshold" })], ids);
  const m = rej.election.measures[0];
  assert.equal(m.draft.review.status, "needs-re-review");
  assert.equal(publishedExplanation(m), null);
  assert.match(m.draft.review.checkNotes!.at(-1)!, /Rejected by Test Reviewer.*Wrong threshold/);
  const chg = applyDecisions(election, log, [d({ decision: "request-changes", note: "Clarify fiscal note" })], ids);
  assert.equal(chg.election.measures[0].draft.review.status, "source-checked");
  assert.match(chg.election.measures[0].draft.review.checkNotes!.at(-1)!, /Changes requested by Test Reviewer/);
});

test("unknown items are refused, and decisions for non-measure items are logged without changing data", () => {
  assert.match(applyDecisions(election, log, [d({ itemId: "measure:nope" })], ids).errors[0], /unknown item/);
  const r = applyDecisions(election, log, [d({ itemId: "debate:mail-ballot-id" })], ids);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.election, election);
  const q2 = buildQueue({ election, profiles, debates: DEBATES, atlasCount: 86, log: r.log, builtOn: "x" });
  assert.equal(q2.find((q) => q.id === "debate:mail-ballot-id")!.state, "human-reviewed");
});

test("no source file other than the apply script writes review decisions or marks content reviewed", () => {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  const files = [...walk("src"), ...walk("scripts")].filter((f) => /\.(ts|tsx|mts|mjs)$/.test(f));
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    if (f.endsWith("scripts/apply-review.mts") || f.endsWith("src/lib/review.ts")) continue;
    assert.ok(!/status\s*=\s*["']reviewed["']/.test(text), `${f} sets status reviewed`);
    assert.ok(!/review\/decisions\.json/.test(text) || f.includes("review"), `${f} touches the decision log`);
  }
});
