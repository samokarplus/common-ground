/*
 * Registry of the sources Common Ground uses or plans to use.
 * "integration" says how each source is actually used today. Nothing here is
 * "scripted" means a refresh script exists, not that scheduling has been verified.
 */
export type SourceEntry = {
  id: string;
  name: string;
  publisher: string;
  jurisdiction: string;
  authority: "official-primary" | "official-analysis" | "official-directory";
  url: string;
  format: "REST API (JSON)" | "HTML" | "PDF" | "XLSX" | "XML bulk data";
  access: string;
  updateFrequency: string;
  integration: "scripted" | "browser-live" | "manual-source-checked" | "link-only" | "planned";
  terms: string;
  knownGaps: string;
};

export const SOURCE_REGISTRY: SourceEntry[] = [
  {
    id: "federal-register",
    name: "Federal Register API",
    publisher: "Office of the Federal Register / GPO",
    jurisdiction: "United States · Federal",
    authority: "official-primary",
    url: "https://www.federalregister.gov/developers/documentation/api/v1",
    format: "REST API (JSON)",
    access: "Keyless; CORS allows browser requests",
    updateFrequency: "Each federal business day",
    integration: "scripted",
    terms: "U.S. government work; public domain",
    knownGaps: "Agency rules, notices, and presidential documents only; no bills, court rulings, or state actions.",
  },
  {
    id: "co-sos-measures",
    name: "Colorado amendments and propositions on the 2026 ballot",
    publisher: "Colorado Secretary of State",
    jurisdiction: "Colorado",
    authority: "official-primary",
    url: "https://www.coloradosos.gov/pubs/elections/Initiatives/ballot/contacts/2026.html",
    format: "HTML",
    access: "Public web page; no API",
    updateFrequency: "As measures are certified or committees register",
    integration: "manual-source-checked",
    terms: "Public government information",
    knownGaps: "Committee lists noted as not final; check TRACER for campaign finance.",
  },
  {
    id: "co-sos-candidates",
    name: "Colorado 2026 General Election official candidate list",
    publisher: "Colorado Secretary of State",
    jurisdiction: "Colorado",
    authority: "official-primary",
    url: "https://www.coloradosos.gov/pubs/elections/vote/generalCandidates.html",
    format: "XLSX",
    access: "Public page with downloadable XLSX",
    updateFrequency: "Updated after certification and withdrawals",
    integration: "manual-source-checked",
    terms: "Public government information",
    knownGaps: "Withdrawals shown with strikethrough formatting; district races require address-level lookup.",
  },
  {
    id: "co-blue-book",
    name: "2026 State Ballot Information Booklet (Blue Book)",
    publisher: "Colorado Legislative Council Staff",
    jurisdiction: "Colorado",
    authority: "official-analysis",
    url: "https://content.leg.colorado.gov/publications/2026-statewide-ballot-information-booklet",
    format: "PDF",
    access: "Public PDF (English and Spanish, audio edition available)",
    updateFrequency: "Once per election, with possible corrections",
    integration: "manual-source-checked",
    terms: "Public government information",
    knownGaps: "Statewide measures only, plus district notices; judges listed by area.",
  },
  {
    id: "co-fiscal-statements",
    name: "2026 fiscal impact statements",
    publisher: "Colorado Legislative Council Staff",
    jurisdiction: "Colorado",
    authority: "official-analysis",
    url: "https://content.leg.colorado.gov/publications/2026-fiscal-impact-statements",
    format: "PDF",
    access: "Public PDF",
    updateFrequency: "Once per election",
    integration: "manual-source-checked",
    terms: "Public government information",
    knownGaps: "Estimates, not guarantees.",
  },
  {
    id: "co-judicial-performance",
    name: "Judicial performance evaluations",
    publisher: "Colorado Office of Judicial Performance Evaluation",
    jurisdiction: "Colorado",
    authority: "official-analysis",
    url: "https://judicialperformance.colorado.gov/",
    format: "HTML",
    access: "Public web pages",
    updateFrequency: "Each retention election",
    integration: "link-only",
    terms: "Public government information",
    knownGaps: "Common Ground links to evaluations and does not summarize or rate judges.",
  },
  {
    id: "co-govote",
    name: "GoVoteColorado",
    publisher: "Colorado Secretary of State",
    jurisdiction: "Colorado",
    authority: "official-directory",
    url: "https://www.govotecolorado.gov/",
    format: "HTML",
    access: "Voter-facing lookup; requires personal information entered on the official site",
    updateFrequency: "Live",
    integration: "link-only",
    terms: "Official voter services; Common Ground never handles this data",
    knownGaps: "Not integrated by design, to keep personal voter data off Common Ground.",
  },
  {
    id: "congress-gov",
    name: "Congress.gov API",
    publisher: "Library of Congress",
    jurisdiction: "United States · Federal",
    authority: "official-primary",
    url: "https://api.congress.gov/",
    format: "REST API (JSON)",
    access: "Free API key required; key must never be shipped in browser code",
    updateFrequency: "Daily",
    integration: "planned",
    terms: "Public data; API terms apply",
    knownGaps: "Not yet integrated. Plan: maintainer-run snapshot with the key kept in a local environment variable.",
  },
  {
    id: "govinfo-billstatus",
    name: "GovInfo bulk data — Bill Status",
    publisher: "U.S. Government Publishing Office",
    jurisdiction: "United States · Federal",
    authority: "official-primary",
    url: "https://www.govinfo.gov/bulkdata/BILLSTATUS",
    format: "XML bulk data",
    access: "Keyless bulk download",
    updateFrequency: "Several times daily",
    integration: "scripted",
    terms: "U.S. government work; public domain",
    knownGaps: "Refresh script exists (npm run refresh:congress) but is run by hand until the owner applies docs/proposed-refresh-workflow.yml (needs a token with workflow scope). Snapshot holds only the 40 most recently updated bills of each type (H.R., S., H.J.Res., S.J.Res.) of the 119th Congress; no concurrent/simple resolutions; vote tallies not parsed; status is derived from the action log.",
  },
];
