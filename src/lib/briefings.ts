/**
 * The three flagship briefings, built from committed official-source data files. Figures in the text are
 * computed from the data, not typed by hand, so text and charts cannot disagree.
 */
import { BriefingSchema, formatValue, type Briefing } from "./briefing.ts";

export type TreasuryData = {
  retrievedAt: string;
  fiscalYears: { fy: number; receipts: number; outlays: number; defense: number; intl: number; health: number; medicare: number; incomeSecurity: number; socialSecurity: number; veterans: number; interest: number; recordDate: string }[];
  debtAtFiscalYearEnd: { fy: number; date: string; total: number; heldByPublic: number; intragovernmental: number }[];
  debtMilestones: { trillions: number; firstDate: string; total: number }[];
  latestDebt: { date: string; total: number; heldByPublic: number; intragovernmental: number };
};
export type UkraineData = {
  measureType: string;
  source: { title: string; url: string; version: string; retrievedOn: string };
  statedTotal: { billions: number; period: string; asOf: string };
  stateDepartmentAndForeignOperationsTotal: { billions: number };
  acts: { id: string; name: string; citation: string; enacted: string; billions: number; fiscalYear: number }[];
  notCovered: string[];
};
export type AbortionData = {
  source: { title: string; url: string; published: string; retrievedOn: string };
  areas: number;
  series: { year: number; abortions: number; ratePer1000Women15to44: number; ratioPer1000LiveBirths: number }[];
  all48AreasIn2022: { abortions: number };
  notReporting: string;
  medication: { earlyMedicationShare2022Percent: number };
  limitations: string[];
};

const day = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const pct = (a: number, b: number) => ((b - a) / a) * 100;

