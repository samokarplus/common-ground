/**
 * Side-by-side comparison of candidates. Every entry is a sourced, typed claim (reusing the candidate claim
 * kinds), and each issue carries an editorial note on how the two compare. There is no score, ranking or
 * recommendation, and "not documented here" is never turned into "no position".
 */
import { z } from "zod";
import { CLAIM_KINDS } from "./candidate.ts";
import { ISSUES } from "./issues.ts";

const Https = z.string().url().startsWith("https://");
const PartialDay = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/);

export const EntrySchema = z.object({
  kind: z.enum(CLAIM_KINDS),
  text: z.string().min(1),
  sourceUrl: Https,
  sourceTitle: z.string().min(1),
  sourceDate: PartialDay.optional(),
  retrievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Honest caveat about how the claim was obtained. */
  note: z.string().optional(),
});
export type Entry = z.infer<typeof EntrySchema>;

export const RELATIONS = ["differ", "overlap", "different-focus", "one-undocumented", "neither-documented"] as const;
export type Relation = (typeof RELATIONS)[number];
export const RELATION_LABEL: Record<Relation, string> = {
  differ: "Their stated positions point in different directions",
  overlap: "Their stated positions overlap in part",
  "different-focus": "They address different parts of the issue",
  "one-undocumented": "Only one has a documented statement here",
  "neither-documented": "Nothing documented here for either",
};

const Person = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), name: z.string(), party: z.string(), role: z.string(), website: Https, about: z.array(EntrySchema).min(1) });
const IssueBlock = z.object({
  issue: z.enum(ISSUES.map((i) => i.id) as [string, ...string[]]),
  relation: z.enum(RELATIONS),
  relationNote: z.string().min(20),
  positions: z.record(z.string(), z.array(EntrySchema)),
});

export const ComparisonSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    office: z.string(),
    electionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    summary: z.string(),
    people: z.array(Person).length(2),
    issues: z.array(IssueBlock).min(1),
    limitations: z.array(z.string()).min(2),
    review: z.object({ status: z.enum(["machine-checked", "human-reviewed"]), reviewer: z.string().optional(), reviewedOn: z.string().optional() }),
  })
  .superRefine((c, ctx) => {
    const ids = c.people.map((p) => p.id);
    const bad = (m: string) => ctx.addIssue({ code: "custom", message: m });
    const seen = new Set<string>();
    for (const b of c.issues) {
      if (seen.has(b.issue)) bad(`Duplicate issue ${b.issue}`);
      seen.add(b.issue);
      if (Object.keys(b.positions).sort().join() !== [...ids].sort().join()) bad(`${b.issue}: positions must list exactly ${ids.join(", ")}`);
      const n = ids.map((id) => b.positions[id]?.length ?? 0);
      if ((b.relation === "differ" || b.relation === "overlap" || b.relation === "different-focus") && n.some((x) => x === 0)) bad(`${b.issue}: '${b.relation}' needs a documented entry for both people`);
      if (b.relation === "one-undocumented" && n.filter((x) => x === 0).length !== 1) bad(`${b.issue}: 'one-undocumented' needs exactly one empty side`);
      if (b.relation === "neither-documented" && n.some((x) => x > 0)) bad(`${b.issue}: 'neither-documented' cannot have entries`);
    }
    if (c.review.status === "human-reviewed" && !(c.review.reviewer && c.review.reviewedOn)) bad("human-reviewed needs a reviewer and date");
  });
export type Comparison = z.infer<typeof ComparisonSchema>;

export const parseComparison = (raw: unknown): Comparison => ComparisonSchema.parse(raw);

/** Words that would turn information into advice or ranking. Used in tests over editorial text. */
export const ADVICE_WORDS = /\b(should vote|recommend|endorse|best candidate|better candidate|worse|compatib|match score|rank(?:ed|ing)?|ahead of|winner|loser|radical|extreme)\b/i;

export function issueStatusCounts(c: Comparison) {
  return RELATIONS.map((r) => ({ relation: r, count: c.issues.filter((i) => i.relation === r).length })).filter((x) => x.count > 0);
}
