// Refresh the presidential-actions snapshot from whitehouse.gov. Usage: npm run refresh:presidential
// Reads the first few listing pages politely. Leaves the snapshot untouched on any failure.
import { readFileSync, writeFileSync } from "node:fs";
import { parseListing, type PresidentialAction } from "../src/lib/presidential.ts";

const PAGES = 6;
const FILE = "data/government/presidential-actions.json";
const UA = "CommonGround-research/1.0 (nonpartisan civic education; https://github.com/samokarplus/common-ground)";
const all: PresidentialAction[] = [];
try {
  for (let p = 1; p <= PAGES; p++) {
    const res = await fetch(`https://www.whitehouse.gov/presidential-actions/${p > 1 ? `page/${p}/` : ""}`, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} on page ${p}`);
    const items = parseListing(await res.text());
    if (!items.length) throw new Error(`No items parsed on page ${p}`);
    all.push(...items);
    await new Promise((r) => setTimeout(r, 1500));
  }
  const unique = [...new Map(all.map((a) => [a.url, a])).values()];
  const next = { source: "https://www.whitehouse.gov/presidential-actions/", retrievedAt: new Date().toISOString(), pagesRead: PAGES, actions: unique };
  let same = false;
  try { same = JSON.stringify(JSON.parse(readFileSync(FILE, "utf8")).actions) === JSON.stringify(unique); } catch {}
  if (same) console.log(`Unchanged (${unique.length} actions)`);
  else { writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n"); console.log(`Wrote ${unique.length} actions, ${unique.at(-1)!.date} to ${unique[0].date}`); }
} catch (e) {
  console.error("Refresh failed; snapshot left unchanged:", (e as Error).message);
  process.exit(1);
}
