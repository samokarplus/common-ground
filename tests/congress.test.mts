import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { mapStatus, parseBillStatus, stripHtml } from "../src/lib/congress.ts";

const fixture = readFileSync(new URL("./fixtures/billstatus-fixture.xml", import.meta.url), "utf8");

test("parses a BILLSTATUS document into a validated bill", () => {
  const b = parseBillStatus(fixture);
  assert.equal(b.id, "119-hr-9999");
  assert.equal(b.title, "Fixture & Example Act"); // not the related bill's title
  assert.equal(b.originChamber, "House");
  assert.equal(b.cosponsorCount, 2);
  assert.equal(b.sponsor?.party, "I");
  assert.deepEqual(b.committees, ["Example Committee"]);
  assert.equal(b.actions[0].date, "2026-01-05"); // newest first
  assert.equal(b.votes.length, 1);
  assert.equal(b.status, "passed-one-chamber");
});

test("summary HTML is reduced to plain text", () => {
  assert.equal(stripHtml("<p>A <b>b</b> &amp; c&nbsp;d</p>"), "A b & c d");
  assert.equal(parseBillStatus(fixture).crsSummary, "This is fixture text & nothing more.");
});

test("status mapping is conservative", () => {
  assert.equal(mapStatus([{ text: "Introduced in House" }], false), "introduced");
  assert.equal(mapStatus([{ text: "Referred to the Committee on X.", type: "IntroReferral" }], false), "in-committee");
  assert.equal(mapStatus([{ text: "Passed/agreed to in House: x" }, { text: "Passed/agreed to in Senate: y" }], false), "passed-both-chambers");
  assert.equal(mapStatus([{ text: "Presented to President." }], false), "to-president");
  assert.equal(mapStatus([{ text: "Vetoed by President." }], false), "vetoed");
  assert.equal(mapStatus([{ text: "Became Public Law No: 119-1.", type: "BecameLaw" }], false), "enacted");
  assert.equal(mapStatus([{ text: "anything" }], true), "enacted");
});

test("rejects non-BILLSTATUS input", () => {
  assert.throws(() => parseBillStatus("<html></html>"));
});
