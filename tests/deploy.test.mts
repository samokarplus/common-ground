import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

// Deployment safeguards: the committed /docs build is what GitHub Pages serves, so it must be self-consistent.
const html = readFileSync("docs/index.html", "utf8");
const assets = new Set(readdirSync("docs/assets"));

test("index.html references only asset files that exist", () => {
  const refs = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 2, "expected a script and a stylesheet");
  for (const r of refs) assert.ok(existsSync(`docs/${r}`), `missing ${r}`);
});

test("every lazy chunk the app can request exists in the build", () => {
  const entry = [...html.matchAll(/assets\/(index-[\w-]+\.js)/g)][0][1];
  const code = readFileSync(`docs/assets/${entry}`, "utf8");
  const chunks = [...new Set([...code.matchAll(/assets\/([\w-]+\.(?:js|css))/g)].map((m) => m[1]))].concat([...code.matchAll(/"\.\/([\w-]+\.js)"/g)].map((m) => m[1]));
  for (const c of chunks) assert.ok(assets.has(c), `referenced chunk ${c} is not in docs/assets`);
});

test("the build contains no stale files: every asset is referenced by the entry or another asset", () => {
  const all = [...assets].map((f) => readFileSync(`docs/assets/${f}`).toString("latin1"));
  const referenced = (name: string) => html.includes(name) || all.some((c) => c.includes(name));
  for (const f of assets) if (/\.(js|css)$/.test(f)) assert.ok(referenced(f), `${f} is not referenced (stale build output?)`);
});

test("the content security policy still limits connections to this site and the Federal Register", () => {
  const csp = html.match(/Content-Security-Policy"[^>]*content="([^"]+)"/)?.[1] ?? "";
  assert.match(csp, /connect-src 'self' https:\/\/www\.federalregister\.gov/);
  assert.ok(!/unsafe-eval/.test(csp));
});

test("the site serves no source maps or environment files", () => {
  for (const f of readdirSync("docs", { recursive: true }) as string[]) {
    assert.ok(!/\.map$/.test(f) && !/(^|\/)\.env/.test(f), `unexpected file in docs: ${f}`);
  }
});
