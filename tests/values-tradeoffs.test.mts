import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { TENSIONS } from "../src/lib/values-tradeoffs.ts";

const election = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));

test("every tension names two values and links only to real measures", () => {
  for (const t of TENSIONS) {
    assert.equal(t.values.length, 2);
    assert.ok(t.measures.length >= 1, t.id);
    for (const m of t.measures) assert.ok(election.measures.some((x: { id: string }) => x.id === m.id), `${t.id}: ${m.id}`);
  }
});

test("no tension maps values to parties, ideologies or identities, or predicts how someone will vote", () => {
  const banned = /\b(democrat|republican|liberal|conservative|progressive|left-wing|right-wing|party|gop|maga|woke|you will vote|people like you)\b/i;
  assert.ok(!banned.test(JSON.stringify(TENSIONS)));
});

test("every statewide measure with arguments appears under at least one tension", () => {
  const covered = new Set(TENSIONS.flatMap((t) => t.measures.map((m) => m.id)));
  for (const m of election.measures)
    if (m.scope === "statewide") assert.ok(covered.has(m.id), `${m.id} is not connected to any values tension`);
});

test("each measure line names both sides of the disagreement", () => {
  for (const t of TENSIONS)
    for (const m of t.measures) {
      assert.match(m.how, /Supporters/);
      assert.match(m.how, /opponents|Opponents/);
    }
});
