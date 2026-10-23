/**
 * Editorial connections between Congress, the Federal Register, ballot measures and the Thought Atlas.
 * These are suggestions for further reading, not analysis: a bill's official policy area points to ideas
 * people have argued about, and an idea points to ballot measures where the same tension appears.
 */
export const POLICY_AREA_IDEAS: Record<string, string[]> = {
  Taxation: ["distributive-justice", "property", "egalitarianism"],
  "Economics and Public Finance": ["distributive-justice", "social-choice"],
  "Crime and Law Enforcement": ["punishment", "rule-of-law"],
  "Armed Forces and National Security": ["just-war", "sovereignty"],
  Immigration: ["immigration", "citizenship"],
  "Government Operations and Politics": ["democracy", "separation-of-powers", "political-representation"],
  Congress: ["separation-of-powers", "political-representation"],
  "Civil Rights and Liberties, Minority Issues": ["equal-opportunity", "free-speech", "toleration"],
  "Environmental Protection": ["environmental-ethics"],
  Energy: ["environmental-ethics"],
  Education: ["equal-opportunity"],
  "Social Welfare": ["distributive-justice", "solidarity"],
  Law: ["rule-of-law", "constitutionalism"],
  "International Affairs": ["global-justice", "cosmopolitanism"],
  "Foreign Trade and International Finance": ["global-justice", "cosmopolitanism"],
};

export const ATLAS_BALLOT_LINKS: Record<string, string[]> = {
  "distributive-justice": ["amendment-87", "proposition-nn"],
  egalitarianism: ["amendment-87"],
  legitimacy: ["amendment-84", "amendment-86"],
  trust: ["amendment-84"],
  constitutionalism: ["amendment-82", "amendment-83", "amendment-85", "amendment-86"],
  federalism: ["amendment-81"],
  punishment: ["proposition-132", "proposition-133"],
  "environmental-ethics": ["amendment-82", "proposition-137"],
  "separation-of-powers": ["amendment-86"],
  democracy: ["amendment-85", "amendment-86"],
};

/** Debate maps tied to ballot measures, so a measure can point to its map. */
export const DEBATE_FOR_MEASURE: Record<string, string> = {
  "amendment-84": "mail-ballot-id",
  "amendment-87": "graduated-income-tax",
  "proposition-nn": "keep-and-spend-education",
  "proposition-132": "fentanyl-penalties",
  "amendment-86": "off-cycle-redistricting",
  "amendment-82": "natural-gas-right",
};
