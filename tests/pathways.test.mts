import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PATHWAYS } from "../src/lib/pathways.ts";
import { atlasNodes } from "../src/lib/atlas.ts";
import { DEBATES } from "../src/lib/debates.ts";

const election = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));
const SECTIONS = new Set(["vote", "congress", "debate", "values", "atlas", "legislation", "chain", "policy", "paths"]);

test("every pathway step links to a route that exists", () => {
  for (const p of PATHWAYS)
    for (const s of p.steps) {
      const [path, query] = s.href.split("?");
      const parts = path.split("/").filter(Boolean);
      assert.ok(SECTIONS.has(parts[0]), `${p.id}: unknown section ${s.href}`);
      if (parts[0] === "vote" && parts[2] === "measure") assert.ok(election.measures.some((m: { id: string }) => m.id === parts[3]), s.href);
      if (parts[0] === "debate" && parts[1] === "maps" && parts[2]) assert.ok(DEBATES.some((d) => d.id === parts[2]), s.href);
      if (parts[0] === "atlas" && query) assert.ok(atlasNodes.some((n) => n.id === new URLSearchParams(query).get("node")), s.href);
    }
});

test("each pathway crosses at least three areas and every step explains why it is there", () => {
  for (const p of PATHWAYS) {
    assert.ok(new Set(p.steps.map((s) => s.href.split("/")[1].split("?")[0])).size >= 3, p.id);
    for (const s of p.steps) assert.ok(s.why.length > 20 && s.label.length > 5);
  }
});
