/**
 * Debate maps: structured, source-grounded comparisons of the strongest arguments on a question.
 * Facts come only from the official Colorado Blue Book (an official nonpartisan publication).
 * Arguments are attributed to the people who made them; they are claims, not findings.
 */
import { z } from "zod";

export const CLAIM_TYPES = ["empirical", "value", "forecast", "definition"] as const;
export const CLAIM_TYPE_LABEL: Record<(typeof CLAIM_TYPES)[number], string> = {
  empirical: "Factual question (can be checked against evidence)",
  forecast: "Prediction (uncertain until it happens)",
  value: "Value judgment (how to weigh what matters)",
  definition: "Definition or framing (what words should mean)",
};

const Https = z.string().url().startsWith("https://");

export const DebateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  question: z.string().min(1),
  relatedMeasureId: z.string(),
  framing: z.string().min(1),
  /** Checked facts both sides can accept, each with an official source. */
  facts: z.array(z.object({ text: z.string().min(1), sourceUrl: Https, sourceLabel: z.string().min(1) })).min(2),
  sides: z
    .array(
      z.object({
        label: z.string().min(1),
        arguments: z
          .array(
            z.object({
              text: z.string().min(1),
              type: z.enum(CLAIM_TYPES),
              /** What would settle or inform this claim, and whether the official source quantifies it. */
              evidenceNote: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .length(2),
  agreements: z.array(z.string()).min(1),
  uncertainties: z.array(z.string()).min(1),
  misconceptions: z.array(z.object({ myth: z.string(), correction: z.string(), sourceUrl: Https })).min(1),
  reflection: z.array(z.string()).min(2),
});
export type Debate = z.infer<typeof DebateSchema>;

const BB = "https://content.leg.colorado.gov/sites/default/files/2026-blue-book-en-accessible.pdf";
const bb = (page: string) => ({ sourceUrl: BB, sourceLabel: `2026 Colorado Blue Book, ${page}` });

export const DEBATES: Debate[] = [
  {
    id: "mail-ballot-id",
    question: "Should Colorado require ID information on mail ballots, in addition to a signature?",
    relatedMeasureId: "amendment-84",
    framing:
      "Amendment 84 would add a second check to mail ballots in federal and statewide elections. This map separates what is documented from what each side predicts and values.",
    facts: [
      { text: "In 2024, 92 percent of ballots cast in Colorado were mail ballots.", ...bb("Amendment 84 analysis") },
      {
        text: "Today a mail ballot's envelope signature is compared with the signature on file. If a discrepancy is found, two election judges of different parties review it, and the voter is contacted and has until eight days after Election Day to confirm.",
        ...bb("Amendment 84 analysis"),
      },
      {
        text: "The measure would also require the last four digits of a Social Security number, Colorado driver's license number or Colorado ID number. Voters with a missing or mismatched number would be contacted and could fix it within eight days.",
        ...bb("Amendment 84 analysis"),
      },
      {
        text: "The Blue Book estimates the measure would raise state and local spending by up to $2.7 million in 2026-27 and about $1.2 million a year after that.",
        ...bb("Amendment 84 fiscal impact"),
      },
    ],
    sides: [
      {
        label: "Supporters of requiring ID information",
        arguments: [
          {
            text: "Government ID numbers are more consistent and less subjective than comparing signatures.",
            type: "empirical",
            evidenceNote: "Testable by comparing error and rejection rates of the two methods; the Blue Book does not give such data.",
          },
          {
            text: "Most voters already have an eligible ID or know their Social Security number, and anyone without one can vote in person.",
            type: "empirical",
            evidenceNote: "Depends on how many mail voters lack all three numbers; the Blue Book gives no count.",
          },
          {
            text: "An added check promotes public confidence that ineligible ballots will not be counted.",
            type: "value",
            evidenceNote: "Confidence is partly measurable by surveys, but how much weight it deserves is a judgment about priorities.",
          },
        ],
      },
      {
        label: "Opponents of requiring ID information",
        arguments: [
          {
            text: "The current signature process is already effective and secure, and the measure adds a burden without meaningfully improving security.",
            type: "empirical",
            evidenceNote: "Depends on how often ineligible ballots are submitted and caught under each system; the Blue Book does not quantify this.",
          },
          {
            text: "Eligible voters' ballots could go uncounted because of minor mistakes, and voters with privacy concerns or no ID may stop using mail ballots.",
            type: "forecast",
            evidenceNote: "A prediction. Past rates of ballot-cure problems and behavior in other places could inform it; the Blue Book gives no estimate.",
          },
          {
            text: "Convenient access to mail voting should not be traded for marginal verification gains.",
            type: "value",
            evidenceNote: "A judgment about how to balance access against verification.",
          },
        ],
      },
    ],
    agreements: [
      "Both sides want only eligible voters' ballots counted.",
      "Both sides accept that voters can vote in person, and the measure does not change in-person ID rules.",
    ],
    uncertainties: [
      "The Blue Book does not report how often ineligible ballots are submitted or caught, so neither side's central factual claim is quantified there.",
      "How many ballots would need correction under the new rule, and how many would go uncorrected, is not estimated.",
    ],
    misconceptions: [
      {
        myth: "Amendment 84 requires photo ID to vote.",
        correction:
          "It asks for the last four digits of an ID or Social Security number written with the mail ballot, plus the signature. A copy of an ID would be needed only if a voter must fix a missing or mismatched number. In-person ID rules are unchanged.",
        sourceUrl: BB,
      },
      {
        myth: "It would end voting by mail.",
        correction: "Every voter would still receive a mail ballot; the measure adds a verification step.",
        sourceUrl: BB,
      },
    ],
    reflection: [
      "Which factual claim matters most to your view, and what evidence would change your mind about it?",
      "Can you state the other side's strongest argument so that someone who holds it would say 'yes, that's what I mean'?",
      "If both a security gain and an access cost are small, which would you weigh more heavily, and why?",
    ],
  },
  {
    id: "graduated-income-tax",
    question: "Should Colorado replace its flat income tax with a graduated one to fund schools, health care and early childhood programs?",
    relatedMeasureId: "amendment-87",
    framing:
      "Amendment 87 changes who pays how much and dedicates the new money to specific purposes. It mixes arithmetic that can be checked with predictions and with disagreements about fairness.",
    facts: [
      {
        text: "Colorado has had a flat income tax since 1987. The current rate is 4.4 percent.",
        ...bb("Amendment 87 analysis"),
      },
      {
        text: "The measure would lower taxes for taxable income below about $500,000 (by at most $325 per taxpayer) and raise them for higher incomes, starting in 2027.",
        ...bb("Amendment 87 analysis"),
      },
      {
        text: "The Blue Book estimates $958.4 million in added revenue in 2026-27 (a half-year) and $1.972 billion in 2027-28, with a maximum of $2.7 billion allowing for forecast error. The money must go to K-12 education, health care, and early childhood care and education.",
        ...bb("Amendment 87 fiscal impact"),
      },
      {
        text: "The new brackets would not be adjusted for inflation, and the measure would not change TABOR refunds.",
        ...bb("Amendment 87 analysis"),
      },
    ],
    sides: [
      {
        label: "Supporters of a graduated tax",
        arguments: [
          {
            text: "It cuts taxes for about 97 percent of taxpayers and raises them only on top earners.",
            type: "empirical",
            evidenceNote: "Checkable arithmetic. The Blue Book's income tables show tax decreases below roughly $510,834 of taxable income and increases above it.",
          },
          {
            text: "A graduated tax is fairer because a dollar of tax is a greater hardship for a lower earner than for a high earner.",
            type: "value",
            evidenceNote: "A judgment about fairness (ability to pay); evidence can inform it but not settle it.",
          },
          {
            text: "The money would protect schools, health care and child care when federal policy changes put programs at risk, and the federal government and 27 other states already use graduated income taxes.",
            type: "forecast",
            evidenceNote: "The count of other states is checkable against state tax records; the effect of the funding on outcomes is a prediction.",
          },
        ],
      },
      {
        label: "Opponents of a graduated tax",
        arguments: [
          {
            text: "Higher rates on top earners would make Colorado a less competitive place for business and might lead some high earners to leave.",
            type: "forecast",
            evidenceNote: "A prediction about behavior; studies of other states could inform it. The Blue Book offers no estimate.",
          },
          {
            text: "The flat tax is fair because everyone pays the same rate, high earners already pay more dollars, and the state should prioritize the money it already collects.",
            type: "value",
            evidenceNote: "A judgment about what fairness means. Whether current spending is well prioritized is itself contested.",
          },
          {
            text: "Because the brackets are not indexed to inflation, more taxpayers would pay higher rates over time, and the measure permanently expands government.",
            type: "empirical",
            evidenceNote: "The lack of indexing is stated in the Blue Book; how many people would cross thresholds depends on future wages and inflation.",
          },
        ],
      },
    ],
    agreements: [
      "Both sides accept the Blue Book's revenue estimates as the starting point; they disagree about whether raising that much is good policy.",
      "Both sides say they want effective public services and a healthy economy; they differ on the means.",
    ],
    uncertainties: [
      "Actual revenue depends on the economy and on how taxpayers respond, and could be above or below the estimates.",
      "The legislature, not the measure, decides how the new money is split among the three named purposes.",
      "If Amendment 87 and Proposition 136 both pass, the Blue Book says the outcome is unclear and would be resolved by the legislature or a court.",
    ],
    misconceptions: [
      {
        myth: "Amendment 87 raises income taxes for everyone.",
        correction: "By the Blue Book's analysis it lowers taxes for taxable incomes below roughly $500,000 to $510,834 and raises them above that.",
        sourceUrl: BB,
      },
      {
        myth: "Amendment 87 changes TABOR refunds.",
        correction: "The Blue Book says the measure has no effect on current TABOR refunds or refund mechanisms; it exempts the new revenue from the TABOR limit.",
        sourceUrl: BB,
      },
    ],
    reflection: [
      "Which parts of this debate are arithmetic, which are predictions, and which are about fairness?",
      "What evidence about high earners' behavior would you want, and who is best placed to supply it?",
      "Would your view change if the money were not dedicated to specific purposes, or if brackets were indexed to inflation?",
    ],
  },
  {
    id: "keep-and-spend-education",
    question: "Should Colorado let the state keep revenue above the TABOR limit, up to a new limit, to fund schools and children's programs?",
    relatedMeasureId: "proposition-nn",
    framing:
      "Proposition NN does not change tax rates. It changes what happens to revenue the state has already collected above the constitutional limit. Whether that counts as a 'tax increase' is itself part of the dispute.",
    facts: [
      {
        text: "Under current law, revenue above the TABOR limit must be refunded to taxpayers. Voters can allow the state to keep it.",
        ...bb("Proposition NN analysis"),
      },
      {
        text: "The measure would let the state keep revenue up to a new limit tied to past K-12 education spending. In the first year the limit would be up to $4.6 billion above the current limit, but the state is estimated to actually keep about $500 million.",
        ...bb("Proposition NN analysis"),
      },
      {
        text: "The Blue Book estimates TABOR refunds would fall by $329.9 million in 2026-27 and $521.0 million in 2027-28, eliminating refunds in those years.",
        ...bb("Proposition NN fiscal impact"),
      },
      {
        text: "Retained money would go to K-12 education and children's programs for ten years (about $110 million for teacher pay, class sizes and career courses in the first year, $220 million in the second), and afterward to K-12 education and other purposes set by the legislature.",
        ...bb("Proposition NN analysis"),
      },
    ],
    sides: [
      {
        label: "Supporters of Proposition NN",
        arguments: [
          {
            text: "Colorado schools face a funding shortfall of about $3.5 billion (roughly $4,000 per pupil), according to a state study cited by supporters.",
            type: "empirical",
            evidenceNote: "Checkable against the cited state study; whether the 'shortfall' standard is the right benchmark is debated.",
          },
          {
            text: "The measure redirects money the state already collects to teacher pay, smaller classes and early childhood programs, with reporting requirements.",
            type: "empirical",
            evidenceNote: "The spending rules and reporting duties are in the Blue Book analysis; their effect on outcomes is not.",
          },
          {
            text: "The revenue limit does not keep pace with the rising cost of educating and caring for children, so relief is overdue.",
            type: "value",
            evidenceNote: "A judgment about whether the TABOR formula should accommodate those costs.",
          },
        ],
      },
      {
        label: "Opponents of Proposition NN",
        arguments: [
          {
            text: "It is effectively a tax increase because it permanently eliminates or reduces TABOR refunds, which opponents regard as a taxpayer right.",
            type: "definition",
            evidenceNote: "No tax rate changes; the dispute is whether forgone refunds should be called a tax increase. The refund amounts are in the Blue Book.",
          },
          {
            text: "TABOR was written to protect taxpayers against unchecked government growth, so exceptions to its refunds should be rare.",
            type: "value",
            evidenceNote: "A judgment about how strongly to protect limits on government revenue versus other priorities.",
          },
          {
            text: "School funding rose about 25 percent over five years while enrollment declined, so the state should show it has exhausted waste reduction first.",
            type: "empirical",
            evidenceNote: "Checkable against state budget and enrollment data; what counts as waste is contested.",
          },
          {
            text: "Over time the measure would let the state keep over $5 billion a year at families' expense.",
            type: "forecast",
            evidenceNote: "The Blue Book says revenue is not expected to reach the new limit for at least five to ten years, so this is a long-range projection.",
          },
        ],
      },
    ],
    agreements: [
      "Both sides agree the measure changes refunds and retained revenue, not tax rates.",
      "Both sides frame the question around what Colorado's families and children need; they differ on who should hold the money and under what limits.",
    ],
    uncertainties: [
      "Long-run effects depend on the economy; the Blue Book says forecasts beyond the next several years are uncertain.",
      "Refund effects vary year to year: some years there is no impact, and in others refunds fall by over $1,000 per taxpayer.",
    ],
    misconceptions: [
      {
        myth: "Proposition NN raises income or sales tax rates.",
        correction: "It does not change tax rates. It changes how much already-collected revenue the state keeps instead of refunding.",
        sourceUrl: BB,
      },
      {
        myth: "Proposition NN would take the state's whole budget for schools.",
        correction: "It sets a new revenue limit and dedicated spending categories; amounts depend on how much revenue is collected and retained.",
        sourceUrl: BB,
      },
    ],
    reflection: [
      "Is forgone refund money best understood as taxpayers' money the state holds, or as state revenue that voters may choose to keep? Why?",
      "What evidence would show whether extra school funding changes outcomes?",
      "Which of the two sides' strongest empirical claims could you check yourself, and where would you look?",
    ],
  },
];

export const debateById = (id: string) => DEBATES.find((d) => d.id === id);
