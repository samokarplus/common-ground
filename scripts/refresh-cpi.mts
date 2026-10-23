// Refresh consumer price index series from the Bureau of Labor Statistics public API (official, keyless v2 endpoint).
// Usage: npm run refresh:cpi
// Series: CPI-U, U.S. city average, not seasonally adjusted, 1982-84=100: all items, food, shelter, energy.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "data/stats/cpi-bls.json";
const SERIES = { allItems: "CUUR0000SA0", food: "CUUR0000SAF1", shelter: "CUUR0000SAH1", energy: "CUUR0000SA0E" } as const;
const endYear = new Date().getUTCFullYear();
try {
  const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "CommonGround-civic-education (+https://github.com/samokarplus/common-ground)" },
    body: JSON.stringify({ seriesid: Object.values(SERIES), startyear: String(endYear - 9), endyear: String(endYear) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = (await res.json()) as { status: string; message?: string[]; Results?: { series: { seriesID: string; data: { year: string; period: string; value: string }[] }[] } };
  if (j.status !== "REQUEST_SUCCEEDED" || !j.Results) throw new Error(`BLS said ${j.status}: ${(j.message ?? []).join("; ")}`);
  const out: Record<string, { month: string; value: number | null }[]> = {};
  for (const [name, id] of Object.entries(SERIES)) {
    const s = j.Results.series.find((x) => x.seriesID === id);
    if (!s) throw new Error(`Missing series ${id}`);
    out[name] = s.data
      .filter((d) => /^M(0[1-9]|1[0-2])$/.test(d.period))
      // "-" means BLS did not publish that month (e.g. October 2025, lapse in appropriations): keep it as null, never zero.
      .map((d) => ({ month: `${d.year}-${d.period.slice(1)}`, value: d.value === "-" ? null : Number(d.value) }))
      .sort((a, b) => a.month.localeCompare(b.month));
    if (out[name].filter((p) => p.value !== null).length < 60 || out[name].some((p) => p.value !== null && !Number.isFinite(p.value))) throw new Error(`Series ${id} looks incomplete`);
  }
  const prev = (() => { try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return null; } })();
  if (prev && JSON.stringify(prev.series) === JSON.stringify(out)) console.log("Unchanged");
  else {
    writeFileSync(FILE, JSON.stringify({ source: { title: "Consumer Price Index for All Urban Consumers (CPI-U), U.S. city average, not seasonally adjusted (1982-84=100)", publisher: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/cpi/", seriesIds: SERIES }, retrievedAt: new Date().toISOString(), series: out }, null, 2) + "\n");
    console.log(`Wrote CPI through ${out.allItems.at(-1)!.month}`);
  }
} catch (e) {
  console.error("Refresh failed; snapshot left unchanged:", (e as Error).message);
  process.exit(1);
}
