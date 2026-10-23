/**
 * One way to look at what the federal government is doing: laws and bills from Congress, presidential
 * documents, and agency rules and notices, each placed on the same ladder of stages. The ladder says how far a
 * thing has gotten, never whether it is good policy, and keeps executive orders, bills and rules distinct.
 */
import type { Bill } from "./congress.ts";

export const STAGES = [
  { id: "introduced", label: "Introduced", means: "A member of Congress formally filed a bill. Most bills never go further.", notThis: "Not a law and not a vote." },
  { id: "passed-one-chamber", label: "Passed one chamber", means: "The House or the Senate passed it. The other chamber has not agreed to the same text.", notThis: "Still not a law." },
  { id: "passed-congress", label: "Passed Congress", means: "Both chambers agreed to the same text and it is on its way to the President.", notThis: "Not yet signed, so not yet a law." },
  { id: "enacted", label: "Signed into law", means: "The President signed it (or Congress overrode a veto) and it became a public law.", notThis: "A law can take effect later or need agency rules before it changes anything." },
  { id: "executive-action", label: "Presidential action", means: "A president signed an executive order or other presidential document. It directs the executive branch.", notThis: "Not a law passed by Congress; it cannot override a statute and a later president can revoke it." },
  { id: "proposed-rule", label: "Proposed rule", means: "An agency published a proposed regulation, usually with a public comment period.", notThis: "Not in force. It may change or be withdrawn." },
  { id: "final-rule", label: "Final rule", means: "An agency published a final regulation. It takes effect on its stated effective date.", notThis: "Publication and effective date can differ." },
  { id: "notice", label: "Agency notice", means: "An agency published a notice: meetings, applications, information collections and similar.", notThis: "Usually routine; not a new rule." },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export type GovAction = {
  id: string;
  kind: "bill" | "law" | "executive-order" | "presidential-document" | "proposed-rule" | "final-rule" | "notice";
  branch: "Congress" | "President" | "Agencies";
  stage: StageId;
  title: string;
  date: string; // YYYY-MM-DD of the most relevant official date
  dateLabel: string;
  agency?: string;
  topic?: string;
  detail: string; // short factual status line
  href: string; // in-app detail route
  sourceUrl: string; // official source
  commentsCloseOn?: string;
  effectiveOn?: string;
};

export type FrRecord = {
  document_number: string;
  type: string;
  title: string;
  publication_date: string;
  signing_date?: string | null;
  executive_order_number?: string | number | null;
  comments_close_on?: string | null;
  effective_on?: string | null;
  html_url: string;
  agencies: { name?: string; raw_name?: string }[];
};

const TYPE_LABEL: Record<string, string> = { introduced: "Introduced", "in-committee": "In committee" };
const BILL_TYPE: Record<string, string> = { hr: "H.R.", s: "S.", hjres: "H.J.Res.", sjres: "S.J.Res." };

export function fromBill(b: Bill): GovAction {
  const date = b.latestAction?.date ?? b.introducedDate;
  const ref = `${BILL_TYPE[b.type] ?? b.type.toUpperCase()} ${b.number}`;
  const base = { branch: "Congress" as const, title: b.title, topic: b.policyArea, href: `/congress/bill/${b.id}`, sourceUrl: b.url, agency: undefined };
  if (b.status === "enacted")
    return { ...base, id: b.id, kind: "law", stage: "enacted", date, dateLabel: "Latest action", detail: `${ref} became ${b.publicLaw ? `Public Law ${b.publicLaw}` : "law"}.` };
  if (b.status === "passed-both-chambers" || b.status === "to-president")
    return { ...base, id: b.id, kind: "bill", stage: "passed-congress", date, dateLabel: "Latest action", detail: `${ref} passed both chambers; no enactment is recorded in the snapshot.` };
  if (b.status === "passed-one-chamber")
    return { ...base, id: b.id, kind: "bill", stage: "passed-one-chamber", date, dateLabel: "Latest action", detail: `${ref} passed one chamber; it is not a law.` };
  return { ...base, id: b.id, kind: "bill", stage: "introduced", date, dateLabel: "Latest action", detail: `${ref}: ${TYPE_LABEL[b.status] ?? "Introduced"}. Not a law.` };
}

const agencyName = (r: FrRecord) => r.agencies.map((a) => a.name || a.raw_name).filter(Boolean)[0];

export function fromFederalRegister(r: FrRecord, today: string): GovAction {
  const agency = agencyName(r);
  const base = { id: r.document_number, title: r.title, agency, href: `/action/${r.document_number}`, sourceUrl: r.html_url, date: (r.signing_date ?? r.publication_date).slice(0, 10), commentsCloseOn: r.comments_close_on ?? undefined, effectiveOn: r.effective_on ?? undefined };
  if (r.type === "Presidential Document") {
    const eo = r.executive_order_number;
    return { ...base, branch: "President", kind: eo ? "executive-order" : "presidential-document", stage: "executive-action", dateLabel: r.signing_date ? "Signed" : "Published", detail: eo ? `Executive Order ${eo}. An order to the executive branch, not a law passed by Congress.` : "A presidential document. Not a law passed by Congress." };
  }
  if (r.type === "Proposed Rule")
    return { ...base, branch: "Agencies", kind: "proposed-rule", stage: "proposed-rule", dateLabel: "Published", detail: r.comments_close_on ? (r.comments_close_on >= today ? `Proposed. Comments open until ${r.comments_close_on}. Not in force.` : `Proposed. Comment period closed ${r.comments_close_on}. Not in force.`) : "Proposed. Not in force." };
  if (r.type === "Rule")
    return { ...base, branch: "Agencies", kind: "final-rule", stage: "final-rule", dateLabel: "Published", detail: r.effective_on ? (r.effective_on <= today ? `Final rule, in effect since ${r.effective_on}.` : `Final rule. Takes effect ${r.effective_on}.`) : "Final rule. No effective date in the snapshot." };
  return { ...base, branch: "Agencies", kind: "notice", stage: "notice", dateLabel: "Published", detail: "Agency notice." };
}

export type Filters = { stage: StageId | "all"; branch: GovAction["branch"] | "all"; agencyOrTopic: string; sinceDays: number; query: string };

export function applyFilters(items: GovAction[], f: Filters, today: string): GovAction[] {
  const q = f.query.trim().toLowerCase();
  const cutoff = f.sinceDays > 0 ? new Date(Date.parse(today + "T00:00:00Z") - f.sinceDays * 86400000).toISOString().slice(0, 10) : "";
  return items.filter(
    (a) =>
      (f.stage === "all" || a.stage === f.stage) &&
      (f.branch === "all" || a.branch === f.branch) &&
      (!f.agencyOrTopic || a.agency === f.agencyOrTopic || a.topic === f.agencyOrTopic) &&
      (!cutoff || a.date >= cutoff) &&
      (!q || `${a.title} ${a.agency ?? ""} ${a.topic ?? ""}`.toLowerCase().includes(q)),
  );
}

export const facets = (items: GovAction[]) => [...new Set(items.flatMap((a) => [a.agency, a.topic]).filter((x): x is string => !!x))].sort();

export function sortNewest(items: GovAction[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
