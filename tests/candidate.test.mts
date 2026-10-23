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

test("shipped profiles only cite https sources and mark every claim with a kind", async () => {
  const { readFileSync } = await import("node:fs");
  const list = JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8"));
  assert.ok(list.length >= 4);
  for (const p of list) {
    assert.ok(p.claims.length > 0, p.name);
    for (const c of p.claims) {
      assert.match(c.sourceUrl, /^https:\/\//);
      assert.match(c.retrievedOn, /^2026-/);
    }
  }
});

test("profile parity: a contest's major-party candidates are either all profiled or none are published", async () => {
  const { readFileSync } = await import("node:fs");
  const e = JSON.parse(readFileSync("data/elections/colorado-2026.json", "utf8"));
  const profiles = JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8"));
  const major = new Set(["Democratic", "Republican"]);
  for (const c of e.contests) {
    const mine = profiles.filter((p: { contestId: string }) => p.contestId === c.id);
    if (mine.length === 0) continue;
    const majors = c.candidates.filter((x: { affiliation: string | null; status: string }) => x.status === "on-ballot" && x.affiliation && major.has(x.affiliation));
    for (const m of majors) assert.ok(mine.some((p: { name: string }) => p.name === m.name), `${c.id}: ${m.name} lacks a profile while a rival has one`);
  }
});

test("profile text never states a claim as the campaign's if it only summarizes the page", async () => {
  const { readFileSync } = await import("node:fs");
  const list = JSON.parse(readFileSync("data/elections/colorado-2026-profiles.json", "utf8"));
  for (const p of list)
    for (const c of p.claims.filter((x: { kind: string }) => x.kind === "own-statement"))
      assert.match(c.text, /campaign's|campaign|page says|page lists|site/i, `${p.name}: own-statement not attributed to the campaign`);
});
