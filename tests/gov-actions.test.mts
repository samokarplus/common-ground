import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { STAGES, applyFilters, facets, fromBill, fromFederalRegister, sortNewest, type FrRecord } from "../src/lib/gov-actions.ts";
import type { Bill } from "../src/lib/congress.ts";

const bills = JSON.parse(readFileSync("data/congress/bills.json", "utf8")).bills as Bill[];
const fr = JSON.parse(readFileSync("data/federal-register.json", "utf8")).results as FrRecord[];
const today = "2026-10-23";
const all = sortNewest([...bills.map(fromBill), ...fr.map((r) => fromFederalRegister(r, today))]);

test("every item gets exactly one defined stage, a date, a detail line and an official source", () => {
  const ids = new Set(STAGES.map((s) => s.id));
  for (const a of all) {
    assert.ok(ids.has(a.stage), a.id);
    assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(a.detail.length > 10 && /^https:\/\//.test(a.sourceUrl) && a.href.startsWith("/"), a.id);
  }
  assert.equal(new Set(all.map((a) => a.id)).size, all.length);
});

test("executive orders are never labeled as laws, and only enacted bills are called laws", () => {
  const eo = fr.find((r) => r.type === "Presidential Document");
  if (eo) {
    const a = fromFederalRegister({ ...eo, executive_order_number: "14437" }, today);
    assert.equal(a.kind, "executive-order");
    assert.equal(a.stage, "executive-action");
    assert.match(a.detail, /not a law passed by Congress/);
  }
  for (const a of all) {
    assert.equal(a.kind === "law", a.stage === "enacted", a.id);
    if (a.kind === "executive-order" || a.kind === "proposed-rule") assert.notEqual(a.stage, "enacted");
  }
});

test("bill stages follow the bill status and never overstate it", () => {
  const mk = (status: Bill["status"]) => fromBill({ ...bills[0], status, publicLaw: undefined } as Bill);
  assert.equal(mk("introduced").stage, "introduced");
  assert.equal(mk("in-committee").stage, "introduced");
  assert.equal(mk("passed-one-chamber").stage, "passed-one-chamber");
  assert.equal(mk("passed-both-chambers").stage, "passed-congress");
  assert.equal(mk("to-president").stage, "passed-congress");
  assert.equal(mk("vetoed").stage, "introduced");
  assert.equal(mk("enacted").stage, "enacted");
  assert.match(mk("passed-both-chambers").detail, /no enactment is recorded/);
});

test("rule status depends on dates: proposed rules are not in force; effective dates are compared with today", () => {
  const base = { document_number: "x", title: "t", publication_date: "2026-10-01", html_url: "https://www.federalregister.gov/d/x", agencies: [{ name: "Agency" }] } as FrRecord;
  assert.match(fromFederalRegister({ ...base, type: "Proposed Rule", comments_close_on: "2026-12-01" }, today).detail, /Comments open until 2026-12-01\. Not in force/);
  assert.match(fromFederalRegister({ ...base, type: "Proposed Rule", comments_close_on: "2026-10-05" }, today).detail, /closed 2026-10-05/);
  assert.match(fromFederalRegister({ ...base, type: "Rule", effective_on: "2026-12-21" }, today).detail, /Takes effect 2026-12-21/);
  assert.match(fromFederalRegister({ ...base, type: "Rule", effective_on: "2026-10-22" }, today).detail, /in effect since/);
});

test("filters combine, and date windows are relative to today", () => {
  const f = { stage: "all", branch: "all", agencyOrTopic: "", sinceDays: 0, query: "" } as const;
  assert.equal(applyFilters(all, f, today).length, all.length);
  const laws = applyFilters(all, { ...f, stage: "enacted" }, today);
  assert.ok(laws.length > 0 && laws.every((a) => a.kind === "law"));
  assert.ok(applyFilters(all, { ...f, branch: "Agencies" }, today).every((a) => a.branch === "Agencies"));
  assert.ok(applyFilters(all, { ...f, sinceDays: 7 }, today).every((a) => a.date >= "2026-10-16"));
  const topic = facets(all)[0];
  assert.ok(applyFilters(all, { ...f, agencyOrTopic: topic }, today).every((a) => a.agency === topic || a.topic === topic));
  assert.equal(applyFilters(all, { ...f, query: "zzzzzz-none" }, today).length, 0);
});

test("every stage explains what it is and what it is not", () => {
  for (const s of STAGES) assert.ok(s.means.length > 20 && s.notThis.length > 8, s.id);
});
