import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BALLOT_PERSONALIZATION, LOCAL_RACE_TYPES } from "../src/lib/local-races.ts";

test("the product never claims a personalized ballot", () => {
  assert.equal(BALLOT_PERSONALIZATION, "none");
  const ui = readFileSync("src/components/help-me-vote.tsx", "utf8");
  assert.match(ui, /not personalized/);
  assert.ok(!/your personalized ballot|your sample ballot is|we found your ballot/i.test(ui));
});

test("every local race type says what depends on the address and is uniquely identified", () => {
  const ids = LOCAL_RACE_TYPES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of LOCAL_RACE_TYPES) assert.ok(r.what.length > 20 && r.dependsOn.length > 5, r.id);
});

test("Colorado's declared 'not covered' list agrees with the local race types we describe", () => {
  const e = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));
  const text = e.notCovered.join(" ").toLowerCase();
  for (const key of ["u.s. house", "state senate", "district attorney", "city, school district"]) assert.ok(text.includes(key), key);
});
