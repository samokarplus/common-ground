import { z } from "zod";
const CalendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + "T12:00:00Z");
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date");
export const DocumentSchema = z.object({
  document_number: z.string(),
  title: z.string(),
  type: z.enum(["Rule", "Proposed Rule", "Notice", "Presidential Document"]),
  abstract: z.string().nullable().optional(),
  html_url: z.string().url(),
  pdf_url: z.string().url().nullable().optional(),
  publication_date: CalendarDate,
  agencies: z.array(
    z.object({ name: z.string().optional(), raw_name: z.string().optional() }),
  ),
  dates: z.string().nullable().optional(),
  effective_on: CalendarDate.nullable().optional(),
  signing_date: CalendarDate.nullable().optional(),
  executive_order_number: z.string().nullable().optional(),
});
export type SourceDocument = z.infer<typeof DocumentSchema>;
export type Action = SourceDocument & {
  retrievedAt: string;
  eventType: string;
  status: string;
  jurisdiction: string;
};
export function classify(
  d: Pick<SourceDocument, "type" | "executive_order_number">,
) {
  if (d.type === "Proposed Rule")
    return { eventType: "RULE_PROPOSED", status: "Proposed rule" };
  if (d.type === "Rule")
    return { eventType: "RULE_FINALIZED", status: "Final rule" };
  if (d.type === "Presidential Document")
    return {
      eventType: d.executive_order_number
        ? "EXECUTIVE_ORDER_SIGNED"
        : "PRESIDENTIAL_DOCUMENT_PUBLISHED",
      status: d.executive_order_number
        ? "Executive order"
        : "Presidential document",
    };
  return { eventType: "NOTICE_PUBLISHED", status: "Agency notice" };
}
export function normalize(raw: unknown, retrievedAt: string): Action {
  const d = DocumentSchema.parse(raw);
  if (new URL(d.html_url).hostname !== "www.federalregister.gov")
    throw new Error("Unexpected source");
  return {
    ...d,
    ...classify(d),
    retrievedAt,
    jurisdiction: "United States · Federal",
  };
}
export type Claim = {
  text: string;
  type: "fact" | "analysis" | "uncertainty" | "value";
  sourceIds: string[];
  passage?: {
    field: "publication_date" | "abstract";
    text: string;
    start: number;
    end: number;
  };
  verified: boolean;
  reviewerStatus: "unreviewed" | "metadata-validated";
};
export function validClaim(c: Claim, docs: Action[]) {
  if (c.type === "uncertainty" || c.type === "value") return true;
  if (c.type === "analysis") return !c.verified;
  return (
    c.sourceIds.length > 0 &&
    !!c.passage &&
    c.passage.start >= 0 &&
    c.passage.end > c.passage.start &&
    c.sourceIds.every((id) => {
      const doc = docs.find((d) => d.document_number === id);
      const passage = c.passage!;
      const source = doc?.[passage.field];
      return (
        typeof source === "string" &&
        source.slice(passage.start, passage.end) === passage.text
      );
    })
  );
}
export function metadataClaims(d: Action): Claim[] {
  return [
    {
      text: `Published on ${d.publication_date}.`,
      type: "fact",
      sourceIds: [d.document_number],
      passage: {
        field: "publication_date",
        text: d.publication_date,
        start: 0,
        end: 10,
      },
      verified: true,
      reviewerStatus: "metadata-validated",
    },
    ...(d.abstract
      ? [
          {
            text: d.abstract,
            type: "fact" as const,
            sourceIds: [d.document_number],
            passage: {
              field: "abstract" as const,
              text: d.abstract,
              start: 0,
              end: d.abstract.length,
            },
            verified: true,
            reviewerStatus: "metadata-validated" as const,
          },
        ]
      : []),
  ];
}
export const DebateInput = z.object({
  position: z.string().trim().min(8).max(4000),
  mode: z.enum([
    "Socratic Coach",
    "Steelman Both Sides",
    "Explain Like I’m New",
    "Policy Tradeoffs",
    "Philosophical Roots",
  ]),
  topic: z.string().trim().max(150),
});
export function coach(position: string, mode: string) {
  const intro = `You wrote: “${position}”`;
  const frames: Record<string, string> = {
    "Socratic Coach":
      "Which term in your claim needs a clearer definition? What observation would tell you whether the policy achieves its goal?",
    "Steelman Both Sides":
      "A strong case for your position starts by naming the harm it would prevent. A strong challenge asks whether the same goal could be achieved with fewer restrictions or unintended effects.",
    "Explain Like I’m New":
      "Separate the goal (what you want to improve), the mechanism (how the policy would work), and the evidence (how you would know it worked).",
    "Policy Tradeoffs":
      "Compare who benefits, who bears the cost, how enforcement works, and whether the decision can be reversed. What alternative uses fewer resources?",
    "Philosophical Roots":
      "Consider three different questions: what rights must be protected, what consequences matter, and what fair treatment requires. These frameworks can reach different conclusions.",
  };
  return [
    { heading: "Your starting point", text: intro },
    { heading: mode, text: frames[mode] },
    {
      heading: "Separate evidence from values",
      text: "Which parts of your position could be tested with evidence? Which are moral commitments you would hold even if the outcome were costly?",
    },
    {
      heading: "Test the assumption",
      text: "What would a thoughtful person who disagrees say you have overlooked? Name the strongest version of that concern in terms they would accept.",
    },
    {
      heading: "A question to take with you",
      text: "What specific evidence would change your mind, and what uncertainty are you willing to live with?",
    },
  ];
}
export const PRIVATE_KEYS = ["cg-values", "cg-debate", "cg-ballot", "cg-saved"];
export function clearPrivate(storage: Pick<Storage, "removeItem">) {
  PRIVATE_KEYS.forEach((k) => storage.removeItem(k));
}
