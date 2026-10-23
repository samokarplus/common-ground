import { readdir, readFile, lstat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
const root = resolve(".");
const findings = [];
let files = 0;
let bytes = 0;
const skip = new Set(["node_modules", ".git", ".outputs", "coverage", "test-results", "playwright-report"]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|art_v2_[A-Za-z0-9_]{15,})\b/,
  /(?:password|api[_-]?key|access[_-]?token|secret)\s*[:=]\s*["'][^"']{12,}["']/i,
  /\/Users\/[a-z0-9._-]+\//i,
  /[A-Z0-9._%+-]+@(?:gmail|hotmail|outlook|icloud|yahoo)\.com/i,
];
const forbidden =
  /^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|id_rsa|id_ed25519|credentials|hosting\.json|COMMON_GROUND_MASTER_BUILD_PROMPT\.md)$/i;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isSymbolicLink()) {
      findings.push({
        path: relative(root, path),
        kind: "symlink not allowed",
      });
      continue;
    }
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    files++;
    const stat = await lstat(path);
    bytes += stat.size;
    const name = relative(root, path);
    if (forbidden.test(entry.name))
      findings.push({ path: name, kind: "sensitive filename" });
    if (/\.(?:png|jpg|woff2?|ico)$/.test(extname(path))) continue;
    const content = await readFile(path, "utf8");
    if (name !== "scripts/scan-publication.mjs") {
      for (let i = 0; i < patterns.length; i++)
        if (patterns[i].test(content))
          findings.push({ path: name, kind: "sensitive pattern " + (i + 1) });
      if (
        content.includes("api.openai.com") ||
        content.includes("cloudflare:workers") ||
        content.includes("AI_API_KEY")
      )
        findings.push({ path: name, kind: "billable backend code prohibited" });
    }
  }
}
await walk(root);
console.log(JSON.stringify({ scannedFiles: files, bytes, findings }, null, 2));
if (findings.length) process.exit(1);
