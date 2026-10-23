import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

test("a real refresh script preserves unchanged content, clears a recovered failure, and protects data on 403", () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-refresh-test-"));
  const script = resolve("scripts/refresh-federal-register.mts");
  const snapshot = readFileSync("data/federal-register.json", "utf8");
  try {
    mkdirSync(join(dir, "data/changelog"), { recursive: true });
    writeFileSync(join(dir, "data/federal-register.json"), snapshot);
    writeFileSync(join(dir, "data/changelog/federal-register.jsonl"), "");
    writeFileSync(join(dir, "data/source-status.json"), JSON.stringify({ "federal-register": { lastFailure: "2026-01-01", lastError: "HTTP 503" } }));
    const mock = join(dir, "fetch.mjs");
    writeFileSync(mock, `import {readFileSync} from 'node:fs';
      globalThis.fetch = async () => process.env.CG_TEST_FAIL === 'yes'
        ? new Response('{}', {status:403})
        : Response.json({results: JSON.parse(readFileSync('data/federal-register.json','utf8')).results});`);
    const run = (fail = false) => spawnSync(process.execPath, ["--experimental-strip-types", "--import", pathToFileURL(mock).href, script], {
      cwd: dir, encoding: "utf8", env: { ...process.env, CG_TEST_FAIL: fail ? "yes" : "no" },
    });
    for (let i = 0; i < 2; i++) {
      const result = run();
      assert.equal(result.status, 0, result.stderr);
      assert.equal(readFileSync(join(dir, "data/federal-register.json"), "utf8"), snapshot);
      assert.equal(readFileSync(join(dir, "data/changelog/federal-register.jsonl"), "utf8"), "");
      const status = JSON.parse(readFileSync(join(dir, "data/source-status.json"), "utf8"))["federal-register"];
      assert.ok(status.lastCheckedAt);
      assert.equal(status.lastError, undefined);
    }
    assert.equal(run(true).status, 1);
    assert.equal(readFileSync(join(dir, "data/federal-register.json"), "utf8"), snapshot);
    assert.match(JSON.parse(readFileSync(join(dir, "data/source-status.json"), "utf8"))["federal-register"].lastError, /403/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
