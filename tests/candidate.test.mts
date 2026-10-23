import assert from "node:assert/strict";
import { test } from "node:test";
import { completeness, validateProfiles, type Profile } from "../src/lib/candidate.ts";

const contests = [
  { id: "governor", kind: "partisan", candidates: [{ name: "Test Person" }] },
  { id: "court", kind: "retention", candidates: [{ name: "Judge J" }] },
];
const base = { contestId: "governor", name: "Test Person", claims: [], checkedNothingFound: [], lastVerifiedOn: "2026-10-22" };
const claim = { kind: "own-statement", area: "positions", text: "Fixture claim.", sourceUrl: "https://example.org/x", sourceTitle: "Fixture", retrievedOn: "2026-10-22" };

test("no profile means everything is unresearched, not 'no position'", () => {
  const c = completeness(undefined);
  assert.equal(c.unresearched.length, 5);
  assert.equal(c.covered.length, 0);
});

test("completeness separates covered, checked-nothing-found and unresearched areas", () => {
  const p = { ...base, claims: [claim], checkedNothingFound: ["voting-record"] } as Profile;
  const c = completeness(p);
  assert.deepEqual(c.covered, ["positions"]);
  assert.deepEqual(c.notFound, ["voting-record"]);
  assert.equal(c.unresearched.length, 3);
});

test("claims need an https source and a retrieval date", () => {
  assert.throws(() => validateProfiles([{ ...base, claims: [{ ...claim, sourceUrl: "http://example.org" }] }], contests));
  assert.throws(() => validateProfiles([{ ...base, claims: [{ ...claim, retrievedOn: undefined }] }], contests));
  assert.throws(() => validateProfiles([{ ...base, claims: [{ ...claim, kind: "party-position" }] }], contests));
});

test("profiles must match a real candidate; judges never get profiles; no duplicates", () => {
  assert.equal(validateProfiles([base], contests).length, 1);
  assert.throws(() => validateProfiles([{ ...base, name: "Nobody" }], contests));
  assert.throws(() => validateProfiles([{ ...base, contestId: "court", name: "Judge J" }], contests));
  assert.throws(() => validateProfiles([base, base], contests));
});

test("shipped profile data validates against the Colorado dataset", async () => {
  const { readFileSync } = await import("node:fs");
  const { parseElection } = await import("../src/lib/election.ts");
  const e = parseElection(JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8")));
  validateProfiles(JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8")), e.contests);
});