export function buildMoneyBriefing(t: TreasuryData): Briefing {
  const fys = t.fiscalYears;
  const last = fys[fys.length - 1];
  const prev = fys[fys.length - 2];
  const deficit = (y: { receipts: number; outlays: number }) => y.outlays - y.receipts;
  const debtLast = t.debtAtFiscalYearEnd[t.debtAtFiscalYearEnd.length - 1];
  const m40 = t.debtMilestones.find((m) => m.trillions === 40);
  const biggest = fys.reduce((a, b) => (deficit(b) > deficit(a) ? b : a));
  const retrieved = t.retrievedAt.slice(0, 10);
  const money = (n: number) => formatValue(n, "usd-trillions");
  const cats = [
    ["Social Security", last.socialSecurity],
    ["Medicare", last.medicare],
    ["National defense", last.defense],
    ["Net interest on the debt", last.interest],
    ["Health (includes Medicaid)", last.health],
    ["Income security", last.incomeSecurity],
    ["Veterans benefits and services", last.veterans],
    ["International affairs", last.intl],
  ] as const;
  return BriefingSchema.parse({
    id: "federal-spending",
    topic: "Federal budget",
    sections: ["issues", "data"],
    question: "How much does the federal government spend, collect and borrow?",
    shortAnswer: [
      { text: `In fiscal year ${last.fy} (October ${last.fy - 1} through September ${last.fy}) the federal government collected about ${money(last.receipts)} and spent about ${money(last.outlays)}. The gap, about ${money(deficit(last))}, was the deficit, paid for by borrowing.`, kind: "fact", sourceIds: ["mts"] },
      { text: `Total federal debt outstanding was ${money(debtLast.total)} on ${day(debtLast.date)} and ${money(t.latestDebt.total)} on ${day(t.latestDebt.date)}. These are nominal dollars: they are not adjusted for inflation or compared with the size of the economy.`, kind: "fact", sourceIds: ["debt"] },
    ],
    dataThrough: `Fiscal year ${last.fy} (through ${day(last.recordDate)}); debt through ${day(t.latestDebt.date)}`,
    sourceCheckedOn: retrieved,
    evidence: [
      { type: "stats", items: [
        { label: `Receipts, FY${last.fy}`, value: money(last.receipts), note: `${pct(prev.receipts, last.receipts) >= 0 ? "Up" : "Down"} ${Math.abs(pct(prev.receipts, last.receipts)).toFixed(1)}% from FY${prev.fy}`, plain: "All the money the federal government collected in the fiscal year, mostly from taxes.", kind: "fact", sourceIds: ["mts"] },
        { label: `Outlays, FY${last.fy}`, value: money(last.outlays), note: `${pct(prev.outlays, last.outlays) >= 0 ? "Up" : "Down"} ${Math.abs(pct(prev.outlays, last.outlays)).toFixed(1)}% from FY${prev.fy}`, plain: "All the money the government paid out in the fiscal year, from Social Security and health care to defense and interest.", kind: "fact", sourceIds: ["mts"] },
        { label: `Deficit, FY${last.fy} (outlays minus receipts)`, value: money(deficit(last)), note: `FY${prev.fy}: ${money(deficit(prev))}`, plain: "The gap when spending is larger than what was collected. The government borrows to cover it.", kind: "fact", sourceIds: ["mts"] },
        { label: "Total public debt outstanding", value: money(t.latestDebt.total), note: `As of ${day(t.latestDebt.date)}`, plain: "Everything the federal government currently owes. It grows in years when there is a deficit.", kind: "fact", sourceIds: ["debt"] },
      ] },
      { type: "chart", chart: {
        id: "receipts-outlays", title: "Federal receipts and outlays by fiscal year", kind: "line", format: "usd-trillions",
        xLabel: "Fiscal year", yLabel: "Trillions of nominal dollars", baseline: "zero",
        series: [
          { id: "receipts", label: "Receipts (money collected)", estimate: false, points: fys.map((y) => ({ x: `FY${y.fy}`, y: y.receipts })) },
          { id: "outlays", label: "Outlays (money spent)", estimate: false, points: fys.map((y) => ({ x: `FY${y.fy}`, y: y.outlays })) },
        ],
        dateRange: `Fiscal years ${fys[0].fy} to ${last.fy}`,
        definition: "Receipts are federal revenue after refunds. Outlays are payments the Treasury made during the fiscal year (not appropriations or obligations). Fiscal years run from October 1 to September 30.",
        sourceIds: ["mts"], note: "Nominal dollars; not adjusted for inflation.",
      } },
      { type: "chart", chart: {
        id: "deficit", title: "Federal deficit by fiscal year", kind: "bar", format: "usd-trillions",
        xLabel: "Fiscal year", yLabel: "Trillions of nominal dollars", baseline: "zero",
        series: [{ id: "deficit", label: "Deficit (outlays minus receipts)", estimate: false, points: fys.map((y) => ({ x: `FY${y.fy}`, y: deficit(y) })) }],
        dateRange: `Fiscal years ${fys[0].fy} to ${last.fy}`,
        definition: "The deficit is outlays minus receipts for the fiscal year. Common Ground computes it from the two official totals; Treasury's statement reports the same difference.",
        sourceIds: ["mts"],
      } },
      { type: "chart", chart: {
        id: "outlays-by-function", title: `Where the money went, FY${last.fy}: largest spending categories`, kind: "bar", format: "usd-trillions",
        xLabel: "Budget function", yLabel: "Trillions of nominal dollars", baseline: "zero",
        series: [{ id: "fy", label: `Outlays, FY${last.fy}`, estimate: false, points: cats.map(([x, y]) => ({ x, y })) }],
        dateRange: `Fiscal year ${last.fy}`,
        definition: "Net outlays by budget function from Treasury's Monthly Treasury Statement. Categories overlap in everyday speech (for example, Medicaid is inside Health) and the table shows only eight of the functions, so the bars do not sum to total outlays.",
        sourceIds: ["mts"],
      } },
      { type: "chart", chart: {
        id: "debt", title: "Total public debt outstanding at the end of each fiscal year", kind: "line", format: "usd-trillions",
        xLabel: "Fiscal year end (September 30)", yLabel: "Trillions of nominal dollars", baseline: "zero",
        series: [
          { id: "total", label: "Total public debt outstanding", estimate: false, points: t.debtAtFiscalYearEnd.map((d) => ({ x: `FY${d.fy}`, y: d.total })) },
          { id: "public", label: "Held by the public", estimate: false, points: t.debtAtFiscalYearEnd.map((d) => ({ x: `FY${d.fy}`, y: d.heldByPublic })) },
        ],
        dateRange: `September 30, ${t.debtAtFiscalYearEnd[0].fy} to September 30, ${debtLast.fy}`,
        definition: "Total public debt includes debt held by the public (investors, including foreign holders and the Federal Reserve) and intragovernmental holdings (money one part of government owes another, such as trust funds). It is a stock; the deficit is a one-year flow.",
        sourceIds: ["debt"],
      } },
      { type: "text", heading: "Words that are not interchangeable", claims: [
        { text: "Budget authority and appropriations are what Congress allows agencies to commit. Obligations are legally binding commitments. Outlays (also called disbursements) are payments actually made. The charts on this page show receipts and outlays, so they are not appropriations.", kind: "fact", sourceIds: ["gao-glossary"] },
        { text: "A fiscal year is not a calendar year: fiscal year 2026 began October 1, 2025.", kind: "fact", sourceIds: ["mts"] },
      ] },
    ],
    context: [
      { text: `Total debt rose at every fiscal year-end shown, from ${money(t.debtAtFiscalYearEnd[0].total)} in FY${t.debtAtFiscalYearEnd[0].fy} to ${money(debtLast.total)} in FY${debtLast.fy}.`, kind: "fact", sourceIds: ["debt"] },
      { text: `The largest deficit in the years shown was in FY${biggest.fy}, about ${money(deficit(biggest))}. These figures show how large the deficit was; they do not by themselves show why it changed or who was responsible.`, kind: "fact", sourceIds: ["mts"] },
      { text: "Dollar figures are not adjusted for inflation, and no comparison with the size of the economy (for example, debt as a share of gross domestic product) is shown. Both change how large these numbers look over time.", kind: "unknown", sourceIds: [] },
    ],
    recent: [
      ...(m40 ? [{ date: m40.firstDate, text: `Total public debt outstanding first reached $40 trillion (${money(m40.total)}).`, sourceIds: ["debt"] }] : []),
      { date: last.recordDate, text: `Fiscal year ${last.fy} ended with a deficit of about ${money(deficit(last))}, per Treasury's September statement.`, sourceIds: ["mts"] },
    ],
    next: [{ text: "Treasury's later monthly statements will add fiscal year 2027. The status of fiscal year 2027 appropriations was not checked for this briefing.", kind: "unknown", sourceIds: [] }],
    disagreements: {
      factual: [
        { text: "Whether current borrowing is sustainable depends on future interest rates, economic growth and policy, which are forecasts. Official projections exist, such as from the Congressional Budget Office, but are not reproduced here.", kind: "prediction", sourceIds: [] },
      ],
      values: [
        { text: "How large the federal government should be, which programs deserve funding, and how to balance taxes, spending and borrowing are value judgments on which people reasonably differ. Data can show what happened, not settle what should.", kind: "opinion", sourceIds: [] },
      ],
    },
    sources: [
      { id: "mts", label: "Monthly Treasury Statement, Summary of Receipts and Outlays of the U.S. Government (Table 9)", publisher: "U.S. Department of the Treasury, Bureau of the Fiscal Service", url: "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/summary-of-receipts-and-outlays-of-the-u-s-government", retrievedOn: retrieved, kind: "official" },
      { id: "debt", label: "Debt to the Penny", publisher: "U.S. Department of the Treasury, Bureau of the Fiscal Service", url: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny", retrievedOn: retrieved, kind: "official" },
      { id: "gao-glossary", label: "A Glossary of Terms Used in the Federal Budget Process (GAO-05-734SP)", publisher: "U.S. Government Accountability Office", url: "https://www.gao.gov/products/gao-05-734sp", retrievedOn: "2026-10-23", kind: "official" },
    ],
    limitations: [
      "Nominal dollars only; no inflation adjustment and no comparison with gross domestic product.",
      "Only eight spending categories are charted; Medicaid is not shown separately; net interest is shown as Treasury reports it.",
      "Deficit is computed as outlays minus receipts from the two official totals.",
      "The series start at fiscal year 2015 for receipts and outlays because that is how far back the Treasury table was retrieved; debt starts at 2001.",
      "Common Ground does not show federal spending by recipient, program or state in this briefing.",
    ],
    related: [{ label: "How much has America spent supporting Ukraine?", href: "/issues/ukraine-assistance" }, { label: "Government: recent actions", href: "/government" }],
    review: { status: "machine-checked", note: "Figures are computed from Treasury data by a script. No human editor has reviewed the wording." },
  });
}

export function buildUkraineBriefing(u: UkraineData): Briefing {
  const sum = u.acts.reduce((a, b) => a + b.billions, 0);
  return BriefingSchema.parse({
    id: "ukraine-assistance",
    topic: "Foreign assistance",
    sections: ["issues", "data"],
    question: "How much has America spent supporting Ukraine?",
    shortAnswer: [
      { text: `Congress has appropriated $${u.statedTotal.billions} billion in emergency supplemental funding for the response to Russia's 2022 invasion of Ukraine, across five laws for fiscal years 2022 to 2024 (Congressional Research Service, as of ${day(u.statedTotal.asOf)}).`, kind: "fact", sourceIds: ["crs"] },
      { text: "That is money Congress made available, not money delivered to Ukraine. CRS says the funding covers foreign assistance for Ukraine and other affected countries, U.S. military operations in Europe and related support, and other agencies' response costs. Common Ground has not found an official source that reconciles how much was obligated or spent, so it does not give a spending total.", kind: "fact", sourceIds: ["crs"] },
    ],
    dataThrough: `Appropriations enacted through April 2024 (CRS update of ${day(u.statedTotal.asOf)})`,
    sourceCheckedOn: u.source.retrievedOn,
    evidence: [
      { type: "stats", items: [
        { label: "Appropriated, five supplemental laws", value: `$${u.statedTotal.billions} billion`, note: "FY2022 to FY2024, per CRS", plain: "Money Congress made available in law. It is permission to spend, not money already sent to Ukraine.", kind: "fact", sourceIds: ["crs"] },
        { label: "Of which State Department and foreign operations accounts", value: `$${u.stateDepartmentAndForeignOperationsTotal.billions} billion`, note: "About 34%, per CRS", plain: "The portion placed in State Department and foreign operations accounts; the remainder sits in other accounts.", kind: "fact", sourceIds: ["crs"] },
      ] },
      { type: "chart", chart: {
        id: "ukraine-acts", title: "Emergency supplemental appropriations for Ukraine, by law", kind: "bar", format: "usd-billions",
        xLabel: "Law (month enacted)", yLabel: "Billions of nominal dollars appropriated", baseline: "zero",
        series: [{ id: "acts", label: "Appropriated", estimate: false, points: u.acts.map((a) => ({ x: `${new Date((a.enacted.length === 7 ? a.enacted + "-15" : a.enacted) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}: ${a.citation.replace("P.L. ", "PL ").replace(", Division ", " Div ")}`, y: a.billions * 1e9 })) }],
        dateRange: "March 2022 to April 2024",
        definition: "Budget authority provided by Congress in each law, as summarized by CRS. It is not obligations, outlays, deliveries to Ukraine or the value of equipment transferred.",
        sourceIds: ["crs"], note: `The five rounded figures sum to $${sum.toFixed(1)} billion; CRS states a total of $${u.statedTotal.billions} billion.`,
      } },
      { type: "text", heading: "Words that are not interchangeable", claims: [
        { text: "Appropriated (budget authority): money Congress allows agencies to commit. Obligated: legally committed. Outlays or disbursements: payments actually made. Transferred equipment: estimated value of items taken from existing U.S. stocks. Each is a different number and they should not be added together.", kind: "fact", sourceIds: ["gao-glossary"] },
      ] },
    ],
    context: [
      { text: "The five laws were enacted between March 2022 and April 2024: P.L. 117-103 Div. N (March 15, 2022), P.L. 117-128 (May 21, 2022), P.L. 117-180 Div. B (September 30, 2022), P.L. 117-328 Div. M (December 2022) and P.L. 118-50 Div. B (April 2024).", kind: "fact", sourceIds: ["crs"] },
    ],
    recent: [{ date: "2024-04", text: "The Ukraine Security Supplemental Appropriations Act, 2024 (P.L. 118-50, Division B) was enacted, the most recent of the five laws in the CRS count.", sourceIds: ["crs"] }],
    next: [{ text: "Whether Congress has enacted further Ukraine-related appropriations since April 2024 was not checked for this briefing.", kind: "unknown", sourceIds: [] }],
    disagreements: {
      factual: [
        { text: "How to measure the cost: appropriations, obligations, outlays and the value of transferred equipment are different measures, and which one answers a given question depends on the question. Counts also differ in whether they include U.S. military operations and replenishing U.S. stocks.", kind: "interpretation", sourceIds: ["crs"] },
      ],
      values: [
        { text: "Whether the United States should provide this assistance, at what level, and in what form involves judgments about national interest, risk, cost and obligations to allies. Spending figures cannot settle those judgments.", kind: "opinion", sourceIds: [] },
      ],
    },
    sources: [
      { id: "crs", label: u.source.title, publisher: "Congressional Research Service", url: u.source.url, retrievedOn: u.source.retrievedOn, kind: "research" },
      { id: "gao-glossary", label: "A Glossary of Terms Used in the Federal Budget Process (GAO-05-734SP)", publisher: "U.S. Government Accountability Office", url: "https://www.gao.gov/products/gao-05-734sp", retrievedOn: "2026-10-23", kind: "official" },
    ],
    limitations: [
      `${u.source.version}: later laws and later spending are not included.`,
      ...u.notCovered.filter((n) => !n.startsWith("Appropriations enacted after")),
      "This briefing does not compare U.S. assistance with other countries' contributions or with the size of the U.S. budget, because the available totals measure different things over different periods.",
      "Obligation and outlay data for Ukraine-related accounts exist in federal spending databases, but Common Ground has not reconciled them into a defensible total, so none is shown.",
    ],
    related: [{ label: "How much does the federal government spend, collect and borrow?", href: "/issues/federal-spending" }],
    review: { status: "machine-checked", note: "Figures are transcribed from CRS report R47275 and checked against its text by a script. No human editor has reviewed the wording." },
  });
}

export function buildAbortionBriefing(a: AbortionData): Briefing {
  const s = a.series;
  const first = s[0];
  const last = s[s.length - 1];
  const prev = s[s.length - 2];
  const chg = (x: number, y: number) => `${y >= x ? "up" : "down"} ${Math.abs(pct(x, y)).toFixed(0)}%`;
  const retrieved = a.source.retrievedOn;
  return BriefingSchema.parse({
    id: "abortion-statistics",
    topic: "Health and society",
    sections: ["issues", "data"],
    question: "What do the numbers say about abortion in the United States?",
    shortAnswer: [
      { text: `The CDC received reports of ${last.abortions.toLocaleString("en-US")} abortions for ${last.year} from the ${a.areas} reporting areas that supplied data every year from ${first.year} to ${last.year}, a rate of ${last.ratePer1000Women15to44} per 1,000 women aged 15 to 44.`, kind: "fact", sourceIds: ["cdc"] },
      { text: "That is not a national total. Reporting is voluntary, California, Maryland, New Hampshire and New Jersey did not report in 2022, and the CDC says it cannot report the total number of abortions in the United States. The figures also end in 2022 and do not show the effects of later legal changes.", kind: "fact", sourceIds: ["cdc"] },
    ],
    dataThrough: `Calendar year ${last.year} (CDC report published ${a.source.published})`,
    sourceCheckedOn: retrieved,
    evidence: [
      { type: "stats", items: [
        { label: `Reported abortions, ${last.year} (${a.areas} areas)`, value: last.abortions.toLocaleString("en-US"), note: `${chg(prev.abortions, last.abortions)} from ${prev.year}`, plain: "How many abortions the CDC was told about in these reporting areas. It is not a count for the whole country.", kind: "fact", sourceIds: ["cdc"] },
        { label: `Rate, ${last.year}`, value: `${last.ratePer1000Women15to44} per 1,000 women aged 15 to 44`, note: `${prev.year}: ${prev.ratePer1000Women15to44}`, plain: "Abortions for every 1,000 women of childbearing age. A rate keeps years comparable as the population changes.", kind: "fact", sourceIds: ["cdc"] },
        { label: `Ratio, ${last.year}`, value: `${last.ratioPer1000LiveBirths} per 1,000 live births`, note: `${prev.year}: ${prev.ratioPer1000LiveBirths}`, plain: "Abortions for every 1,000 babies born alive. It can change when births change, even if abortions do not.", kind: "fact", sourceIds: ["cdc"] },
      ] },
      { type: "chart", chart: {
        id: "abortion-count", title: "Abortions reported to the CDC, 47 continuously reporting areas", kind: "line", format: "count",
        xLabel: "Year", yLabel: "Reported abortions", baseline: "zero",
        series: [{ id: "count", label: "Reported abortions", estimate: false, points: s.map((p) => ({ x: p.year, y: p.abortions })) }],
        dateRange: `${first.year} to ${last.year}`,
        definition: "The number of abortions reported to the CDC by the 47 areas that reported every year in this period. This is a count of reports from those areas, not an estimate of the national total.",
        sourceIds: ["cdc"],
      } },
      { type: "chart", chart: {
        id: "abortion-rate", title: "Abortion rate per 1,000 women aged 15 to 44", kind: "line", format: "rate1",
        xLabel: "Year", yLabel: "Abortions per 1,000 women aged 15 to 44", baseline: "zero",
        series: [{ id: "rate", label: "Rate", estimate: false, points: s.map((p) => ({ x: p.year, y: p.ratePer1000Women15to44 })) }],
        dateRange: `${first.year} to ${last.year}`,
        definition: "Abortions divided by the estimated number of women aged 15 to 44 in the reporting areas, per 1,000 women. Rates adjust for population size.",
        sourceIds: ["cdc"], note: "The axis starts at zero, so year-to-year changes look small; the data table shows exact values.",
      } },
      { type: "chart", chart: {
        id: "abortion-ratio", title: "Abortion ratio per 1,000 live births", kind: "line", format: "count",
        xLabel: "Year", yLabel: "Abortions per 1,000 live births", baseline: "zero",
        series: [{ id: "ratio", label: "Ratio", estimate: false, points: s.map((p) => ({ x: p.year, y: p.ratioPer1000LiveBirths })) }],
        dateRange: `${first.year} to ${last.year}`,
        definition: "Abortions per 1,000 live births. It compares abortions with births, so it can move when births change even if abortions do not, and it is a different measure from the rate.",
        sourceIds: ["cdc"],
      } },
    ],
    context: [
      { text: `From ${first.year} to ${last.year} the reported number of abortions in these areas fell 5%, the rate fell 10% and the ratio rose 1%, as the CDC reports. Over ${prev.year} to ${last.year} the number fell 2%, the rate 3% and the ratio 2%.`, kind: "fact", sourceIds: ["cdc"] },
      { text: `In ${last.year}, ${a.medication.earlyMedicationShare2022Percent}% of reported abortions were early medication abortions (at nine weeks of gestation or less), in the areas that report this.`, kind: "fact", sourceIds: ["cdc"] },
      { text: `The ${last.year} count for all 48 areas that reported that year was ${a.all48AreasIn2022.abortions.toLocaleString("en-US")}; rates and ratios apply only to the 47-area group.`, kind: "fact", sourceIds: ["cdc"] },
    ],
    recent: [{ date: "2024-11", text: "The CDC published its most recent annual surveillance report, covering 2022.", sourceIds: ["cdc"] }],
    next: [{ text: "The date of the CDC's next abortion surveillance report was not found, so no release is predicted here.", kind: "unknown", sourceIds: [] }],
    disagreements: {
      factual: [
        { text: "How many abortions occur nationally is contested because there is no complete official count. Other organizations publish independent estimates using different methods; they are not included here and may differ from CDC reports.", kind: "interpretation", sourceIds: ["cdc"] },
        { text: "What caused changes over time, including the effects of laws, access, travel between states and telehealth, is not shown by these figures.", kind: "unknown", sourceIds: [] },
      ],
      values: [
        { text: "Whether and when abortion should be legal and how to weigh the interests involved are moral and political judgments on which people deeply disagree. Statistics describe what was reported; they cannot settle those questions.", kind: "opinion", sourceIds: [] },
      ],
    },
    sources: [{ id: "cdc", label: a.source.title, publisher: "Centers for Disease Control and Prevention", url: a.source.url, retrievedOn: retrieved, kind: "official" }],
    limitations: [
      ...a.limitations,
      a.notReporting,
      "Annual values were transcribed from the report's Table 1 by a summarizing tool. 2021 and 2022 and the report's stated changes were cross-checked; a person should confirm the other years against the report.",
      "Missing reporting is not zero: areas that did not report are excluded from the series, not counted as zero abortions.",
    ],
    related: [{ label: "Debate maps: compare the strongest arguments", href: "/debate/maps" }],
    review: { status: "machine-checked", note: "Figures are transcribed from the CDC report and checked for internal consistency by a script. No human editor has reviewed the wording." },
  });
}

export type CpiData = {
  source: { title: string; publisher: string; url: string };
  retrievedAt: string;
  series: Record<"allItems" | "food" | "shelter" | "energy", { month: string; value: number | null }[]>;
};

/** Percent change in the index over twelve months ending in `month`, or null if either month was not published. */
export function yearOverYear(series: { month: string; value: number | null }[], month: string): number | null {
  const [y, m] = month.split("-");
  const now = series.find((p) => p.month === month)?.value;
  const then = series.find((p) => p.month === `${Number(y) - 1}-${m}`)?.value;
  return now == null || then == null ? null : (now / then - 1) * 100;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym: string) => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

export function buildPricesBriefing(c: CpiData): Briefing {
  const a = c.series.allItems;
  const lastMonth = [...a].reverse().find((p) => p.value !== null)!.month;
  const m = lastMonth.slice(5);
  const yr = Number(lastMonth.slice(0, 4));
  const yoy = (s: keyof CpiData["series"], month = lastMonth) => yearOverYear(c.series[s], month);
  const now = yoy("allItems")!;
  const yearAgo = yoy("allItems", `${yr - 1}-${m}`)!;
  const idx = (month: string) => a.find((p) => p.month === month)!.value!;
  const since = (years: number) => (idx(lastMonth) / idx(`${yr - years}-${m}`) - 1) * 100;
  const sepYears = Array.from({ length: 9 }, (_, i) => yr - 8 + i);
  const pts = sepYears.map((y) => ({ x: String(y), y: Number(yearOverYear(a, `${y}-${m}`)!.toFixed(1)) }));
  const peak = pts.reduce((p, q) => (q.y > p.y ? q : p));
  const f = (x: number) => `${x.toFixed(1)}%`;
  const missing = a.filter((p) => p.value === null).map((p) => monthName(p.month));
  const cats: [string, keyof CpiData["series"]][] = [["All items", "allItems"], ["Food", "food"], ["Shelter", "shelter"], ["Energy", "energy"]];
  const retrieved = c.retrievedAt.slice(0, 10);
  const cmp = now > yearAgo ? "higher than" : now < yearAgo ? "lower than" : "the same as";
  return BriefingSchema.parse({
    id: "consumer-prices",
    topic: "Cost of living",
    sections: ["issues", "data"],
    question: "Are prices rising faster than they were, and which prices are driving it?",
    shortAnswer: [
      { text: `Consumer prices in ${monthName(lastMonth)} were ${f(now)} higher than a year earlier, according to the Bureau of Labor Statistics' Consumer Price Index. A year before, in ${monthName(`${yr - 1}-${m}`)}, the figure was ${f(yearAgo)}, so the pace of increase is ${cmp} it was.`, kind: "fact", sourceIds: ["bls"] },
      { text: `Prices are not falling: a slower inflation rate means prices still rise, just less quickly. Prices overall are ${since(5).toFixed(1)}% higher than five years earlier.`, kind: "fact", sourceIds: ["bls"] },
      { text: `The categories differ a lot. Over the same twelve months energy rose ${f(yoy("energy")!)}, shelter ${f(yoy("shelter")!)} and food ${f(yoy("food")!)}. These numbers do not show why prices moved.`, kind: "fact", sourceIds: ["bls"] },
    ],
    dataThrough: `${monthName(lastMonth)} (published by BLS; retrieved ${retrieved})`,
    sourceCheckedOn: retrieved,
    evidence: [
      { type: "stats", items: [
        { label: `Prices vs. a year earlier, ${monthName(lastMonth)}`, value: f(now), note: `${monthName(`${yr - 1}-${m}`)}: ${f(yearAgo)}`, plain: "How much more the same basket of everyday goods and services costs than a year ago.", kind: "fact", sourceIds: ["bls"] },
        { label: `Prices vs. five years earlier`, value: `${since(5).toFixed(1)}% higher`, note: `${monthName(`${yr - 5}-${m}`)} to ${monthName(lastMonth)}`, plain: "How much more it costs than five years ago. Prices stay higher even when inflation slows.", kind: "fact", sourceIds: ["bls"] },
        { label: `Energy vs. a year earlier`, value: f(yoy("energy")!), note: "Energy swings more than other categories", plain: "Fuel and home energy prices, which swing much more than most prices.", kind: "fact", sourceIds: ["bls"] },
      ] },
      { type: "chart", chart: {
        id: "cpi-yoy", title: `Yearly price increase, each ${MONTHS[Number(m) - 1]} (all items)`, kind: "line", format: "percent1",
        xLabel: "Year", yLabel: "Price increase over the previous twelve months, %", baseline: "zero",
        series: [{ id: "cpi", label: "All items", estimate: false, points: pts }],
        dateRange: `${MONTHS[Number(m) - 1]} ${sepYears[0]} to ${MONTHS[Number(m) - 1]} ${yr}`,
        definition: "The percent change in the Consumer Price Index for All Urban Consumers (CPI-U) from the same month one year earlier. One month per year is shown so the picture stays readable; the monthly series is in the source.",
        sourceIds: ["bls"],
      } },
      { type: "chart", chart: {
        id: "cpi-categories", title: `Yearly price increase by category, ${monthName(lastMonth)}`, kind: "bar", format: "percent1",
        xLabel: "Category", yLabel: "Price increase over the previous twelve months, %", baseline: "zero",
        series: [{ id: "cat", label: `Increase to ${monthName(lastMonth)}`, estimate: false, points: cats.map(([label, k]) => ({ x: label, y: Number(yoy(k)!.toFixed(1)) })) }],
        dateRange: `${monthName(`${yr - 1}-${m}`)} to ${monthName(lastMonth)}`,
        definition: "How much average prices in each category rose over twelve months. Shelter is mostly rent and the cost of owning a home as measured by the CPI. Energy is fuel and electricity and natural gas for the home.",
        sourceIds: ["bls"],
      } },
    ],
    context: [
      { text: `Since ${sepYears[0]}, the highest ${MONTHS[Number(m) - 1]}-to-${MONTHS[Number(m) - 1]} increase shown is ${f(peak.y)} (${peak.x}). Today's ${f(now)} is ${now > yearAgo ? "above" : "below"} last year's reading and ${now < peak.y ? "below" : "above"} that peak.`, kind: "fact", sourceIds: ["bls"] },
      { text: `Prices are ${since(2).toFixed(1)}% higher than two years earlier and ${since(5).toFixed(1)}% higher than five years earlier. Whether incomes kept pace is not shown here, because wages are a separate measure.`, kind: "fact", sourceIds: ["bls"] },
    ],
    recent: [
      { date: "2025-10", text: `BLS did not publish an October 2025 index because of a lapse in federal appropriations. It appears as "Not reported" in the data tables, not as zero, and the twelve-month changes that depend on it are blank.`, sourceIds: ["bls"] },
    ],
    next: [{ text: "BLS publishes a new CPI report each month. The next release date was not checked for this page, so none is stated.", kind: "unknown", sourceIds: [] }],
    disagreements: {
      factual: [
        { text: "What is causing price changes is debated: energy markets, trade policy and tariffs, supply disruptions, wages and demand are all cited, and economists weigh them differently. This briefing's numbers describe prices; they do not show which cause matters most.", kind: "interpretation", sourceIds: [] },
        { text: "Whether the CPI matches what households feel is debated. It measures the average change in prices of a fixed set of goods and services for urban consumers; a household that spends more on housing or fuel than average can face a different rate.", kind: "interpretation", sourceIds: ["bls"] },
      ],
      values: [
        { text: "How much to tolerate higher prices to protect jobs or to protect an industry, who should bear the cost, and how government should respond are judgments about tradeoffs. Statistics cannot settle them.", kind: "opinion", sourceIds: [] },
      ],
    },
    sources: [{ id: "bls", label: c.source.title, publisher: c.source.publisher, url: c.source.url, retrievedOn: retrieved, kind: "official" }],
    limitations: [
      "The CPI-U covers urban consumers (about 93% of the U.S. population by BLS's description), not rural households separately, and it is not seasonally adjusted here, so month-to-month changes are noisier than published adjusted figures. Yearly changes avoid most of that.",
      `Missing month: ${missing.join(", ") || "none"}. Gaps are shown as not reported, never as zero.`,
      "This page shows national averages. Prices differ by city, and individual experiences differ from averages.",
      "Wages, income and what households can afford are not covered here, so this page cannot say whether people are better or worse off.",
      "No causes are measured. The categories shown are four of many CPI components.",
    ],
    related: [{ label: "Government spending and the debt", href: "/issues/federal-spending" }],
    review: { status: "machine-checked", note: "Figures come from the BLS API and are computed by script; the wording has not been human-reviewed." },
  });
}
