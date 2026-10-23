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
        { label: `Receipts, FY${last.fy}`, value: money(last.receipts), note: `${pct(prev.receipts, last.receipts) >= 0 ? "Up" : "Down"} ${Math.abs(pct(prev.receipts, last.receipts)).toFixed(1)}% from FY${prev.fy}`, kind: "fact", sourceIds: ["mts"] },
        { label: `Outlays, FY${last.fy}`, value: money(last.outlays), note: `${pct(prev.outlays, last.outlays) >= 0 ? "Up" : "Down"} ${Math.abs(pct(prev.outlays, last.outlays)).toFixed(1)}% from FY${prev.fy}`, kind: "fact", sourceIds: ["mts"] },
        { label: `Deficit, FY${last.fy} (outlays minus receipts)`, value: money(deficit(last)), note: `FY${prev.fy}: ${money(deficit(prev))}`, kind: "fact", sourceIds: ["mts"] },
        { label: "Total public debt outstanding", value: money(t.latestDebt.total), note: `As of ${day(t.latestDebt.date)}`, kind: "fact", sourceIds: ["debt"] },
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
        { label: "Appropriated, five supplemental laws", value: `$${u.statedTotal.billions} billion`, note: "FY2022 to FY2024, per CRS", kind: "fact", sourceIds: ["crs"] },
        { label: "Of which State Department and foreign operations accounts", value: `$${u.stateDepartmentAndForeignOperationsTotal.billions} billion`, note: "About 34%, per CRS", kind: "fact", sourceIds: ["crs"] },
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
        { label: `Reported abortions, ${last.year} (${a.areas} areas)`, value: last.abortions.toLocaleString("en-US"), note: `${chg(prev.abortions, last.abortions)} from ${prev.year}`, kind: "fact", sourceIds: ["cdc"] },
        { label: `Rate, ${last.year}`, value: `${last.ratePer1000Women15to44} per 1,000 women aged 15 to 44`, note: `${prev.year}: ${prev.ratePer1000Women15to44}`, kind: "fact", sourceIds: ["cdc"] },
        { label: `Ratio, ${last.year}`, value: `${last.ratioPer1000LiveBirths} per 1,000 live births`, note: `${prev.year}: ${prev.ratioPer1000LiveBirths}`, kind: "fact", sourceIds: ["cdc"] },
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
