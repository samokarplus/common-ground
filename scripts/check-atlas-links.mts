// Check Thought Atlas source URLs. Usage: npm run check:atlas
// Exit 1 only for definite failures (404/410). Timeouts are reported as inconclusive,
// because the encyclopedia sometimes throttles automated requests.
import { atlasNodes } from "../src/lib/atlas.ts";

const urls = [...new Set(atlasNodes.map((n) => n.source))];
const dead: string[] = [];
const inconclusive: string[] = [];
for (const url of urls) {
  let status = 0;
  for (let i = 0; i < 2 && status !== 200; i++) {
    try {
      status = (await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000), redirect: "follow" })).status;
    } catch {
      status = 0;
    }
    if (status === 404 || status === 410) break;
  }
  if (status === 404 || status === 410) dead.push(`${status} ${url}`);
  else if (status !== 200) inconclusive.push(url);
  await new Promise((r) => setTimeout(r, 400));
}
for (const d of dead) console.error(d);
console.log(`${urls.length - dead.length - inconclusive.length} ok, ${dead.length} dead, ${inconclusive.length} inconclusive (timeout or non-200)`);
process.exit(dead.length ? 1 : 0);
