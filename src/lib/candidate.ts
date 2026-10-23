/**
 * Candidate profile model. A profile is a list of sourced claims, each typed so a reader can
 * tell a candidate's own statement from a documented action, an independent finding, an
 * allegation, or an opinion. Nothing is inferred from party, and absence is explicit.
 */
import { z } from "zod";

export const CLAIM_KINDS = ["own-statement", "documented-action", "independent-finding", "allegation", "opinion"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const CLAIM_LABEL: Record<ClaimKind, string> = {
  "own-statement": "The candidate's own statement",
  "documented-action": "Documented action (votes, laws signed, official records)",
  "independent-finding": "Independent factual finding",
  allegation: "Allegation (not established)",
  opinion: "Opinion of a third party",
};

export const RESEARCH_AREAS = ["background", "government-experience", "positions", "voting-record", "campaign-website"] as const;
export type ResearchArea = (typeof RESEARCH_AREAS)[number];

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Url = z.string().url().refine((u) => u.startsWith("https://"), "https only");

export const ClaimSchema = z.object({
  kind: z.enum(CLAIM_KINDS),
  area: z.enum(RESEARCH_AREAS),
  text: z.string().min(1),
  sourceUrl: Url,
  sourceTitle: z.string().min(1),
  sourceDate: Day.optional(),
  retrievedOn: Day,
});

export const ProfileSchema = z.object({
  contestId: z.string(),
  name: z.string().min(1),
  campaignWebsite: Url.optional(),
  claims: z.array(ClaimSchema),
  /** Areas a maintainer looked for and could not verify. Distinct from areas never researched. */
  checkedNothingFound: z.array(z.enum(RESEARCH_AREAS)).default([]),
  lastVerifiedOn: Day,
});
export type Profile = z.infer<typeof ProfileSchema>;
export type Claim = z.infer<typeof ClaimSchema>;

export type Completeness = { covered: ResearchArea[]; notFound: ResearchArea[]; unresearched: ResearchArea[] };

export function completeness(p: Profile | undefined): Completeness {
  if (!p) return { covered: [], notFound: [], unresearched: [...RESEARCH_AREAS] };
  const covered = new Set<ResearchArea>(p.claims.map((c) => c.area));
  if (p.campaignWebsite) covered.add("campaign-website");
  const notFound = p.checkedNothingFound.filter((a) => !covered.has(a));
  return {
    covered: RESEARCH_AREAS.filter((a) => covered.has(a)),
    notFound: RESEARCH_AREAS.filter((a) => notFound.includes(a)),
    unresearched: RESEARCH_AREAS.filter((a) => !covered.has(a) && !notFound.includes(a)),
  };
}

/** Profiles must reference real candidates on real contests, with no duplicates. */
export function validateProfiles(
  profiles: unknown,
  contests: { id: string; kind: string; candidates: { name: string }[] }[],
): Profile[] {
  const list = z.array(ProfileSchema).parse(profiles);
  const seen = new Set<string>();
  for (const p of list) {
    const c = contests.find((x) => x.id === p.contestId);
    if (!c) throw new Error(`Profile for unknown contest: ${p.contestId}`);
    if (c.kind === "retention") throw new Error(`Judges get no candidate profiles: ${p.name}`);
    if (!c.candidates.some((x) => x.name === p.name)) throw new Error(`Profile for unknown candidate: ${p.name}`);
    const key = `${p.contestId}:${p.name}`;
    if (seen.has(key)) throw new Error(`Duplicate profile: ${key}`);
    seen.add(key);
  }
  return list;
}
