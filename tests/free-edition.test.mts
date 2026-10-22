import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { localDebate } from "../src/lib/local-debate.ts";
test("local coach performs no network requests", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error("Network must not be used");
  };
  try {
    for (const mode of [
      "Socratic Coach",
      "Steelman Both Sides",
      "Explain Like I’m New",
      "Policy Tradeoffs",
      "Philosophical Roots",
    ]) {
      const result = await localDebate({
        position: "How do we balance privacy and public safety?",
        topic: "Privacy",
        mode,
      });
      assert.equal(result.provider, "local-guide");
      assert.equal(result.turns.length, 7);
      assert.match(result.notice, /not generative AI/);
      assert.deepEqual(result.citations, []);
    }
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("local coach rejects invalid input before producing guidance", async () => {
  await assert.rejects(
    localDebate({ position: "x", mode: "Socratic Coach", topic: "x" }),
  );
});
test("source adapter has a fixed keyless official origin", () => {
  const source = readFileSync(
    new URL("../src/lib/free-source.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /https:\/\/www.federalregister.gov/);
  assert.ok(!source.includes("Authorization"));
  assert.ok(!source.includes("api_key"));
});
test("built deployment uses relative assets and restrictive connections", () => {
  const html = readFileSync(
    new URL("../docs/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /\.\/assets\//);
  assert.match(html, /connect-src 'self' https:\/\/www.federalregister.gov/);
  assert.ok(!html.includes("https://fonts.googleapis.com"));
  for (const name of readdirSync(new URL("../docs/assets/", import.meta.url)))
    assert.ok(!name.endsWith(".map"));
});
