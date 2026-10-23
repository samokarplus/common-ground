/**
 * Connects broad values to real tradeoffs on the Colorado 2026 ballot. Each entry names two values
 * that pull against each other and, per measure, states the tension using the Blue Book's own
 * arguments. No entry predicts which way anyone's values lead, or maps values to parties.
 */
export type Tension = {
  id: string;
  values: [string, string];
  question: string;
  measures: { id: string; how: string }[];
};

export const TENSIONS: Tension[] = [
  {
    id: "access-vs-verification",
    values: ["Easy access to voting", "Confidence in verification"],
    question: "How should a voting system weigh convenience against checks that ballots come from eligible voters?",
    measures: [
      { id: "amendment-84", how: "Supporters stress added verification and public confidence; opponents stress the burden on voters and ballots lost to minor mistakes." },
    ],
  },
  {
    id: "taxpayer-protection-vs-public-investment",
    values: ["Limits on government revenue", "Public investment in shared goals"],
    question: "When should the state keep money it would otherwise refund or not collect, and for what purposes?",
    measures: [
      { id: "proposition-nn", how: "Supporters stress school and child-care needs; opponents stress taxpayer refunds and limits on government growth." },
      { id: "proposition-137", how: "Supporters stress conservation and wildfire funding without raising tax rates; opponents stress forgone refunds and flexibility for other priorities." },
      { id: "amendment-87", how: "Supporters stress funding for education, health care and child care; opponents stress competitiveness and the size of government." },
    ],
  },
  {
    id: "equal-rate-vs-ability-to-pay",
    values: ["Equal treatment of taxpayers", "Fairness by ability to pay"],
    question: "Is a tax fairest when everyone pays the same rate, or when the rate rises with income?",
    measures: [
      { id: "amendment-87", how: "Supporters argue a dollar matters more to a lower earner; opponents argue the flat rate is fair because everyone pays the same share." },
      { id: "proposition-136", how: "Supporters stress keeping the current rate; opponents say it is mainly a legal obstacle to Amendment 87." },
    ],
  },
  {
    id: "public-safety-vs-due-process",
    values: ["Public safety and accountability", "Individual rights and judicial discretion"],
    question: "How should the law balance tougher responses to serious harm against due process, treatment and a judge's room to weigh each case?",
    measures: [
      { id: "proposition-132", how: "Supporters stress deterrence and keeping dealers off the street; opponents stress treatment, overdose help-seeking and prison costs." },
      { id: "proposition-133", how: "Supporters stress the severity of the harm and a definite penalty; opponents stress victims who may be punished and judges' limited discretion." },
      { id: "amendment-81", how: "Supporters stress reporting people charged with serious crimes to federal authorities; opponents stress the presumption of innocence and community trust." },
    ],
  },
  {
    id: "local-control-vs-statewide-rules",
    values: ["Local control and flexibility", "Lasting statewide protections"],
    question: "When should something be fixed in the state constitution, and when should lawmakers and communities decide?",
    measures: [
      { id: "amendment-82", how: "Supporters stress continued access to natural gas; opponents stress climate, air quality and local decision-making." },
      { id: "amendment-83", how: "Supporters stress lasting protection for hunting and fishing; opponents say a constitution should protect fundamental rights, not recreation." },
      { id: "amendment-85", how: "Supporters stress a plain-language standard in the constitution; opponents say current law already covers it and vague wording could cause challenges." },
    ],
  },
  {
    id: "voter-control-vs-process-protection",
    values: ["Voters' freedom to act directly", "Independent, rules-based process"],
    question: "How should a democracy weigh voters' ability to change rules quickly against protecting an independent process?",
    measures: [
      { id: "amendment-86", how: "Supporters stress public participation and keeping partisanship out; opponents stress a new barrier to voters' ability to redraw districts." },
    ],
  },
  {
    id: "protection-vs-autonomy",
    values: ["Protecting young people from irreversible harm or unfairness", "Autonomy, privacy and individual circumstances"],
    question: "How should the law weigh protective rules for minors and for fair competition against individual circumstances and family and medical judgment?",
    measures: [
      { id: "proposition-134", how: "Supporters stress fairness and safety in girls' and women's sports; opponents stress the burden of verifying eligibility and the effect on students' inclusion." },
      { id: "proposition-135", how: "Supporters stress maturity, long-term data and caution; opponents stress medical decisions by patients, families and providers and the breadth of the ban." },
    ],
  },
];
