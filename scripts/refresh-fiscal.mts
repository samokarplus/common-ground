// Refresh federal fiscal series from the U.S. Treasury's Fiscal Data API (official, keyless).
// Usage: npm run refresh:fiscal  (add --dry-run to print a summary only)
// Sources: Monthly Treasury Statement Table 9 (receipts and outlays by function, fiscal-year-to-date through
// September = the fiscal year total) and Debt to the Penny. Values are nominal dollars, never inflation-adjusted.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service";
const OUT = "data/fiscal/treasury.json";
const FIRST = 2001;
const dryRun = process.argv.includes("--dry-run");
const LINES = { receipts: 12, defense: 14, intl: 15, health: 24, medicare: 25, incomeSecurity: 26, socialSecurity: 27, veterans: 28, interest: 31, outlays: 33 } as const;

async function get(url: string, attempts = 4): Promise<{ data: Record<string, string>[] }> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { Accept: "application/json", "User-Agent": "CommonGround-civic-education (+https://github.com/samokarplus/common-ground)" } });
      if (res.ok) return (await res.json()) as { data: Record<string, string>[] };
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 1500 * 2 ** i));
  }
  throw last;
}
const num = (s: string | undefined) => (s === undefined || s === "null" ? null : Number(s));

try {
  const years: unknown[] = [];
  const thisFy = new Date().getUTCFullYear() + 1;
  for (let fy = FIRST; fy <= thisFy; fy++) {
    const { data } = await get(`${BASE}/v1/accounting/mts/mts_table_9?filter=record_fiscal_year:eq:${fy},record_calendar_month:eq:09&page[size]=100`);
    if (!data.length) continue; // fiscal year not complete or not yet published
    const by = new Map(data.map((r) => [Number(r.print_order_nbr), r]));
    const get9 = (n: number) => num(by.get(n)?.current_fytd_rcpt_outly_amt);
    const rec: Record<string, number | null> = {};
    for (const [k, n] of Object.entries(LINES)) rec[k] = get9(n);
    if (rec.receipts === null || rec.outlays === null) throw new Error(`FY${fy}: missing totals`);
    years.push({ fy, ...rec, recordDate: data[0].record_date });
    await new Promise((r) => setTimeout(r, 150));
  }
  // Debt at the end of each fiscal year: the last business day on or before September 30.
  const debt: unknown[] = [];
  for (let fy = FIRST; fy <= thisFy; fy++) {
    const { data } = await get(`${BASE}/v2/accounting/od/debt_to_penny?filter=record_date:lte:${fy}-09-30,record_date:gte:${fy}-09-20&sort=-record_date&page[size]=1`);
    if (!data.length) continue;
    debt.push({ fy, date: data[0].record_date, total: num(data[0].tot_pub_debt_out_amt), heldByPublic: num(data[0].debt_held_public_amt), intragovernmental: num(data[0].intragov_hold_amt) });
  }
  // First day total public debt outstanding was at or above each trillion-dollar threshold (official daily series).
  const milestones: unknown[] = [];
  for (const t of [34, 35, 36, 37, 38, 39, 40, 41]) {
    const { data } = await get(`${BASE}/v2/accounting/od/debt_to_penny?filter=tot_pub_debt_out_amt:gte:${t}000000000000&sort=record_date&page[size]=1`);
    if (data.length) milestones.push({ trillions: t, firstDate: data[0].record_date, total: num(data[0].tot_pub_debt_out_amt) });
  }
  const latest = (await get(`${BASE}/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1`)).data[0];
  const snapshot = {
    retrievedAt: new Date().toISOString(),
    sources: {
      mts: "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/summary-of-receipts-and-outlays-of-the-u-s-government",
      debt: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
    },
    units: "nominal U.S. dollars",
    fiscalYears: years,
    debtAtFiscalYearEnd: debt,
    debtMilestones: milestones,
    latestDebt: { date: latest.record_date, total: num(latest.tot_pub_debt_out_amt), heldByPublic: num(latest.debt_held_public_amt), intragovernmental: num(latest.intragov_hold_amt) },
  };
  let prev: { fiscalYears?: unknown; debtAtFiscalYearEnd?: unknown; latestDebt?: unknown } = {};
  try {
    prev = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* first run */
  }
  const same = JSON.stringify([prev.fiscalYears, prev.debtAtFiscalYearEnd, prev.latestDebt, (prev as { debtMilestones?: unknown }).debtMilestones]) === JSON.stringify([snapshot.fiscalYears, snapshot.debtAtFiscalYearEnd, snapshot.latestDebt, snapshot.debtMilestones]);
  console.log(`${years.length} fiscal years (${FIRST}-${(years.at(-1) as { fy: number }).fy}), ${debt.length} year-end debt points; latest debt ${latest.record_date}.`);
  if (same) console.log("No change in official data. Nothing written.");
  else if (dryRun) console.log("Dry run: would write", OUT);
  else {
    await mkdir("data/fiscal", { recursive: true });
    await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n");
    console.log("Wrote", OUT);
  }
} catch (e) {
  console.error(`Treasury Fiscal Data unavailable or unexpected: ${(e as Error).message}. Snapshot left unchanged.`);
  process.exit(1);
}
