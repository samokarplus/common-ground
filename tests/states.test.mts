import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JURISDICTIONS, coverageOf } from "../src/lib/states.ts";

test("all 50 states and DC are listed once", () => {
  assert.equal(JURISDICTIONS.length, 51);
  assert.equal(new Set(JURISDICTIONS.map(([c]) => c)).size, 51);
  assert.ok(JURISDICTIONS.some(([c]) => c === "DC"));
});

test("coverage claims match the datasets that exist", () => {
  const e = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));
  assert.equal(coverageOf(e.state), "statewide-verified");
  const supported = JURISDICTIONS.filter(([c]) => coverageOf(c) === "statewide-verified").map(([c]) => c);
  assert.deepEqual(supported, ["CO"]);
});
