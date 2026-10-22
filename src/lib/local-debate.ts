import { DebateInput, coach } from "./domain.ts";
const frames = [
  {
    words: /privacy|surveillance|camera|data/i,
    support:
      "A case for narrowly scoped public-safety tools is that preventing serious harm can justify some shared constraints, provided necessity and oversight are demonstrated.",
    challenge:
      "A serious challenge is that a useful tool may still concentrate power, chill lawful activity, or be hard to constrain after adoption. Ask whether a less intrusive option meets the same goal.",
  },
  {
    words: /climate|environment|emission|energy/i,
    support:
      "A case for collective environmental action is that people affected by a decision may be unable to protect themselves individually, including future generations.",
    challenge:
      "A serious challenge concerns who bears immediate costs, how uncertainty is handled, and whether a particular instrument achieves its goal more fairly than alternatives.",
  },
  {
    words: /health|care|medical/i,
    support:
      "A case for shared health protections is that vulnerability and access to care can depend on circumstances outside individual control.",
    challenge:
      "A serious challenge concerns autonomy, resource constraints, and whether one approach restricts choice or displaces other important needs.",
  },
  {
    words: /econom|tax|spend|fund|wage|budget/i,
    support:
      "A case for public investment is that some opportunities and shared services are difficult to create through individual action alone.",
    challenge:
      "A serious challenge asks whether the expected benefit justifies the cost, what incentives change, and which alternative use of resources is being forgone.",
  },
  {
    words: /speech|libert|right|protest/i,
    support:
      "A case for protecting broad liberties is that people need room to disagree, challenge authority, and pursue their own conception of a good life.",
    challenge:
      "A serious challenge asks where one person’s liberty imposes a harm on others and what clear, general rule could justify a limit without favoritism.",
  },
];
export async function localDebate(input: unknown) {
  const parsed = DebateInput.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Write a position of 8–4,000 characters and choose a mode.",
    );
  const { position, mode, topic } = parsed.data;
  const turns = coach(position, mode);
  const pack = frames.find((f) => f.words.test(topic + " " + position));
  if (pack)
    turns.splice(
      2,
      0,
      {
        heading: "A possible supporting frame · conceptual",
        text: pack.support,
      },
      { heading: "A serious challenge · conceptual", text: pack.challenge },
    );
  return {
    provider: "local-guide",
    notice:
      "Free local reasoning guide · template-based, not generative AI. Your text never leaves this browser. The frames are conceptual questions, not factual claims or an assessment of your beliefs.",
    turns,
    citations: [],
  };
}
