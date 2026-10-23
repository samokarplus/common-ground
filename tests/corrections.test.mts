import assert from "node:assert/strict";
import { test } from "node:test";
import { CorrectionSchema, reportUrl } from "../src/lib/corrections.ts";

test("report links carry only the route and problem type", () => {
  const u = new URL(reportUrl("/vote/colorado/measure/amendment-81?note=secret", "outdated"));
  assert.equal(u.origin + u.pathname, "https://github.com/samokarplus/common-ground/issues/new");
  const all = decodeURIComponent(u.search);
  assert.ok(all.includes("/vote/colorado/measure/amendment-81"));
  assert.ok(!all.includes("secret"));
});

test("a correction record needs a date, page, type and before/after text", () => {
  const ok = { date: "2026-10-22", page: "/x", type: "incorrect", was: "a", now: "b" };
  assert.ok(CorrectionSchema.safeParse(ok).success);
  assert.ok(!CorrectionSchema.safeParse({ ...ok, type: "rumor" }).success);
  assert.ok(!CorrectionSchema.safeParse({ ...ok, sourceUrl: "http://x.org" }).success);
});
