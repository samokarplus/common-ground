import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCeremonial, parseListing, presidentialKind, tidyTitle, validateAnnotations, type PresidentialAction } from "../src/lib/presidential.ts";
import { fromPresidential, mergeActions } from "../src/lib/gov-actions.ts";
import { ISSUES, issuesFor } from "../src/lib/issues.ts";

const snap = JSON.parse(readFileSync("data/government/presidential-actions.json", "utf8")) as { actions: PresidentialAction[] };
const ann = JSON.parse(readFileSync("data/government/annotations.json", "utf8"));

test("listing parser reads title, date and categories", () => {
  const html = `<li data-wp-key="post-template-item-1"><h2><a href="https://www.whitehouse.gov/presidential-actions/2026/10/x/" >Advancing Women&#8217;s Health</a></h2><div class="taxonomy-category wp-block-post-terms"><a rel="tag">Presidential Actions</a>, <a rel="tag">Executive Orders</a></div><time datetime="2026-10-19T11:25:57-04:00">October 19, 2026</time></li>`;
  const [a] = parseListing(html);
  assert.equal(a.title, "Advancing Women’s Health");
  assert.equal(a.date, "2026-10-19");
  assert.deepEqual(a.categories, ["Executive Orders"]);
});
test("snapshot records are well formed and newest first", () => {
  assert.ok(snap.actions.length >= 40);
  for (const a of snap.actions) { assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/); assert.ok(a.url.startsWith("https://www.whitehouse.gov/presidential-actions/")); }
});
test("presidential documents are executive actions, never laws", () => {
  for (const a of snap.actions) { const g = fromPresidential(a); assert.equal(g.stage, "executive-action"); assert.match(g.detail, /not a law passed by Congress/); }
});
test("commemorative proclamations are flagged but tariff proclamations are not", () => {
  assert.ok(isCeremonial({ title: "National Seafood Month, 2026", categories: ["Proclamations"] }));
  assert.ok(!isCeremonial({ title: "Adjusting Imports of Wind Turbines", categories: ["Proclamations"] }));
  assert.equal(presidentialKind({ title: "x", url: "", date: "", categories: ["Executive Orders"] }), "executive-order");
});
test("annotations point at real records, state uncertainty and are not human-reviewed", () => {
  const list = validateAnnotations(ann, snap.actions);
  assert.ok(list.length >= 5);
  for (const a of list) { assert.equal(a.draft.humanReviewed, false); assert.ok(a.uncertain.length >= 1); }
});
test("an annotation for an unknown document or a wrong date is rejected", () => {
  assert.throws(() => validateAnnotations([{ ...ann[0], url: "https://www.whitehouse.gov/presidential-actions/2026/10/nope/" }], snap.actions));
  assert.throws(() => validateAnnotations([{ ...ann[0], signed: "2020-01-01" }], snap.actions));
  assert.throws(() => validateAnnotations([{ ...ann[0], draft: { ...ann[0].draft, humanReviewed: true } }], snap.actions));
});
test("the merged feed drops Federal Register copies of documents the White House list already has", () => {
  const eo = snap.actions.find((a) => a.categories.includes("Executive Orders"))!;
  const fr = [{ document_number: "2026-1", type: "Presidential Document", title: eo.title, publication_date: eo.date, signing_date: eo.date, executive_order_number: "1", html_url: "https://www.federalregister.gov/d/2026-1", agencies: [] }];
  const merged = mergeActions([], fr, snap.actions, "2026-10-23");
  assert.equal(merged.filter((a) => a.title.toLowerCase() === eo.title.toLowerCase()).length, 1);
});
test("issue rules: keywords and policy areas map to issues; unrelated titles map to none", () => {
  assert.ok(issuesFor("Emergency Tax Relief on Diesel Fuel").includes("spending-debt"));
  assert.ok(issuesFor("Decreasing Housing Costs for the American People").includes("cost-of-living"));
  assert.ok(issuesFor("A bill", "Immigration").includes("immigration"));
  assert.deepEqual(issuesFor("Columbus Day, 2026"), []);
  assert.equal(new Set(ISSUES.map((i) => i.id)).size, 9);
});

test("all-capitals titles become title case; mixed-case titles are untouched", () => {
  assert.equal(tidyTitle("DECREASING HOUSING COSTS FOR THE AMERICAN PEOPLE"), "Decreasing Housing Costs for the American People");
  assert.equal(tidyTitle("Emergency Tax Relief on Diesel Fuel"), "Emergency Tax Relief on Diesel Fuel");
  assert.equal(tidyTitle("H.R. 1"), "H.R. 1");
});
