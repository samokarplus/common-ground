import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LocalDatasetSchema, itemsFor } from "../src/lib/local-elections.ts";

const real = LocalDatasetSchema.parse(JSON.parse(readFileSync("data/elections/local/colorado-2026-local.json", "utf8")));
const election = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));

// A clearly fictional dataset to exercise the structure. It is never shipped or shown to users.
const fixture = () => ({
  state: "ZZ",
  electionDate: "2026-11-03",
  jurisdictions: [
    { id: "example-county", name: "Example County (fictional)", level: "county", state: "ZZ", coverage: "listed" },
    { id: "example-town", name: "Town of Example (fictional)", level: "municipality", state: "ZZ", parentId: "example-county", coverage: "verified-items" },
  ],
  items: [{ id: "town-q1", jurisdictionId: "example-town", kind: "measure", title: "Fictional question", officialUrl: "https://example.org/q1", sourceTitle: "Fictional notice", retrievedOn: "2026-10-22" }],
});

test("the real local dataset validates and links to a real statewide record", () => {
  assert.equal(real.state, "CO");
  for (const i of real.items) if (i.measureId) assert.ok(election.measures.some((m: { id: string }) => m.id === i.measureId), i.id);
  assert.ok(real.jurisdictions.every((j) => j.coverage === "listed" || real.items.some((i) => i.jurisdictionId === j.id)));
});

test("structure rejects duplicates, unknown parents and jurisdictions, state mismatches and empty 'verified' claims", () => {
  assert.ok(LocalDatasetSchema.safeParse(fixture()).success);
  const dup = fixture();
  dup.jurisdictions.push(dup.jurisdictions[0]);
  assert.ok(!LocalDatasetSchema.safeParse(dup).success);
  const parent = fixture();
  parent.jurisdictions[1].parentId = "nowhere";
  assert.ok(!LocalDatasetSchema.safeParse(parent).success);
  const unknown = fixture();
  unknown.items[0].jurisdictionId = "nowhere";
  assert.ok(!LocalDatasetSchema.safeParse(unknown).success);
  const st = fixture();
  st.jurisdictions[0].state = "CO";
  assert.ok(!LocalDatasetSchema.safeParse(st).success);
  const empty = fixture();
  empty.items = [];
  assert.ok(!LocalDatasetSchema.safeParse(empty).success);
  const http = fixture();
  http.items[0].officialUrl = "http://example.org";
  assert.ok(!LocalDatasetSchema.safeParse(http).success);
});

test("itemsFor includes a jurisdiction's own items and those of jurisdictions inside it", () => {
  const d = LocalDatasetSchema.parse(fixture());
  assert.equal(itemsFor(d, "example-county").length, 1);
  assert.equal(itemsFor(d, "example-town").length, 1);
  assert.equal(itemsFor({ ...d, jurisdictions: d.jurisdictions.slice(0, 1), items: [] }, "example-county").length, 0);
});

test("the data structure holds no per-person fields, so it cannot personalize or store a voter's location", () => {
  const src = readFileSync("src/lib/local-elections.ts", "utf8");
  assert.ok(!/address|zip|latitude|longitude|precinct/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));
});
