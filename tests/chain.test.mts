import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAINS, ChainSchema, STAGES } from "../src/lib/chain.ts";

test("every chain lists all seven stages once and in order", () => {
  for (const c of CHAINS) assert.deepEqual(c.steps.map((s) => s.stage), [...STAGES]);
  const broken = structuredClone(CHAINS[0]);
  broken.steps.reverse();
  assert.throws(() => ChainSchema.parse(broken));
});

test("documented stages need dated https sources and an actor in an institutional role", () => {
  for (const c of CHAINS)
    for (const s of c.steps)
      if (s.status === "documented")
        for (const e of s.events) {
          assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
          assert.match(e.sourceUrl, /^https:\/\//);
          assert.ok(e.role.length > 3 && e.actor.length > 3);
        }
  const bad = structuredClone(CHAINS[0]) as unknown as { steps: { stage: string; events?: { sourceUrl: string }[] }[] };
  bad.steps.find((s) => s.stage === "vote")!.events![0].sourceUrl = "http://example.org";
  assert.throws(() => ChainSchema.parse(bad));
});

test("undocumented stages explain why, and nothing collapses into a score", () => {
  for (const c of CHAINS) {
    for (const s of c.steps) if (s.status === "not-documented") assert.ok(s.why.length >= 10);
    assert.ok(!/\b(score|rating|grade|truth[- ]?o[- ]?meter|kept|broken promise|liar)\b/i.test(JSON.stringify(c)), c.id);
  }
});

test("the example does not assert a promise, an implementation or an outcome it has not documented", () => {
  const c = CHAINS[0];
  for (const stage of ["promise", "implemented", "outcome"]) assert.equal(c.steps.find((s) => s.stage === stage)!.status, "not-documented");
});
