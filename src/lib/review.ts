/**
 * Editorial review queue and decisions. Nothing here ever approves anything by itself: content
 * becomes "human-reviewed" only when a decision file written by a named person is applied with
 * `npm run review:apply`. The browser dashboard can only produce such a file.
 */
import { z } from "zod";
import type { Election } from "./election";
import type { Profile } from "./candidate";

export const DecisionSchema = z
  .object({
    itemId: z.string().min(1),
    decision: z.enum(["approve", "request-changes", "reject"]),
    reviewer: z.string().trim().min(2, "a reviewer name is required"),
    on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().trim().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.decision !== "approve" && !d.note) ctx.addIssue({ code: "custom", message: "a note is required when requesting changes or rejecting" });
  });
export type Decision = z.infer<typeof DecisionSchema>;
export const DecisionFileSchema = z.array(DecisionSchema).min(1);

export type ItemKind = "measure" | "profile" | "debate" | "atlas" | "values" | "guide" | "record" | "pathways" | "explainer" | "briefing" | "comparison" | "annotations";
export type ItemState = "draft-hidden" | "machine-checked" | "human-reviewed" | "changes-requested" | "rejected";

export type ReviewItem = {
  id: string;
  kind: ItemKind;
  title: string;
  href: string;
  state: ItemState;
  sources: { label: string; url: string }[];
  verifiedOn?: string;
  outstanding: string[];
};

/** Latest decision per item. */
export function latestDecisions(log: Decision[]) {
  const m = new Map<string, Decision>();
  for (const d of log) m.set(d.itemId, d);
  return m;
}

function fromLog(id: string, log: Map<string, Decision>): ItemState {
  const d = log.get(id);
  if (!d) return "machine-checked";
  return d.decision === "approve" ? "human-reviewed" : d.decision === "reject" ? "rejected" : "changes-requested";
}

const uniq = (xs: { label: string; url: string }[]) => [...new Map(xs.map((x) => [x.url, x])).values()];

export type QueueInput = {
  election: Election;
  profiles: Profile[];
  debates: { id: string; question: string; facts: { sourceUrl: string; sourceLabel: string }[] }[];
  atlasCount: number;
  /** Evidence briefings, queued for review under their own ids (`briefing:<id>`). */
  briefings?: { id: string; question: string; sourceCheckedOn: string; sources: { label: string; url: string }[]; limitations: string[] }[];
  /** Published candidate comparisons, queued as `comparison:<id>`. */
  comparisons?: { id: string; title: string; sourceUrls: { label: string; url: string }[]; limitations: string[]; asOf: string }[];
  /** Presidential-action explanations drafted by AI, queued as one item. */
  presidentialAnnotations?: { count: number; sources: { label: string; url: string }[] };
  log: Decision[];
  builtOn: string;
};

