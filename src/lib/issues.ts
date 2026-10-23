/**
 * The nine issues Common Ground is organised around, and the rules that connect other content to them.
 * Connections are explicit: a CRS policy area or a keyword in a title. They are shown to readers as such,
 * because a keyword rule can miss an item or place one where an expert would not.
 */
export const ISSUES = [
  { id: "cost-of-living", title: "Cost of living and inflation", question: "Are prices rising faster than before, and what is being done about them?", blurb: "Prices, wages, housing and the everyday cost of getting by.", policyAreas: ["Housing and Community Development", "Commerce"], keywords: ["inflation", "price", "cost of living", "housing", "mortgage", "tariff", "gas tax", "diesel", "wage", "grocer", "afford", "consumer"] },
  { id: "health-care", title: "Health care", question: "What does health care cost, who is covered, and what is government changing?", blurb: "Coverage, prices, Medicare and Medicaid, drugs and research.", policyAreas: ["Health"], keywords: ["health", "medicare", "medicaid", "medical", "drug", "pharmac", "hospital", "insurance", "patient", "women's health", "nih", "fda"] },
  { id: "immigration", title: "Immigration", question: "Who is crossing, who is staying, and what is government doing about it?", blurb: "Border security, legal immigration, asylum and enforcement.", policyAreas: ["Immigration"], keywords: ["immigra", "border", "asylum", "alien", "visa", "deport", "refugee", "citizenship", "customs and border"] },
  { id: "abortion", title: "Abortion and reproductive policy", question: "What do the numbers show, and what are governments doing?", blurb: "Abortion data, state and federal law, contraception and IVF.", policyAreas: [], keywords: ["abortion", "reproductive", "contracepti", "ivf", "fertility", "roe v. wade", "mifepristone", "unborn", "pregnan"] },
  { id: "climate-energy", title: "Climate change and energy", question: "How is energy changing, what does it cost, and what are governments doing?", blurb: "Power, fuel, emissions, regulation and the grid.", policyAreas: ["Energy", "Environmental Protection"], keywords: ["energy", "climate", "emission", "oil", "natural gas", "petroleum", "wind", "solar", "clean air", "clean water", "nuclear", "electric", "grid", "refining", "pipeline"] },
  { id: "spending-debt", title: "Government spending and debt", question: "How much does the federal government collect, spend and borrow?", blurb: "Revenue, outlays, the deficit, the debt and taxes.", policyAreas: ["Economics and Public Finance", "Taxation", "Finance and Financial Sector"], keywords: ["budget", "appropriation", "deficit", "debt", "tax", "spending", "treasury", "revenue"] },
  { id: "corruption-ethics", title: "Corruption, ethics and money in politics", question: "What rules govern officials and campaign money, and how are they enforced?", blurb: "Ethics rules, campaign finance, lobbying and elections.", policyAreas: ["Government Operations and Politics", "Congress"], keywords: ["ethics", "corrupt", "campaign finance", "lobby", "pardon", "inspector general", "conflict of interest", "election", "redistrict", "committee of inquiry"] },
  { id: "public-lands", title: "National parks and public lands", question: "Who manages public lands, and what is allowed on them?", blurb: "National parks, forests, grazing, drilling and conservation.", policyAreas: ["Public Lands and Natural Resources", "Native Americans"], keywords: ["national park", "public land", "forest", "wilderness", "monument", "bureau of land management", "conservation", "wildlife", "refuge"] },
  { id: "foreign-policy", title: "Foreign policy and national security", question: "Where is the United States engaged abroad, and at what cost?", blurb: "Alliances, sanctions, aid, trade and the military.", policyAreas: ["International Affairs", "Armed Forces and National Security", "Foreign Trade and International Finance"], keywords: ["sanction", "russia", "ukraine", "iran", "israel", "nato", "defense", "military", "foreign", "war", "national security", "china", "trade agreement"] },
] as const;

export type IssueId = (typeof ISSUES)[number]["id"];
export const issueById = (id: string) => ISSUES.find((i) => i.id === id);
export const isIssueId = (id: string): id is IssueId => ISSUES.some((i) => i.id === id);

/** Which briefing (route under /issues) holds the evidence for an issue, if one has been written. */
export const BRIEFING_FOR_ISSUE: Partial<Record<IssueId, string[]>> = {
  "cost-of-living": ["consumer-prices"],
  "spending-debt": ["federal-spending"],
  abortion: ["abortion-statistics"],
  "foreign-policy": ["ukraine-assistance"],
};
export const issuesForBriefing = (briefingId: string) =>
  (Object.entries(BRIEFING_FOR_ISSUE) as [IssueId, string[]][]).filter(([, ids]) => ids.includes(briefingId)).map(([i]) => i);

const wordHit = (text: string, kw: string) => text.includes(kw);

/** Issues an item touches, by CRS policy area or title keyword. Sorted by issue order; may be empty. */
export function issuesFor(title: string, policyArea?: string): IssueId[] {
  const t = title.toLowerCase();
  return ISSUES.filter((i) => (policyArea && (i.policyAreas as readonly string[]).includes(policyArea)) || i.keywords.some((k) => wordHit(t, k))).map((i) => i.id);
}

/** Where the official data for each issue lives. These are pointers, not analysis: nothing here has been summarized by Common Ground. */
export const OFFICIAL_DATA: Record<IssueId, { label: string; url: string }[]> = {
  "cost-of-living": [{ label: "BLS Consumer Price Index", url: "https://www.bls.gov/cpi/" }, { label: "BLS: Employment Cost Index and wages", url: "https://www.bls.gov/eci/" }],
  "health-care": [{ label: "CMS National Health Expenditure data", url: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data" }, { label: "Census: Health insurance coverage", url: "https://www.census.gov/topics/health/health-insurance.html" }],
  immigration: [{ label: "DHS Office of Homeland Security Statistics", url: "https://ohss.dhs.gov/" }, { label: "CBP monthly operational updates", url: "https://www.cbp.gov/newsroom/stats" }],
  abortion: [{ label: "CDC reproductive health data", url: "https://www.cdc.gov/reproductive-health/" }],
  "climate-energy": [{ label: "U.S. Energy Information Administration", url: "https://www.eia.gov/" }, { label: "EPA: Greenhouse gas inventory", url: "https://www.epa.gov/ghgemissions" }],
  "spending-debt": [{ label: "Treasury Fiscal Data", url: "https://fiscaldata.treasury.gov/" }, { label: "Congressional Budget Office", url: "https://www.cbo.gov/" }],
  "corruption-ethics": [{ label: "Federal Election Commission data", url: "https://www.fec.gov/data/" }, { label: "Office of Government Ethics", url: "https://www.oge.gov/" }],
  "public-lands": [{ label: "National Park Service visitor use statistics", url: "https://www.nps.gov/subjects/socialscience/visitor-use-statistics.htm" }, { label: "Bureau of Land Management", url: "https://www.blm.gov/" }],
  "foreign-policy": [{ label: "Congressional Research Service reports", url: "https://crsreports.congress.gov/" }, { label: "State Department", url: "https://www.state.gov/" }],
};
