import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ATLAS_BALLOT_LINKS, DEBATE_FOR_MEASURE, POLICY_AREA_IDEAS } from "../src/lib/crosslinks.ts";
import { atlasNodes } from "../src/lib/atlas.ts";
import { DEBATES } from "../src/lib/debates.ts";

const election = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));
const measureIds = new Set(election.measures.map((m: { id: string }) => m.id));
const atlasIds = new Set(atlasNodes.map((n) => n.id));

test("every cross-link points to a real Atlas idea, measure or debate map", () => {
  for (const [area, ids] of Object.entries(POLICY_AREA_IDEAS)) for (const id of ids) assert.ok(atlasIds.has(id), `${area} -> ${id}`);
  for (const [node, ms] of Object.entries(ATLAS_BALLOT_LINKS)) {
    assert.ok(atlasIds.has(node), node);
    for (const m of ms) assert.ok(measureIds.has(m), `${node} -> ${m}`);
  }
  for (const [m, d] of Object.entries(DEBATE_FOR_MEASURE)) {
    assert.ok(measureIds.has(m), m);
    const debate = DEBATES.find((x) => x.id === d);
    assert.ok(debate && debate.relatedMeasureId === m, `${m} -> ${d}`);
  }
});

test("every debate map is reachable from its measure", () => {
  for (const d of DEBATES) assert.equal(DEBATE_FOR_MEASURE[d.relatedMeasureId], d.id);
});

test("policy areas named here exist in the Congress snapshot's official vocabulary where the snapshot uses them", () => {
  const snap = JSON.parse(readFileSync("data/congress/bills.json", "utf8"));
  const used = new Set(snap.bills.map((b: { policyArea?: string }) => b.policyArea).filter(Boolean));
  const mapped = Object.keys(POLICY_AREA_IDEAS);
  assert.ok(mapped.some((a) => used.has(a)), "none of the mapped policy areas appear in the snapshot");
});
