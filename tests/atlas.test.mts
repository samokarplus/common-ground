import assert from "node:assert/strict";
import { test } from "node:test";
import { atlasEdges, atlasNodes } from "../src/lib/atlas.ts";

test("node ids are unique and descriptions are present", () => {
  const ids = atlasNodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of atlasNodes) {
    assert.ok(n.name && n.description.length > 20, n.id);
    assert.match(n.source, /^https:\/\/plato\.stanford\.edu\/entries\/[\w-]+\/$/, n.id);
  }
});

test("atlas has grown beyond 75 nodes", () => {
  assert.ok(atlasNodes.length >= 75, String(atlasNodes.length));
});

test("every edge joins existing, distinct nodes, with no duplicates", () => {
  const ids = new Set(atlasNodes.map((n) => n.id));
  const seen = new Set<string>();
  for (const [a, b] of atlasEdges) {
    assert.ok(ids.has(a) && ids.has(b), `${a} - ${b}`);
    assert.notEqual(a, b);
    const key = [a, b].sort().join("|");
    assert.ok(!seen.has(key), `duplicate edge ${key}`);
    seen.add(key);
  }
});

test("no node is isolated", () => {
  const linked = new Set(atlasEdges.flat());
  for (const n of atlasNodes) assert.ok(linked.has(n.id), `isolated: ${n.id}`);
});

test("conceptual entries carry contested views", () => {
  for (const n of atlasNodes) {
    if (["Tradition", "Institution", "Ethics"].includes(n.period)) assert.ok(n.contested, `${n.id} lacks competing interpretations`);
  }
});

test("historical context and readings are attached to real nodes, with dated works", () => {
  const withContext = atlasNodes.filter((n) => n.context);
  assert.ok(withContext.length >= 25, `only ${withContext.length} nodes have context`);
  const withReading = atlasNodes.filter((n) => n.reading?.length);
  assert.ok(withReading.length >= 40, `only ${withReading.length} nodes have readings`);
  for (const n of withReading) for (const r of n.reading ?? []) assert.match(r, /\((?:c\. )?[\d\-, ]+(?:th century(?: BCE)?)?\)|\((?:4th century BCE)\)/, `${n.id}: reading lacks a date: ${r}`);
});
