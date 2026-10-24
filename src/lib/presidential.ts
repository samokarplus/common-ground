/** Parse the White House "Presidential Actions" listing (official source) into plain records. */
export type PresidentialAction = {
  title: string;
  url: string;
  date: string;
  /** Category labels exactly as the White House assigns them, e.g. "Executive Orders". */
  categories: string[];
};

const decode = (s: string) =>
  s
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&#039;|&#8217;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();

export function parseListing(html: string): PresidentialAction[] {
  const out: PresidentialAction[] = [];
  for (const item of html.split(/<li data-wp-key="post-template-item/).slice(1)) {
    const a = item.match(/<h2[^>]*>\s*<a href="(https:\/\/www\.whitehouse\.gov\/presidential-actions\/[^"]+)"[^>]*>([^<]+)<\/a>/);
    const d = item.match(/<time datetime="(\d{4}-\d{2}-\d{2})/);
    if (!a || !d) continue;
    const cats = [...(item.match(/class="taxonomy-category[\s\S]*?<\/div>/)?.[0].matchAll(/rel="tag">([^<]+)</g) ?? [])].map((m) => decode(m[1])).filter((c) => c !== "Presidential Actions");
    out.push({ title: decode(a[2]), url: a[1], date: d[1], categories: cats });
  }
  return out;
}

/** Commemorative proclamations (months, days, weeks). A title heuristic: it can be wrong, so the page says so. */
export const isCeremonial = (a: Pick<PresidentialAction, "title" | "categories">) =>
  a.categories.includes("Proclamations") && /\b(month|day|week|anniversary|observance|remembrance)\b/i.test(a.title) && !/\b(tariff|import|adjusting|duties|duty)\b/i.test(a.title);

export const presidentialKind = (a: PresidentialAction): "executive-order" | "proclamation" | "memorandum" | "other" =>
  a.categories.includes("Executive Orders") ? "executive-order" : a.categories.includes("Proclamations") ? "proclamation" : a.categories.some((c) => /Memorand/i.test(c)) ? "memorandum" : "other";

/** Nominations are personnel actions, not policy; they are left out of the actions timeline. */
export const isPolicyAction = (a: PresidentialAction) => !a.categories.includes("Nominations & Appointments");

/** The White House prints some titles in capitals. Show those in title case; leave mixed-case titles exactly as published. */
export function tidyTitle(t: string): string {
  if (t !== t.toUpperCase() || !/[A-Z]{4}/.test(t)) return t;
  const small = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
  return t
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export const normalizeTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

import { z } from "zod";
export const AnnotationSchema = z.object({
  url: z.string().url().startsWith("https://www.whitehouse.gov/presidential-actions/"),
  number: z.string().nullable(),
  signed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective: z.string().min(1),
  changes: z.array(z.string().min(1)).min(1),
  uncertain: z.array(z.string().min(1)).min(1),
  outcomes: z.string().min(1),
  stageNote: z.string().min(1),
  issues: z.array(z.string()),
  draft: z.object({ by: z.string(), basis: z.string(), humanReviewed: z.boolean(), reviewer: z.string().optional(), reviewedOn: z.string().optional() }),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

/** Every annotation must point at a record in the snapshot, say what is uncertain, and never claim human review without a named reviewer. */
export function validateAnnotations(raw: unknown, actions: PresidentialAction[]): Annotation[] {
  const list = z.array(AnnotationSchema).parse(raw);
  const byUrl = new Map(actions.map((a) => [a.url, a]));
  const seen = new Set<string>();
  for (const a of list) {
    const rec = byUrl.get(a.url);
    if (!rec) throw new Error(`Annotation for a document not in the snapshot: ${a.url}`);
    if (rec.date !== a.signed) throw new Error(`Signed date ${a.signed} does not match the record date ${rec.date}: ${a.url}`);
    if (seen.has(a.url)) throw new Error(`Duplicate annotation: ${a.url}`);
    seen.add(a.url);
    if (a.draft.humanReviewed && !(a.draft.reviewer && a.draft.reviewedOn)) throw new Error(`Human-reviewed needs a reviewer and date: ${a.url}`);
  }
  return list;
}
