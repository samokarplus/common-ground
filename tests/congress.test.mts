import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { diffBills, mapStatus, parseBillStatus, stripHtml } from "../src/lib/congress.ts";

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
  assert.equal(mapStatus([{ text: "Passed/agreed to in House: x" }, { text: "Passed/agreed to in Senate: y" }], false), "agreement-unconfirmed");
  assert.equal(mapStatus([{ text: "House agreed to Senate amendment." }], false), "passed-both-chambers");
  assert.equal(mapStatus([{ text: "Presented to President." }], false), "to-president");
  assert.equal(mapStatus([{ text: "Vetoed by President." }], false), "vetoed");
  assert.equal(mapStatus([{ text: "Became Public Law No: 119-1.", type: "BecameLaw" }], false), "enacted");
  assert.equal(mapStatus([{ text: "anything" }], true), "enacted");
});

test("rejects non-BILLSTATUS input", () => {
  assert.throws(() => parseBillStatus("<html></html>"));
});

test("diffBills reports new bills, status changes and new actions only", () => {
  const a = parseBillStatus(fixture);
  const b = { ...a, id: "119-hr-1", number: 1 };
  assert.deepEqual(diffBills([a], [a]), []);
  assert.deepEqual(diffBills([a], [a, b]).map((c) => c.kind), ["new"]);
  assert.deepEqual(diffBills([a], [{ ...a, status: "enacted" }])[0], { id: a.id, kind: "status", from: "passed-one-chamber", to: "enacted" });
  const moved = { ...a, latestAction: { date: "2026-02-01", text: "Something new" } };
  assert.equal(diffBills([a], [moved])[0].kind, "action");
});

test("votes nested inside action items are collected with the official action text", () => {
  const xml = fixture.replace(
    "<actions>",
    "<actions><item><actionDate>2026-01-06</actionDate><text>Passed Senate by recorded vote: 51 - 49</text><type>Floor</type><recordedVotes><recordedVote><url>https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml</url><chamber>Senate</chamber><date>2026-01-06T00:00:00Z</date></recordedVote></recordedVotes></item>",
  );
  const b = parseBillStatus(xml);
  assert.equal(b.votes.length, 2);
  assert.equal(b.votes[0].chamber, "Senate");
  assert.match(b.votes[0].action ?? "", /51 - 49/);
});

test("rejects truncated, mismatched and DTD-bearing source XML", () => {
  assert.throws(() => parseBillStatus(fixture.replace("</billStatus>", "")));
  assert.throws(() => parseBillStatus(fixture.replace("</title>", "</wrong>")));
  assert.throws(() => parseBillStatus('<!DOCTYPE billStatus [<!ENTITY x SYSTEM "file:///etc/passwd">]>' + fixture));
});

test("Congress citations reject lookalike hosts, credentials and insecure links", () => {
  assert.throws(() => parseBillStatus(fixture.replaceAll("https://www.congress.gov", "https://www.congress.gov.example.com")));
  assert.throws(() => parseBillStatus(fixture.replaceAll("https://www.congress.gov", "http://www.congress.gov")));
  assert.throws(() => parseBillStatus(fixture.replaceAll("https://www.congress.gov", "https://user:pass@www.congress.gov")));
  assert.throws(() => parseBillStatus(fixture.replaceAll("https://clerk.house.gov", "https://example.com")));
});
