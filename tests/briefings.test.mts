import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BriefingSchema, axisRange, describeChart, formatValue, type Briefing, type Chart } from "../src/lib/briefing.ts";
import { buildAbortionBriefing, buildMoneyBriefing, buildUkraineBriefing, type AbortionData, type TreasuryData, type UkraineData } from "../src/lib/briefings.ts";

const read = <T,>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
const treasury = read<TreasuryData>("data/fiscal/treasury.json");
const ukraine = read<UkraineData>("data/fiscal/ukraine-appropriations.json");
const abortion = read<AbortionData>("data/stats/abortion-cdc.json");
const briefings = [buildMoneyBriefing(treasury), buildUkraineBriefing(ukraine), buildAbortionBriefing(abortion)];
const charts = (b: Briefing) => b.evidence.flatMap((e) => (e.type === "chart" ? [e.chart] : []));

test("all three flagship briefings validate against the schema", () => {
  for (const b of briefings) BriefingSchema.parse(b);
  assert.deepEqual(briefings.map((b) => b.id), ["federal-spending", "ukraine-assistance", "abortion-statistics"]);
});

test("nothing is marked human-reviewed, and the limitations and sources are present", () => {
  for (const b of briefings) {
    assert.equal(b.review.status, "machine-checked", b.id);
    assert.ok(b.limitations.length >= 3, b.id);
    for (const s of b.sources) assert.match(s.url, /^https:\/\//);
  }
});

test("a human-reviewed briefing must name a reviewer and date, and facts must cite sources", () => {
  const base = structuredClone(briefings[0]);
  assert.throws(() => BriefingSchema.parse({ ...base, review: { status: "human-reviewed" } }));
  const noSource = structuredClone(base);
  noSource.shortAnswer[0].sourceIds = [];
  assert.throws(() => BriefingSchema.parse(noSource));
  const badRef = structuredClone(base);
  badRef.shortAnswer[0].sourceIds = ["missing"];
  assert.throws(() => BriefingSchema.parse(badRef));
});

test("charts: bars start at zero, lines say so if they do not, missing values are null never zero", () => {
  for (const b of briefings)
    for (const c of charts(b)) {
      const r = axisRange(c);
      if (c.kind === "bar") assert.ok(r.min <= 0 && !r.truncated, c.id);
      assert.ok(c.definition.length > 20 && c.sourceIds.length > 0 && c.dateRange, c.id);
      for (const s of c.series) for (const p of s.points) assert.ok(p.y === null || Number.isFinite(p.y), `${c.id}: bad value`);
    }
  const bad = structuredClone(charts(briefings[0])[1]) as Chart;
  bad.baseline = "auto";
  assert.throws(() => BriefingSchema.parse({ ...briefings[0], evidence: [{ type: "chart", chart: bad }] }));
  const line = structuredClone(charts(briefings[2])[0]) as Chart;
  line.baseline = "auto";
  assert.equal(axisRange(line).truncated, true);
});

test("a chart describes itself for assistive technology from its own data", () => {
  const c = charts(briefings[2])[0];
  const d = describeChart(c);
  assert.match(d, /Line chart/);
  assert.match(d, new RegExp(abortion.series[0].abortions.toLocaleString("en-US").replace(/,/g, ",")));
});

test("fiscal figures: text and charts agree with the Treasury data", () => {
  const last = treasury.fiscalYears.at(-1)!;
  const b = briefings[0];
  const dChart = charts(b).find((c) => c.id === "deficit")!;
  assert.equal(dChart.series[0].points.at(-1)!.y, last.outlays - last.receipts);
  assert.match(b.shortAnswer[0].text, new RegExp(formatValue(last.receipts, "usd-trillions").replace(/[$.]/g, "\\$&")));
  for (const y of treasury.fiscalYears) assert.ok(y.receipts > 1e12 && y.outlays > 1e12 && y.outlays > y.defense, `FY${y.fy}`);
  // fiscal years are consecutive, and debt rises at each fiscal year-end
  treasury.fiscalYears.forEach((y, i) => i && assert.equal(y.fy, treasury.fiscalYears[i - 1].fy + 1));
  treasury.debtAtFiscalYearEnd.forEach((d, i) => i && assert.ok(d.total > treasury.debtAtFiscalYearEnd[i - 1].total, `debt FY${d.fy}`));
  for (const d of treasury.debtAtFiscalYearEnd) assert.ok(Math.abs(d.total - d.heldByPublic - d.intragovernmental) < 1e6, `FY${d.fy} debt components`);
});

test("debt milestones are ordered and each is at or above its threshold", () => {
  treasury.debtMilestones.forEach((m, i) => {
    assert.ok(m.total >= m.trillions * 1e12 && m.total < (m.trillions + 0.5) * 1e12, String(m.trillions));
    if (i) assert.ok(m.firstDate > treasury.debtMilestones[i - 1].firstDate);
  });
});

test("Ukraine appropriations: acts sum to the CRS total within rounding and stay labeled as appropriations", () => {
  const sum = ukraine.acts.reduce((a, b) => a + b.billions, 0);
  assert.ok(Math.abs(sum - ukraine.statedTotal.billions) <= 0.25, `${sum} vs ${ukraine.statedTotal.billions}`);
  assert.match(ukraine.measureType, /NOT obligations/);
  const text = JSON.stringify(briefings[1]);
  assert.match(text, /not money delivered to Ukraine/);
  assert.ok(!/spent \$\d/.test(text), "must not state a spending total");
  assert.ok(ukraine.acts.every((a) => a.citation.startsWith("P.L. ") && a.billions > 0));
});

test("abortion data matches the report's own stated changes, and states what the series is not", () => {
  const s = abortion.series;
  const p = (a: number, b: number) => Math.round(((b - a) / a) * 100);
  const f = s[0];
  const l = s[s.length - 1];
  const v = s[s.length - 2];
  assert.deepEqual([p(f.abortions, l.abortions), p(f.ratePer1000Women15to44, l.ratePer1000Women15to44), p(f.ratioPer1000LiveBirths, l.ratioPer1000LiveBirths)], [-5, -10, 1]);
  assert.deepEqual([p(v.abortions, l.abortions), p(v.ratePer1000Women15to44, l.ratePer1000Women15to44), p(v.ratioPer1000LiveBirths, l.ratioPer1000LiveBirths)], [-2, -3, -2]);
  s.forEach((r, i) => i && assert.equal(r.year, s[i - 1].year + 1));
  assert.equal(abortion.areas, 47);
  const text = JSON.stringify(briefings[2]);
  assert.match(text, /not a national total/);
  assert.match(text, /Missing reporting is not zero/);
});

test("fact-typed claims avoid causal language the data cannot support", () => {
  const causal = /\b(caused|because of|due to|as a result of|thanks to|blame|responsible for the (rise|fall|increase|decrease))\b/i;
  for (const b of briefings) {
    const claims = [...b.shortAnswer, ...b.context, ...b.disagreements.factual, ...b.evidence.flatMap((e) => (e.type === "text" ? e.claims : []))];
    for (const c of claims.filter((x) => x.kind === "fact" || x.kind === "estimate")) assert.ok(!causal.test(c.text), `${b.id}: ${c.text}`);
  }
});

test("every briefing separates factual disagreements from value judgments", () => {
  for (const b of briefings) {
    assert.ok(b.disagreements.values.length >= 1, b.id);
    for (const c of b.disagreements.values) assert.ok(["opinion", "interpretation"].includes(c.kind), b.id);
  }
});
