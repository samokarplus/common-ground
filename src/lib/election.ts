import { z } from "zod";

/*
 * Election data model for Help Me Vote.
 *
 * Rules enforced here (and tested in tests/election.test.mts):
 * - Every record carries sources; drafted explanations are hidden until a human
 *   reviewer marks them "reviewed".
 * - Statewide information is never described as a complete personal ballot.
 * - Dates are calendar dates in the election's time zone.
 */

const CalendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Invalid calendar date");

const HttpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "Must be https");

export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: HttpsUrl,
  kind: z.enum(["official-primary", "official-analysis", "authored-explanation"]),
  retrievedAt: CalendarDate,
});

export const ReviewSchema = z.object({
  /** "source-checked": compared line by line with the official sources by an AI-assisted process; no human editor yet. */
  status: z.enum(["draft", "source-checked", "reviewed", "needs-re-review"]),
  preparedBy: z.string().min(1),
  preparedOn: CalendarDate,
  reviewer: z.string().optional(),
  reviewedOn: CalendarDate.optional(),
  checkedOn: CalendarDate.optional(),
  checkedAgainst: z.array(z.string()).optional(),
  /** What the check changed or could not confirm, kept for the human reviewer. */
  checkNotes: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export const MeasureSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    designation: z.string().min(1),
    shortTitle: z.string().min(1),
    blueBookTitle: z.string().optional(),
    scope: z.enum(["statewide", "district"]),
    district: z.string().optional(),
    kind: z.enum([
      "constitutional",
      "statutory",
      "constitutional-and-statutory",
      "local-issue",
    ]),
    origin: z.enum(["citizen-initiated", "legislative-referral", "district-referral"]),
    initiativeNumber: z.string().optional(),
    referringBill: z.string().optional(),
    threshold: z.enum(["55-percent", "majority"]),
    topic: z.string().min(1),
    officialTextUrl: HttpsUrl,
    moreInfoUrl: HttpsUrl.optional(),
    blueBookPages: z.record(z.string()),
    sourceIds: z.array(z.string()).min(1),
    discrepancies: z.array(z.string()).optional(),
    draft: z.object({
      summary: z.string().min(1),
      yes: z.string().nullable(),
      no: z.string().nullable(),
      fiscal: z.array(z.string()),
      unclear: z.array(z.string()),
      /** Arguments as summarized from the Blue Book's "Arguments For and Against" sections. */
      arguments: z.object({ for: z.array(z.string()), against: z.array(z.string()) }).optional(),
      review: ReviewSchema,
    }),
  })
  .superRefine((m, ctx) => {
    if (m.scope === "district" && !m.district)
      ctx.addIssue({ code: "custom", message: `${m.id}: district measures must name the district` });
    if (m.kind.startsWith("constitutional") && m.threshold !== "55-percent")
      ctx.addIssue({ code: "custom", message: `${m.id}: constitutional amendments need 55 percent` });
    if (m.kind === "statutory" && m.threshold !== "majority")
      ctx.addIssue({ code: "custom", message: `${m.id}: statutory measures pass by majority` });
    if (m.draft.review.status === "reviewed" && !(m.draft.review.reviewer && m.draft.review.reviewedOn))
      ctx.addIssue({ code: "custom", message: `${m.id}: a reviewed explanation needs reviewer and date` });
    if (m.draft.review.status === "source-checked") {
      const r = m.draft.review;
      if (!r.checkedOn || !r.checkedAgainst?.length)
        ctx.addIssue({ code: "custom", message: `${m.id}: a source-checked explanation needs a check date and the sources checked` });
      if (r.reviewer || r.reviewedOn)
        ctx.addIssue({ code: "custom", message: `${m.id}: source-checked content must not claim human review` });
    }
  });

export const CandidateSchema = z.object({
  name: z.string().min(1),
  runningMate: z.string().optional(),
  affiliation: z.string().nullable(),
  status: z.enum(["on-ballot", "write-in", "withdrawn"]),
});

export const ContestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  office: z.string().min(1),
  scope: z.literal("statewide"),
  kind: z.enum(["partisan", "nonpartisan", "retention"]),
  termYears: z.number().int().positive(),
  role: z.string().min(1),
  candidates: z.array(CandidateSchema),
  sourceIds: z.array(z.string()).min(1),
});

