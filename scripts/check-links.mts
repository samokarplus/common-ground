// Check external links in Common Ground's data files. Usage: npm run check:links
// Exit 1 only for definite failures (404/410/DNS errors). 401/403/429/timeouts are inconclusive:
// many official sites block automated requests.
import { readFileSync } from "node:fs";

const files = [
  "data/elections/colorado-2026.json",
  "data/elections/colorado-2026-profiles.json",
  "src/lib/debates.ts",
  "src/lib/atlas.ts",
];
const urls = new Set<string>();
for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/https:\/\/[^\s"'`)\\<>]+/g)) urls.add(m[0].replace(/[.,;]+$/, ""));
// atlas.ts builds SEP links from slugs and is covered by `npm run check:atlas`.
const list = [...urls].filter((u) => !u.includes("plato.stanford.edu") && !u.includes("${"));
const dead: string[] = [];
const inconclusive: string[] = [];
let ok = 0;
for (const url of list) {
  let status = 0;
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "CommonGround-link-check (+https://github.com/samokarplus/common-ground)" } });
      status = res.status;
      await res.body?.cancel();
    } catch (e) {
      status = /ENOTFOUND/.test(String((e as { cause?: { code?: string } }).cause?.code ?? e)) ? -1 : 0;
    }
    if (status === 200 || status === 404 || status === 410 || status === -1) break;
  }
  if (status === 200) ok++;
  else if (status === 404 || status === 410 || status === -1) dead.push(`${status === -1 ? "DNS" : status} ${url}`);
  else inconclusive.push(`${status || "timeout"} ${url}`);
  await new Promise((r) => setTimeout(r, 200));
}
for (const d of dead) console.error(d);
for (const i of inconclusive) console.warn(`(inconclusive) ${i}`);
console.log(`${list.length} links: ${ok} ok, ${dead.length} dead, ${inconclusive.length} inconclusive`);
process.exit(dead.length ? 1 : 0);