export function buildQueue(i: QueueInput): ReviewItem[] {
  const log = latestDecisions(i.log);
  const items: ReviewItem[] = [];
  const src = new Map(i.election.sources.map((s) => [s.id, s]));
  for (const m of i.election.measures) {
    const r = m.draft.review;
    const state: ItemState =
      r.status === "reviewed" ? "human-reviewed" : r.status === "source-checked" ? "machine-checked" : r.status === "needs-re-review" ? (log.get(`measure:${m.id}`)?.decision === "request-changes" ? "changes-requested" : "rejected") : "draft-hidden";
    items.push({
      id: `measure:${m.id}`,
      kind: "measure",
      title: `${m.designation}: ${m.shortTitle}`,
      href: `/vote/colorado/measure/${m.id}`,
      state,
      sources: m.sourceIds.flatMap((id) => (src.get(id) ? [{ label: src.get(id)!.title, url: src.get(id)!.url }] : [])),
      verifiedOn: r.checkedOn,
      outstanding: [
        "The full legal text of the measure was not compared with the plain-language summary.",
        "The Spanish Blue Book was screened for matching figures and argument counts only; wording was not compared.",
        ...(m.draft.arguments ? [] : ["No arguments for and against: the official source prints none for this entry."]),
        ...(r.checkNotes ?? []).filter((n) => /Correction|corrected|Replaced|Added/i.test(n)),
      ],
    });
  }
  for (const p of i.profiles) {
    const contest = i.election.contests.find((c) => c.id === p.contestId);
    const areas = new Set(p.claims.map((c) => c.area));
    const missing = ["background", "government-experience", "positions", "voting-record"].filter((a) => !areas.has(a as never));
    const id = `profile:${p.contestId}:${p.name}`;
    items.push({
      id,
      kind: "profile",
      title: `${p.name} (${contest?.office ?? p.contestId})`,
      href: `/vote/colorado/candidate/${p.contestId}/${encodeURIComponent(p.name)}`,
      state: fromLog(id, log),
      sources: uniq([...p.claims.map((c) => ({ label: c.sourceTitle, url: c.sourceUrl })), ...(p.campaignWebsite ? [{ label: "Campaign website", url: p.campaignWebsite }] : [])]),
      verifiedOn: p.lastVerifiedOn,
      outstanding: [
        "Pages were read through a summarizing fetch tool, so every claim is a paraphrase; compare each with its source page.",
        ...(missing.length ? [`No sourced information yet for: ${missing.join(", ")}.`] : []),
        ...(p.claims.some((c) => c.kind === "own-statement") ? ["Own statements are not fact-checked."] : []),
      ],
    });
  }
  for (const d of i.debates) {
    const id = `debate:${d.id}`;
    items.push({
      id,
      kind: "debate",
      title: d.question,
      href: `/debate/maps/${d.id}`,
      state: fromLog(id, log),
      sources: uniq(d.facts.map((f) => ({ label: f.sourceLabel, url: f.sourceUrl }))),
      verifiedOn: i.builtOn,
      outstanding: ["Claim-type tags and evidence notes are Common Ground's editorial judgment.", "Only Blue Book facts are used; no outside studies were consulted."],
    });
  }
  for (const b of i.briefings ?? []) {
    const id = `briefing:${b.id}`;
    items.push({
      id,
      kind: "briefing",
      title: b.question,
      href: `/issues/${b.id}`,
      state: fromLog(id, log),
      sources: uniq(b.sources.map((x) => ({ label: x.label, url: x.url }))),
      verifiedOn: b.sourceCheckedOn,
      outstanding: [
        "Numbers are generated from committed snapshots; compare them with the linked original tables.",
        "Plain-language wording, 'what people disagree about' and the factual/values split are editorial judgments.",
        ...b.limitations.slice(0, 3),
      ],
    });
  }
  for (const c of i.comparisons ?? []) {
    const id = `comparison:${c.id}`;
    items.push({ id, kind: "comparison", title: c.title, href: `/compare/${c.id}`, state: fromLog(id, log), sources: uniq(c.sourceUrls), verifiedOn: c.asOf, outstanding: ["Campaign statements were read through a summarizing fetch tool, so each is a paraphrase; compare it with the page.", "Dated examples that come from a candidate's own posts were not checked against legislative records.", ...c.limitations.slice(0, 2)] });
  }
  if (i.presidentialAnnotations)
    items.push({ id: "annotations:presidential", kind: "annotations", title: `Presidential action explanations (${i.presidentialAnnotations.count} drafts)`, href: "/government/president", state: fromLog("annotations:presidential", log), sources: uniq(i.presidentialAnnotations.sources), verifiedOn: i.builtOn, outstanding: ["Each explanation was summarized by AI from the official text; compare it with the document.", "'Uncertain' lists and stage notes are editorial judgments.", "Whether any order has been challenged in court was not checked."] });
  const single = (id: string, kind: ItemKind, title: string, href: string, sources: { label: string; url: string }[], outstanding: string[]) =>
    items.push({ id, kind, title, href, state: fromLog(id, log), sources, verifiedOn: i.builtOn, outstanding });
  single("atlas:all", "atlas", `Thought Atlas (${i.atlasCount} ideas)`, "/atlas", [{ label: "Stanford Encyclopedia of Philosophy (linked per idea)", url: "https://plato.stanford.edu/" }], [
    "Definitions, disagreements, examples, context and readings are editorial drafts, not peer reviewed.",
    "The original 19 nodes lack the newer fields.",
  ]);
  single("values:tradeoffs", "values", "Values Explorer: real ballot tradeoffs", "/values", [], ["Tradeoff wording is editorial and built from the Blue Book's arguments.", "Fictional scenarios have not been reviewed."]);
  single("guide:judicial", "guide", "Judicial retention guide", "/vote/colorado/judges", [{ label: "Colorado Politics, Oct. 16, 2026 (press report)", url: "https://www.coloradopolitics.com/2026/10/16/judicial-retention-judges-on-the-ballot-in-2026/" }], [
    "The official evaluation site could not be opened; the process description was assembled from search excerpts and press coverage.",
    "No individual judge's recommendation is shown.",
  ]);
  single("record:hr1", "record", "Promises, votes and outcomes: H.R. 1 example", "/chain", [{ label: "Congress.gov: H.R. 1", url: "https://www.congress.gov/bill/119th-congress/house-bill/1" }], [
    "Built from official bill-status data; no promise, implementation or outcome is asserted.",
  ]);
  single("pathways:all", "pathways", "Pathways", "/paths", [], ["Links are checked by tests; the 'why' sentences are editorial."]);
  single("explainer:election-process", "explainer", "How Colorado elections work", "/vote/colorado/how-elections-work", [], ["General explanations written by Common Ground; compare with the Secretary of State's voter guide."]);
  return items;
}

export type ApplyResult = { election: Election; log: Decision[]; applied: string[]; errors: string[] };

/** Apply human decisions. Pure: the caller decides whether to write the result. */
export function applyDecisions(election: Election, log: Decision[], decisions: Decision[], knownIds: string[]): ApplyResult {
  const next = structuredClone(election) as Election;
  const errors: string[] = [];
  const applied: string[] = [];
  const known = new Set(knownIds);
  for (const d of decisions) {
    if (!known.has(d.itemId)) {
      errors.push(`unknown item: ${d.itemId}`);
      continue;
    }
    if (d.itemId.startsWith("measure:")) {
      const m = next.measures.find((x) => x.id === d.itemId.slice(8));
      if (!m) {
        errors.push(`unknown measure: ${d.itemId}`);
        continue;
      }
      const r = m.draft.review;
      if (d.decision === "approve") {
        r.status = "reviewed";
        r.reviewer = d.reviewer;
        r.reviewedOn = d.on;
      } else {
        r.checkNotes = [...(r.checkNotes ?? []), `${d.decision === "reject" ? "Rejected" : "Changes requested"} by ${d.reviewer} on ${d.on}: ${d.note}`];
        r.status = "needs-re-review";
        delete r.reviewer;
        delete r.reviewedOn;
      }
    }
    applied.push(d.itemId);
  }
  const accepted = decisions.filter((d) => applied.includes(d.itemId));
  return { election: next, log: [...log, ...accepted], applied, errors };
}