export const ElectionSchema = z
  .object({
    id: z.string(),
    state: z.string().length(2),
    jurisdiction: z.string(),
    name: z.string(),
    electionDate: CalendarDate,
    certifiedOn: CalendarDate,
    dataVerifiedAt: z.string().datetime(),
    staleAfterDays: z.number().int().positive(),
    timeZone: z.string(),
    sources: z.array(SourceSchema).min(1),
    /** What was checked, how, when, and what could not be checked. Shown to readers. */
    verificationLog: z
      .array(z.object({ on: CalendarDate, scope: z.string().min(1), method: z.string().min(1), result: z.string().min(1) }))
      .optional(),
    officialLinks: z.array(z.object({ id: z.string(), label: z.string(), url: HttpsUrl })),
    deadlines: z.array(
      z.object({
        date: CalendarDate,
        label: z.string(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        sourceId: z.string(),
      }),
    ),
    measures: z.array(MeasureSchema),
    contests: z.array(ContestSchema),
    notCovered: z.array(z.string()),
    knownGaps: z.array(z.string()),
  })
  .superRefine((e, ctx) => {
    const sourceIds = new Set(e.sources.map((s) => s.id));
    const seen = new Set<string>();
    for (const item of [...e.measures, ...e.contests]) {
      if (seen.has(item.id))
        ctx.addIssue({ code: "custom", message: `Duplicate id ${item.id}` });
      seen.add(item.id);
      for (const s of item.sourceIds)
        if (!sourceIds.has(s))
          ctx.addIssue({ code: "custom", message: `${item.id}: unknown source ${s}` });
    }
    for (const d of e.deadlines) {
      if (!sourceIds.has(d.sourceId))
        ctx.addIssue({ code: "custom", message: `Deadline "${d.label}": unknown source` });
      if (d.date > e.electionDate)
        ctx.addIssue({ code: "custom", message: `Deadline "${d.label}" is after Election Day` });
    }
    if (e.certifiedOn > e.electionDate)
      ctx.addIssue({ code: "custom", message: "Certification after Election Day" });
    for (const c of e.contests) {
      const names = c.candidates.map((x) => x.name.toLowerCase());
      if (new Set(names).size !== names.length)
        ctx.addIssue({ code: "custom", message: `${c.id}: duplicate candidate` });
      if (c.kind === "retention" && c.candidates.some((x) => x.affiliation))
        ctx.addIssue({ code: "custom", message: `${c.id}: retention questions are nonpartisan` });
    }
  });

export type Election = z.infer<typeof ElectionSchema>;
export type Measure = z.infer<typeof MeasureSchema>;
export type Contest = z.infer<typeof ContestSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;

export function parseElection(raw: unknown): Election {
  return ElectionSchema.parse(raw);
}

/**
 * The explanation that may be shown, or null. Plain drafts are never returned. "source-checked"
 * content is shown with a label saying no human editor has reviewed it; only "reviewed" content
 * (named reviewer and date) is shown without that label.
 */
export function publishedExplanation(m: Measure) {
  const s = m.draft.review.status;
  return s === "reviewed" || s === "source-checked" ? m.draft : null;
}

export const isHumanReviewed = (m: Measure) => m.draft.review.status === "reviewed";

/** Calendar date (YYYY-MM-DD) for an instant, in the given IANA time zone. */
export function localDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayDiff(from: string, to: string) {
  return Math.round(
    (Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 86400000,
  );
}

export type DeadlineState = "passed" | "today" | "upcoming";
export function deadlineState(date: string, now: Date, timeZone: string): DeadlineState {
  const today = localDate(now, timeZone);
  if (date < today) return "passed";
  if (date === today) return "today";
  return "upcoming";
}

export function daysUntil(date: string, now: Date, timeZone: string) {
  return dayDiff(localDate(now, timeZone), date);
}

export function electionPhase(e: Election, now: Date) {
  const days = daysUntil(e.electionDate, now, e.timeZone);
  if (days > 0) return { phase: "before" as const, days };
  if (days === 0) return { phase: "election-day" as const, days };
  return { phase: "after" as const, days };
}

export function isStale(e: Pick<Election, "dataVerifiedAt" | "staleAfterDays">, now: Date) {
  return now.getTime() - Date.parse(e.dataVerifiedAt) > e.staleAfterDays * 86400000;
}

export const COVERAGE = {
  verifiedStatewide: {
    label: "On every Colorado ballot",
    detail: "Statewide, so it appears for every Colorado voter. What we checked, and what we could not, is listed under \"How we checked this\" on the Colorado overview.",
  },
  district: {
    label: "Only in some areas",
    detail: "Appears only for voters inside a specific district. Check your official sample ballot.",
  },
  notCovered: {
    label: "Not covered here",
    detail: "Depends on your exact address. Use your official sample ballot.",
  },
  demo: {
    label: "Illustrative demo",
    detail: "Fictional example for learning. Not a real ballot item.",
  },
  sourceChecked: {
    label: "Source-checked, not human-reviewed",
    detail: "Compared with the official Blue Book by Common Ground's AI-assisted process. No human editor has reviewed it yet.",
  },
  awaitingReview: {
    label: "Explanation awaiting review",
    detail: "A plain-language explanation has been drafted but not yet editorially reviewed, so it is not shown.",
  },
} as const;

export function measureCoverage(m: Measure) {
  return m.scope === "district" ? COVERAGE.district : COVERAGE.verifiedStatewide;
}

export const KIND_LABEL: Record<Measure["kind"], string> = {
  constitutional: "Constitutional amendment",
  statutory: "Change to state law (statute)",
  "constitutional-and-statutory": "Constitutional amendment and statute",
  "local-issue": "District ballot issue",
};

export const ORIGIN_LABEL: Record<Measure["origin"], string> = {
  "citizen-initiated": "Citizen initiative (placed by petition)",
  "legislative-referral": "Referred by the state legislature",
  "district-referral": "Referred by a district board",
};

export const THRESHOLD_LABEL: Record<Measure["threshold"], string> = {
  "55-percent": "Needs at least 55% of votes cast to pass",
  majority: "Needs more than 50% of votes cast to pass",
};

/* ---------- Private research guide (browser-only) ---------- */

export const GUIDE_KEY = "cg-vote-guide";
export type GuideFlags = { read?: boolean; research?: boolean; question?: boolean };
export type GuideEntry = GuideFlags & { note?: string };
export type Guide = { version: 1; entries: Record<string, GuideEntry> };

export const emptyGuide = (): Guide => ({ version: 1, entries: {} });

const GuideFileSchema = z.object({
  version: z.literal(1),
  entries: z.record(
    z.object({
      read: z.boolean().optional(),
      research: z.boolean().optional(),
      question: z.boolean().optional(),
      note: z.string().max(5000).optional(),
    }),
  ),
});

/** Parse a stored guide; unknown or malformed data yields an empty guide. Only known item ids are kept. */
export function parseGuide(raw: string | null, knownIds: Iterable<string>): Guide {
  if (!raw) return emptyGuide();
  try {
    const parsed = GuideFileSchema.parse(JSON.parse(raw));
    const known = new Set(knownIds);
    const entries: Guide["entries"] = {};
    for (const [id, entry] of Object.entries(parsed.entries))
      if (known.has(id)) entries[id] = entry;
    return { version: 1, entries };
  } catch {
    return emptyGuide();
  }
}

export function updateGuide(g: Guide, id: string, patch: Partial<GuideEntry>): Guide {
  const next = { ...(g.entries[id] || {}), ...patch };
  const entries = { ...g.entries };
  const empty = !next.read && !next.research && !next.question && !next.note?.trim();
  if (empty) delete entries[id];
  else entries[id] = next;
  return { version: 1, entries };
}

/** Every id a guide entry may use: measures, contests, and each retention judge. */
export function guideItemIds(e: Election) {
  return [
    ...e.measures.map((m) => m.id),
    ...e.contests.map((c) => c.id),
    ...e.contests
      .filter((c) => c.kind === "retention")
      .flatMap((c) => c.candidates.map((x) => `${c.id}:${x.name}`)),
  ];
}

/** What a user can download. Only their own flags and notes plus public item names — no address, no location. */
export function guideExport(g: Guide, e: Election) {
  const name = new Map<string, string>([
    ...e.measures.map((m) => [m.id, `${m.designation}: ${m.shortTitle}`] as [string, string]),
    ...e.contests.map((c) => [c.id, c.office] as [string, string]),
    ...e.contests.flatMap((c) =>
      c.candidates.map((x) => [`${c.id}:${x.name}`, `${x.name} — ${c.office}`] as [string, string]),
    ),
  ]);
  return {
    app: "Common Ground — My Ballot Research Guide",
    election: e.name,
    note: "Your private notes. Common Ground never sees this file.",
    items: Object.entries(g.entries).map(([id, entry]) => ({
      id,
      item: name.get(id) || id,
      read: !!entry.read,
      needToResearch: !!entry.research,
      hasQuestions: !!entry.question,
      note: entry.note || "",
    })),
  };
}

export function guideProgress(g: Guide, ids: string[]) {
  const read = ids.filter((id) => g.entries[id]?.read).length;
  return { read, total: ids.length };
}
