import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseElection,
  publishedExplanation,
  deadlineState,
  daysUntil,
  electionPhase,
  isStale,
  localDate,
  measureCoverage,
  COVERAGE,
  parseGuide,
  updateGuide,
  guideExport,
  guideItemIds,
  emptyGuide,
  ElectionSchema,
} from "../src/lib/election.ts";

const raw = JSON.parse(
  readFileSync(new URL("../data/elections/colorado-2026.json", import.meta.url), "utf8"),
);
const e = parseElection(raw);
const clone = () => JSON.parse(JSON.stringify(raw));

test("the Colorado dataset validates and matches the certified ballot", () => {
  assert.equal(e.electionDate, "2026-11-03");
  assert.equal(e.certifiedOn, "2026-09-04");
  const statewide = e.measures.filter((m) => m.scope === "statewide");
  assert.equal(statewide.length, 14, "the Secretary of State certified 14 statewide measures");
  const designations = statewide.map((m) => m.designation);
  for (const d of [
    "Amendment 81", "Amendment 82", "Amendment 83", "Amendment 84", "Amendment 85",
    "Amendment 86", "Amendment 87", "Proposition NN", "Proposition 132", "Proposition 133",
    "Proposition 134", "Proposition 135", "Proposition 136", "Proposition 137",
  ])
    assert.ok(designations.includes(d), d);
});

