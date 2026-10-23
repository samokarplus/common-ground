import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { selectDevelopments } from "../src/lib/developments.ts";
import { fromBill, fromFederalRegister, type FrRecord } from "../src/lib/gov-actions.ts";
import type { Bill } from "../src/lib/congress.ts";
import type { TreasuryData } from "../src/lib/briefings.ts";

const bills = JSON.parse(readFileSync("data/congress/bills.json", "utf8")).bills as Bill[];
const fr = JSON.parse(readFileSync("data/federal-register.json", "utf8")).results as FrRecord[];
const treasury = JSON.parse(readFileSync("data/fiscal/treasury.json", "utf8")) as TreasuryData;
const today = "2026-10-23";
const actions = [...bills.map(fromBill), ...fr.map((r) => fromFederalRegister(r, today))];
const dev = selectDevelopments(actions, treasury, today);

test("developments come from official records, each with an original source and a stated selection rule", () => {
  assert.ok(dev.length >= 4);
  for (const d of dev) {
    assert.match(d.original.url, /^https:\/\//, d.id);
    assert.ok(d.rule.length > 20 && d.fact.length > 20 && d.headline.length > 5, d.id);
    assert.ok(d.understand.href.startsWith("/"), d.id);
    assert.match(d.date, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(new Set(dev.map((d) => d.id)).size, dev.length);
});

test("figures in developments match the Treasury data they come from", () => {
  const m = [...treasury.debtMilestones].sort((a, b) => b.trillions - a.trillions)[0];
  const d = dev.find((x) => x.id === `debt-${m.trillions}`)!;
  assert.equal(d.date, m.firstDate);
  assert.ok(d.fact.includes(`$${(m.total / 1e12).toFixed(2)} trillion`));
  const fy = treasury.fiscalYears.at(-1)!;
  assert.ok(dev.find((x) => x.id === `deficit-fy${fy.fy}`)!.headline.includes(`$${((fy.outlays - fy.receipts) / 1e12).toFixed(2)} trillion`));
});

test("only the fiscal items link to a briefing, because only those connections were verified", () => {
  for (const d of dev) {
    const toBriefing = d.understand.href.startsWith("/issues/");
    assert.equal(toBriefing, d.kind === "Spending and debt", d.id);
  }
});

test("an executive order is presented as a presidential action, never as a law", () => {
  for (const d of dev.filter((x) => x.kind === "Presidential action")) assert.match(d.fact, /not a law passed by Congress/);
  for (const d of dev.filter((x) => x.kind === "New law")) assert.match(d.fact, /became/);
});

test("open-for-comment items have a comment deadline that has not passed", () => {
  for (const d of dev.filter((x) => x.kind === "Open for comment")) {
    const m = d.fact.match(/Comments open until (\d{4}-\d{2}-\d{2})/);
    assert.ok(m && m[1] >= today, d.id);
  }
});
