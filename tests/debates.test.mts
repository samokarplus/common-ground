import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEBATES, DebateSchema } from "../src/lib/debates.ts";

const election = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));

test("every debate validates and links to a real measure", () => {
  for (const d of DEBATES) {
    DebateSchema.parse(d);
    assert.ok(election.measures.some((m: { id: string }) => m.id === d.relatedMeasureId), d.id);
  }
  assert.equal(new Set(DEBATES.map((d) => d.id)).size, DEBATES.length);
});

test("both sides get equal structure: same number of argument types and no side lacks a value claim", () => {
  for (const d of DEBATES) {
    const [a, b] = d.sides;
    assert.ok(a.arguments.some((x) => x.type === "value"), `${d.id}: side A has no value claim`);
    assert.ok(b.arguments.some((x) => x.type === "value"), `${d.id}: side B has no value claim`);
    assert.ok(Math.abs(a.arguments.length - b.arguments.length) <= 1, `${d.id}: sides are lopsided`);
  }
});

test("every argument says what evidence would inform it, and facts cite the official source", () => {
  for (const d of DEBATES) {
    for (const f of d.facts) assert.match(f.sourceUrl, /^https:\/\/content\.leg\.colorado\.gov\//);
    for (const s of d.sides) for (const x of s.arguments) assert.ok(x.evidenceNote.length > 20, d.id);
  }
});

test("debates carry no recommendation or loaded language", () => {
  const banned = /\b(you should vote|we recommend|obviously|clearly wrong|only a fool|radical|extremist)\b/i;
  const text = JSON.stringify(DEBATES);
  assert.ok(!banned.test(text));
});

test("figures quoted in facts appear in the matching source-checked measure explanation or its arguments", () => {
  const nums: Record<string, string[]> = {
    "amendment-84": ["$2.7 million", "$1.2 million"],
    "amendment-87": ["$958.4 million", "$1.972 billion", "$2.7 billion"],
    "proposition-nn": ["$329.9 million", "$521.0 million", "$4.6 billion"],
  };
  for (const d of DEBATES) {
    const m = election.measures.find((x: { id: string }) => x.id === d.relatedMeasureId);
    const hay = JSON.stringify(m.draft);
    for (const n of nums[d.relatedMeasureId] ?? []) {
      assert.ok(JSON.stringify(d).includes(n), `${d.id} lacks ${n}`);
      assert.ok(hay.includes(n), `${d.relatedMeasureId} draft lacks ${n}`);
    }
  }
});