test("every record links to official https sources that exist in the source list", () => {
  const ids = new Set(e.sources.map((s) => s.id));
  for (const item of [...e.measures, ...e.contests])
    for (const s of item.sourceIds) assert.ok(ids.has(s), `${item.id} -> ${s}`);
  for (const s of e.sources) {
    assert.ok(s.url.startsWith("https://"));
    assert.ok(/\.(gov|colorado\.gov)\//.test(s.url) || s.url.includes("leg.colorado.gov"), s.url);
  }
});

test("constitutional amendments require 55 percent and propositions a majority", () => {
  for (const m of e.measures) {
    if (m.kind === "constitutional") assert.equal(m.threshold, "55-percent", m.id);
    if (m.kind === "statutory") assert.equal(m.threshold, "majority", m.id);
  }
  const bad = clone();
  bad.measures[0].threshold = "majority";
  assert.throws(() => parseElection(bad));
});

test("plain drafts are never published; reviewed ones need a reviewer and date", () => {
  for (const m of e.measures)
    if (!["reviewed", "source-checked"].includes(m.draft.review.status)) assert.equal(publishedExplanation(m), null, m.id);
  const draft = clone();
  draft.measures[0].draft.review.status = "draft";
  assert.equal(publishedExplanation(parseElection(draft).measures[0]), null);
  const reviewedNoReviewer = clone();
  reviewedNoReviewer.measures[0].draft.review.status = "reviewed";
  assert.throws(() => parseElection(reviewedNoReviewer));
  const reviewed = clone();
  Object.assign(reviewed.measures[0].draft.review, {
    status: "reviewed",
    reviewer: "Editor",
    reviewedOn: "2026-10-23",
  });
  const m = parseElection(reviewed).measures[0];
  assert.ok(publishedExplanation(m));
  const stale = clone();
  stale.measures[0].draft.review.status = "needs-re-review";
  assert.equal(publishedExplanation(parseElection(stale).measures[0]), null);
});

test("a district-only measure is never labeled as statewide or as on your ballot", () => {
  const rail = e.measures.find((m) => m.id === "issue-7a")!;
  assert.equal(rail.scope, "district");
  assert.equal(measureCoverage(rail), COVERAGE.district);
  for (const c of Object.values(COVERAGE)) {
    assert.doesNotMatch(c.label, /your ballot/i);
    assert.doesNotMatch(c.detail, /complete/i);
  }
  const noDistrict = clone();
  delete noDistrict.measures.find((m: { id: string }) => m.id === "issue-7a").district;
  assert.throws(() => parseElection(noDistrict));
});

test("dataset does not claim district or local coverage it lacks", () => {
  assert.ok(e.contests.every((c) => c.scope === "statewide"));
  const joined = e.notCovered.join(" ");
  for (const word of ["U.S. House", "State Senate", "county", "school district"])
    assert.match(joined, new RegExp(word, "i"));
});

test("write-in candidates are flagged and retention questions carry no party", () => {
  const senate = e.contests.find((c) => c.id === "us-senate")!;
  assert.equal(senate.candidates.filter((c) => c.status === "write-in").length, 3);
  for (const c of e.contests.filter((x) => x.kind === "retention"))
    assert.ok(c.candidates.every((x) => x.affiliation === null));
  const partisanJudge = clone();
  partisanJudge.contests.find((c: { kind: string }) => c.kind === "retention").candidates[0].affiliation = "Some Party";
  assert.throws(() => parseElection(partisanJudge));
});

test("duplicate ids, duplicate candidates, unknown sources and bad dates are rejected", () => {
  const dupId = clone();
  dupId.measures[1].id = dupId.measures[0].id;
  assert.throws(() => parseElection(dupId));
  const dupCand = clone();
  dupCand.contests[0].candidates.push({ ...dupCand.contests[0].candidates[0] });
  assert.throws(() => parseElection(dupCand));
  const unknown = clone();
  unknown.measures[0].sourceIds = ["nowhere"];
  assert.throws(() => parseElection(unknown));
  const badDate = clone();
  badDate.electionDate = "2026-11-31";
  assert.throws(() => parseElection(badDate));
  const late = clone();
  late.deadlines.push({ date: "2026-11-10", label: "after", sourceId: "sos-certification" });
  assert.throws(() => parseElection(late));
  const http = clone();
  http.measures[0].officialTextUrl = "http://example.gov/x";
  assert.throws(() => ElectionSchema.parse(http));
});

test("deadlines use Mountain Time, not UTC", () => {
  // 11:30 p.m. Mountain on Oct 26 is already Oct 27 in UTC.
  const lateEvening = new Date("2026-10-27T05:30:00Z");
  assert.equal(localDate(lateEvening, "America/Denver"), "2026-10-26");
  assert.equal(deadlineState("2026-10-26", lateEvening, "America/Denver"), "today");
  assert.equal(deadlineState("2026-10-25", lateEvening, "America/Denver"), "passed");
  assert.equal(deadlineState("2026-11-03", lateEvening, "America/Denver"), "upcoming");
  assert.equal(daysUntil("2026-11-03", lateEvening, "America/Denver"), 8);
});

test("election phase counts down and switches on Election Day", () => {
  assert.deepEqual(electionPhase(e, new Date("2026-10-22T22:00:00Z")), { phase: "before", days: 12 });
  assert.equal(electionPhase(e, new Date("2026-11-03T15:00:00Z")).phase, "election-day");
  assert.equal(electionPhase(e, new Date("2026-11-04T15:00:00Z")).phase, "after");
});

test("data older than its freshness window is reported as stale", () => {
  const verified = Date.parse(e.dataVerifiedAt);
  assert.equal(isStale(e, new Date(verified + 86400000)), false);
  assert.equal(isStale(e, new Date(verified + (e.staleAfterDays + 1) * 86400000)), true);
});

test("guide stores only flags and notes for known items; export has no address or location", () => {
  const ids = guideItemIds(e);
  let g = updateGuide(emptyGuide(), "amendment-81", { read: true, note: "check fiscal" });
  g = updateGuide(g, "supreme-court-retention:William W. Hood, III", { research: true });
  const reparsed = parseGuide(JSON.stringify({ ...g, entries: { ...g.entries, "evil-id": { read: true } } }), ids);
  assert.deepEqual(Object.keys(reparsed.entries).sort(), [
    "amendment-81",
    "supreme-court-retention:William W. Hood, III",
  ]);
  const out = guideExport(reparsed, e);
  const text = JSON.stringify(out);
  for (const banned of ["address", "zip", "latitude", "longitude", "precinct", "recommend"])
    assert.ok(!text.toLowerCase().includes(banned), banned);
  assert.equal(out.items.find((i) => i.id === "amendment-81")!.note, "check fiscal");
});

test("clearing all marks removes an entry; malformed storage yields an empty guide", () => {
  let g = updateGuide(emptyGuide(), "amendment-82", { read: true });
  g = updateGuide(g, "amendment-82", { read: false });
  assert.deepEqual(g.entries, {});
  assert.deepEqual(parseGuide("{not json", guideItemIds(e)).entries, {});
  assert.deepEqual(parseGuide(JSON.stringify({ version: 2, entries: {} }), guideItemIds(e)).entries, {});
  assert.deepEqual(parseGuide(null, guideItemIds(e)).entries, {});
});

test("no measure is labeled with a suggested vote", () => {
  const text = JSON.stringify(raw).toLowerCase();
  for (const phrase of ["we recommend", "you should vote", "vote yes on", "vote no on", "endorse"])
    assert.ok(!text.includes(phrase), phrase);
});

test("source-checked content is labeled, names its checks, and never claims human review", () => {
  for (const m of e.measures) {
    const r = m.draft.review;
    if (r.status !== "source-checked") continue;
    assert.ok(r.checkedOn && r.checkedAgainst?.length, m.id);
    assert.equal(r.reviewer, undefined, m.id);
    assert.equal(r.reviewedOn, undefined, m.id);
  }
  const bad = clone();
  Object.assign(bad.measures[0].draft.review, { status: "source-checked", reviewer: "Someone", checkedOn: "2026-10-22", checkedAgainst: ["blue-book"] });
  assert.throws(() => parseElection(bad));
  const noCheck = clone();
  Object.assign(noCheck.measures[0].draft.review, { status: "source-checked", checkedOn: undefined, checkedAgainst: undefined });
  assert.throws(() => parseElection(noCheck));
});

test("every published statewide explanation has YES/NO text, both sides' arguments and fiscal notes", () => {
  for (const m of e.measures.filter((x) => x.scope === "statewide")) {
    const x = publishedExplanation(m);
    assert.ok(x, m.id);
    assert.ok(x.yes && x.no, `${m.id} needs yes/no`);
    assert.ok(x.fiscal.length > 0, `${m.id} needs fiscal notes`);
    assert.ok(x.arguments && x.arguments.for.length > 0 && x.arguments.against.length > 0, `${m.id} needs arguments on both sides`);
  }
});

test("explanations contain no voting recommendation language", () => {
  const banned = /\b(you should vote|we recommend|vote yes|vote no|vote for|vote against)\b/i;
  for (const m of e.measures) {
    const x = m.draft;
    const text = [x.summary, x.yes, x.no, ...x.fiscal, ...x.unclear, ...(x.arguments?.for ?? []), ...(x.arguments?.against ?? [])].join(" ");
    assert.ok(!banned.test(text), m.id);
  }
});

test("the verification log is dated, honest about gaps, and never claims human review", () => {
  assert.ok(e.verificationLog && e.verificationLog.length >= 5);
  for (const v of e.verificationLog ?? []) assert.ok(v.on <= "2026-12-31" && v.method && v.result);
  const text = JSON.stringify(e.verificationLog);
  assert.match(text, /not been reviewed by a human|no human editor|Machine-checked only/i);
  assert.ok(!/human[- ]reviewed and approved|editorially approved/i.test(text));
  assert.ok(e.verificationLog?.some((v) => /Judicial/.test(v.scope) && /Not verified/.test(v.result)));
});

test("every statewide measure cites the fiscal impact statements it was checked against", () => {
  for (const m of e.measures.filter((x) => x.scope === "statewide")) {
    assert.ok(m.sourceIds.includes("fiscal-statements"), m.id);
    assert.ok(m.draft.review.checkedAgainst?.includes("fiscal-statements"), m.id);
  }
});

test("the judicial guide attributes press-reported facts and never states an individual judge's recommendation", async () => {
  const { readFileSync } = await import("node:fs");
  const ui = readFileSync("src/components/help-me-vote.tsx", "utf8");
  assert.match(ui, /not verified against the official site/);
  assert.match(ui, /coloradopolitics\.com\/2026\/10\/16/);
  assert.ok(!/(Hood|Freyre|Harris|Lum|Moultrie|Schock|Sullivan)[^.<]{0,40}(meets performance standards|recommended for retention)/i.test(ui));
});

test("Amendment 87 is recorded as passing by majority, as the Blue Book states, and the correction is logged", async () => {
  const { readFileSync } = await import("node:fs");
  const m = e.measures.find((x) => x.id === "amendment-87")!;
  assert.equal(m.kind, "constitutional-and-statutory");
  assert.equal(m.threshold, "majority");
  const log = JSON.parse(readFileSync("data/corrections.json", "utf8"));
  assert.ok(log.some((c: { page: string; type: string }) => c.page.endsWith("amendment-87") && c.type === "incorrect"));
});

test("every explanation says who is affected, and quoted dollar examples come from the official documents", async () => {
  for (const m of e.measures) assert.ok((publishedExplanation(m)?.affects?.length ?? 0) > 0, m.id);
  const one = (id: string) => (e.measures.find((x) => x.id === id)!.draft.affects ?? []).join(" ");
  for (const t of ["$325", "$5,175", "$5,500", "$510,834"]) assert.ok(one("amendment-87").includes(t), t);
  for (const t of ["$21", "$39", "$28", "$68"]) assert.ok(one("proposition-nn").includes(t), t);
  assert.ok(!/you will|you must vote|your taxes will (rise|fall) by/i.test(JSON.stringify(e.measures.map((m) => m.draft.affects))));
});
