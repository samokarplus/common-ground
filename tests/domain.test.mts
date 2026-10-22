import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classify,
  normalize,
  validClaim,
  metadataClaims,
  DebateInput,
  clearPrivate,
  coach,
} from "../src/lib/domain.ts";
import { readFileSync } from "node:fs";
const snapshot = JSON.parse(
  readFileSync(
    new URL("../data/federal-register.json", import.meta.url),
    "utf8",
  ),
);
const docs = snapshot.results.map((r: unknown) =>
  normalize(r, snapshot.retrievedAt),
);
test("a proposed rule is never a signed law", () => {
  assert.deepEqual(classify({ type: "Proposed Rule" }), {
    eventType: "RULE_PROPOSED",
    status: "Proposed rule",
  });
  assert.ok(!classify({ type: "Proposed Rule" }).status.includes("signed"));
});
test("a presidential document is not assumed to be an executive order", () => {
  assert.equal(
    classify({ type: "Presidential Document" }).eventType,
    "PRESIDENTIAL_DOCUMENT_PUBLISHED",
  );
  assert.equal(
    classify({ type: "Presidential Document", executive_order_number: "123" })
      .eventType,
    "EXECUTIVE_ORDER_SIGNED",
  );
});
test("rules and notices have separate event types", () => {
  assert.equal(classify({ type: "Rule" }).eventType, "RULE_FINALIZED");
  assert.equal(classify({ type: "Notice" }).eventType, "NOTICE_PUBLISHED");
});
test("snapshot source records have dates, federal jurisdiction and canonical citations", () => {
  assert.equal(docs.length, 40);
  for (const d of docs) {
    assert.match(d.publication_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(d.jurisdiction, "United States · Federal");
    assert.equal(new URL(d.html_url).hostname, "www.federalregister.gov");
    assert.ok(Date.parse(d.retrievedAt));
  }
});
test("all published evidence-requiring metadata claims have linked passages", () => {
  for (const d of docs)
    for (const claim of metadataClaims(d)) assert.ok(validClaim(claim, docs));
});
test("ungrounded factual claims are rejected while uncertainty is permitted", () => {
  assert.equal(
    validClaim(
      {
        text: "Invented effect",
        type: "fact",
        sourceIds: ["fake"],
        verified: true,
        reviewerStatus: "unreviewed",
      },
      docs,
    ),
    false,
  );
  assert.equal(
    validClaim(
      {
        text: "Not established from available sources",
        type: "uncertainty",
        sourceIds: [],
        verified: false,
        reviewerStatus: "unreviewed",
      },
      docs,
    ),
    true,
  );
});
test("reject unsafe source origins and malformed dates", () => {
  assert.throws(() =>
    normalize(
      { ...snapshot.results[0], html_url: "https://evil.example/doc" },
      snapshot.retrievedAt,
    ),
  );
  assert.throws(() =>
    normalize(
      { ...snapshot.results[0], publication_date: "yesterday" },
      snapshot.retrievedAt,
    ),
  );
});
test("debate inputs validate length and mode", () => {
  assert.equal(
    DebateInput.safeParse({
      position: "a",
      mode: "Socratic Coach",
      topic: "Public safety",
    }).success,
    false,
  );
  assert.equal(
    DebateInput.safeParse({
      position: "I am unsure about tradeoffs.",
      mode: "Socratic Coach",
      topic: "Public safety",
    }).success,
    true,
  );
  assert.equal(
    DebateInput.safeParse({
      position: "a".repeat(4001),
      mode: "Socratic Coach",
      topic: "x",
    }).success,
    false,
  );
});
test("no-key coach is useful and makes no fabricated sourced claims", () => {
  for (const mode of [
    "Socratic Coach",
    "Steelman Both Sides",
    "Explain Like I’m New",
    "Policy Tradeoffs",
    "Philosophical Roots",
  ]) {
    const turns = coach("How do we balance privacy and safety?", mode);
    assert.equal(turns.length, 5);
    assert.ok(turns.every((t) => t.heading && t.text));
    assert.match(turns[4].text, /evidence/);
  }
});
test("delete all removes every application private key but preserves other apps", () => {
  const data = new Map([
    ["cg-values", "sensitive"],
    ["cg-debate", "sensitive"],
    ["cg-ballot", "sensitive"],
    ["cg-saved", "ids"],
    ["other-app", "keep"],
  ]);
  clearPrivate({
    removeItem: (k: string) => {
      data.delete(k);
    },
  });
  assert.deepEqual([...data], [["other-app", "keep"]]);
});
test("fabricated passage offsets and text cannot pass citation validation", () => {
  const base = metadataClaims(docs[0])[0];
  assert.equal(
    validClaim(
      {
        ...base,
        passage: {
          field: "publication_date",
          text: "Invented quote",
          start: 0,
          end: 14,
        },
      },
      docs,
    ),
    false,
  );
  assert.equal(
    validClaim(
      {
        ...base,
        passage: {
          field: "publication_date",
          text: docs[0].publication_date,
          start: 3,
          end: 13,
        },
      },
      docs,
    ),
    false,
  );
});
test("reject invalid calendar days, including nonexistent leap dates", () => {
  for (const date of ["2026-13-22", "2026-02-29", "2026-04-31"])
    assert.throws(() =>
      normalize(
        { ...snapshot.results[0], publication_date: date },
        snapshot.retrievedAt,
      ),
    );
  assert.equal(
    normalize(
      { ...snapshot.results[0], publication_date: "2024-02-29" },
      snapshot.retrievedAt,
    ).publication_date,
    "2024-02-29",
  );
});
test("proposed-rule comment dates never become effective dates", () => {
  const d = normalize(
    {
      ...snapshot.results[0],
      type: "Proposed Rule",
      dates: "Comments due December 7, 2026.",
      effective_on: null,
    },
    snapshot.retrievedAt,
  );
  assert.equal(d.effective_on, null);
  assert.match(d.dates!, /Comments/);
  assert.equal(d.eventType, "RULE_PROPOSED");
});
