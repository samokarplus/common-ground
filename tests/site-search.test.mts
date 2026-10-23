import assert from "node:assert/strict";
import { test } from "node:test";
import { searchSite, type SearchIndex } from "../src/lib/site-search.ts";

const index: SearchIndex = {
  measures: [
    { id: "amendment-87", designation: "Amendment 87", shortTitle: "Graduated Income Tax", topic: "Taxes & budget" },
    { id: "amendment-84", designation: "Amendment 84", shortTitle: "Mail Ballot Voter Identification", topic: "Elections" },
  ],
  contests: [{ id: "governor", office: "Governor", candidates: [{ name: "Phil Weiser" }, { name: "Victor Marx" }] }],
  atlas: [{ id: "federalism", name: "Federalism", description: "A system dividing authority between national and regional governments." }],
  debates: [{ id: "mail-ballot-id", question: "Should Colorado require ID information on mail ballots?" }],
  pathways: [],
  pages: [{ href: "/congress", title: "Congress tracker", about: "Follow federal bills" }],
};

test("every term must match, across groups, with title matches first", () => {
  const r = searchSite(index, "mail ballot");
  assert.ok(r.some((h) => h.href === "/vote/colorado/measure/amendment-84"));
  assert.ok(r.some((h) => h.href === "/debate/maps/mail-ballot-id"));
  assert.ok(!r.some((h) => h.href.includes("amendment-87")));
});

test("candidate names find the office, and accents and case are ignored", () => {
  assert.equal(searchSite(index, "WEISER")[0].href, "/vote/colorado/contest/governor");
  assert.equal(searchSite(index, "fédéralism")[0].href, "/atlas?node=federalism");
});

test("short or empty queries return nothing instead of everything", () => {
  assert.deepEqual(searchSite(index, ""), []);
  assert.deepEqual(searchSite(index, "a"), []);
  assert.deepEqual(searchSite(index, "zzzzz"), []);
});

test("results are capped per group", () => {
  const many: SearchIndex = { ...index, atlas: Array.from({ length: 30 }, (_, i) => ({ id: `n${i}`, name: `Idea ${i}`, description: "common" })) };
  assert.equal(searchSite(many, "common", 5).filter((h) => h.group.startsWith("Ideas")).length, 5);
});
