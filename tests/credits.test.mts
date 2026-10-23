import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { CREDITS } from "../src/lib/credits.ts";

test("every photograph shipped in public/images is credited with author, license and source", () => {
  const files = readdirSync("public/images").filter((f) => f.endsWith(".jpg") && !f.endsWith("-sm.jpg"));
  for (const f of files) {
    const slug = f.replace(/\.jpg$/, "");
    const c = CREDITS.find((x) => x.slug === slug);
    assert.ok(c, `${f} has no credit entry`);
    assert.ok(c.author.length > 2 && c.license && /^https:\/\/commons\.wikimedia\.org\//.test(c.source), slug);
    assert.ok(existsSync(`public/images/${slug}-sm.jpg`), `${slug} lacks a small version`);
  }
  assert.equal(files.length, CREDITS.length);
});

test("only public-domain or freely licensed photographs are used", () => {
  for (const c of CREDITS) assert.match(c.license, /^(Public domain|CC0|CC BY( [\d.]+)?|CC BY-SA [\d.]+)$/, c.slug);
});

test("every image the app references exists, and decorative photos have empty alt text", () => {
  const src = readFileSync("src/components/common-ground.tsx", "utf8");
  for (const m of src.matchAll(/IMG \+ "([\w-]+\.jpg)"/g)) assert.ok(existsSync(`public/images/${m[1]}`), m[1]);
  assert.ok(readdirSync("public/images").reduce((n, f) => n + readFileSync(`public/images/${f}`).length, 0) < 3_000_000, "images should stay under 3 MB total");
});
