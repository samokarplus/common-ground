/**
 * Promises, votes and outcomes: a record is a chain of seven distinct stages. Each stage is either
 * documented with a dated primary source or explicitly marked "not documented here". There is no
 * score, rating or truth label, and no stage is inferred from another.
 */
import { z } from "zod";

export const STAGES = ["promise", "proposal", "bill-introduced", "vote", "law-enacted", "implemented", "outcome"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_INFO: Record<Stage, { label: string; question: string }> = {
  promise: { label: "A documented public promise", question: "Did someone publicly commit to this, in their own words, and where?" },
  proposal: { label: "A proposed policy", question: "What specific policy was proposed, and by whom?" },
  "bill-introduced": { label: "A bill introduced", question: "Was legislation formally introduced, and by whom?" },
  vote: { label: "A vote cast", question: "Who voted, in which chamber, and what was the recorded result?" },
  "law-enacted": { label: "A law enacted", question: "Did it become law, and when?" },
  implemented: { label: "A policy implemented", question: "Did agencies carry it out, through which rules or programs?" },
  outcome: { label: "An observed outcome", question: "What changed afterward, as measured by independent sources? Causes are rarely simple." },
};

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Https = z.string().url().startsWith("https://");

const Event = z.object({
  date: Day,
  actor: z.string().min(1),
  /** The institutional role in which the actor acted, e.g. "U.S. House of Representatives". */
  role: z.string().min(1),
  what: z.string().min(1),
  sourceUrl: Https,
  sourceTitle: z.string().min(1),
});

const Step = z.discriminatedUnion("status", [
  z.object({ stage: z.enum(STAGES), status: z.literal("documented"), events: z.array(Event).min(1), retrievedOn: Day }),
  z.object({ stage: z.enum(STAGES), status: z.literal("not-documented"), why: z.string().min(10) }),
]);

export const ChainSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    scope: z.string().min(1),
    steps: z.array(Step),
    cautions: z.array(z.string()).min(1),
  })
  .superRefine((c, ctx) => {
    const got = c.steps.map((s) => s.stage);
    if (got.join() !== STAGES.join()) ctx.addIssue({ code: "custom", message: "a chain must list all seven stages once, in order" });
  });
export type Chain = z.infer<typeof ChainSchema>;

const CG = "https://www.congress.gov/bill/119th-congress/house-bill/1";

export const CHAINS: Chain[] = [
  ChainSchema.parse({
    id: "hr1-119",
    title: "H.R. 1 (119th Congress): from introduction to law",
    scope:
      "This example traces only the legislative record of one bill, using the official GovInfo bill-status data. It makes no claim about anyone's promises, the bill's merits, or its effects.",
    steps: [
      { stage: "promise", status: "not-documented", why: "No public promise was gathered for this example. A promise would be added only with a dated, primary-source quotation and an explanation of why it is linked to this bill." },
      { stage: "proposal", status: "not-documented", why: "The bill text is the proposal. A separate proposal stage (for example a budget resolution or campaign plan) was not traced here." },
      {
        stage: "bill-introduced",
        status: "documented",
        retrievedOn: "2026-10-22",
        events: [
          { date: "2025-05-20", actor: "Rep. Jodey C. Arrington (R-TX-19)", role: "Sponsor, U.S. House of Representatives", what: "Introduced H.R. 1, titled 'An act to provide for reconciliation pursuant to title II of H. Con. Res. 14'.", sourceUrl: CG, sourceTitle: "Congress.gov: H.R. 1, 119th Congress" },
        ],
      },
      {
        stage: "vote",
        status: "documented",
        retrievedOn: "2026-10-22",
        events: [
          { date: "2025-05-22", actor: "U.S. House of Representatives", role: "Chamber of Congress", what: "Passed the House by yeas and nays, 215 to 214 with 1 present (Roll no. 145).", sourceUrl: "https://clerk.house.gov/evs/2025/roll145.xml", sourceTitle: "House Clerk: Roll no. 145" },
          { date: "2025-07-01", actor: "U.S. Senate", role: "Chamber of Congress", what: "Passed the Senate with an amendment, 51 to 50 (Record Vote Number 372).", sourceUrl: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00372.xml", sourceTitle: "Senate roll call vote 372" },
          { date: "2025-07-03", actor: "U.S. House of Representatives", role: "Chamber of Congress", what: "Agreed to the Senate amendment by recorded vote, 218 to 214 (Roll no. 190).", sourceUrl: "https://clerk.house.gov/evs/2025/roll190.xml", sourceTitle: "House Clerk: Roll no. 190" },
        ],
      },
      {
        stage: "law-enacted",
        status: "documented",
        retrievedOn: "2026-10-22",
        events: [
          { date: "2025-07-04", actor: "The President", role: "Head of the executive branch", what: "Signed by the President and became Public Law No. 119-21.", sourceUrl: CG, sourceTitle: "Congress.gov: H.R. 1, 119th Congress (actions)" },
        ],
      },
      { stage: "implemented", status: "not-documented", why: "Implementation happens through agency rules and programs, which this example does not trace. Federal Register documents would be the primary source." },
      { stage: "outcome", status: "not-documented", why: "Outcomes need independent measurement over time, and attributing them to one law is hard. None are asserted here." },
    ],
    cautions: [
      "A vote count shows how members voted on that motion, not why, and procedural votes differ from final passage.",
      "Congress passes laws, the President signs them and agencies carry them out. Responsibility for any later outcome is shared and often contested.",
      "A missing stage means it was not documented here, not that it did not happen.",
    ],
  }),
];
