import { ChevronLeft, ExternalLink, Info } from "lucide-react";
import Link from "./link";

const BB = "https://content.leg.colorado.gov/sites/default/files/2026-blue-book-en-accessible.pdf";
const SOS = "https://www.coloradosos.gov/pubs/newsRoom/pressReleases/2026/PR20260904BallotCertification.html";

const Src = ({ href, label }: { href: string; label: string }) => (
  <a className="src-link" href={href} target="_blank" rel="noreferrer">
    ({label} <ExternalLink size={11} />)
  </a>
);

export default function ElectionProcess() {
  return (
    <>
      <Link href="/vote/colorado" className="back-link">
        <ChevronLeft size={15} /> Colorado overview
      </Link>
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · HOW ELECTIONS WORK</div>
        <h1>How voting works in Colorado, step by step.</h1>
        <p>A plain-language guide for anyone who has never filled out a Colorado ballot. Every fact below cites an official source.</p>
      </div>
      <div className="notice">
        <Info size={18} /> General explanations written by Common Ground from the 2026 Blue Book and the Secretary of State's Sept. 4, 2026
        release. They are machine-checked only and have not been reviewed by a human editor. Your county clerk's instructions always take
        precedence.
      </div>
      <article className="panel longform">
        <h2>1. You get a ballot in the mail</h2>
        <p>
          Every Colorado voter receives a mail ballot for federal and statewide elections <Src href={BB} label="Blue Book, Amendment 84 analysis" />. County
          clerks may begin mailing ballots to active voters on Oct. 2, and must have sent initial ballots by Oct. 9{" "}
          <Src href={SOS} label="Secretary of State, Sept. 4, 2026" />.
        </p>
        <h2>2. You choose how to return it</h2>
        <p>
          You can return your ballot at a drop box or through the mail, or vote in person at any voter service and polling center in your county{" "}
          <Src href={BB} label="Blue Book" />. In 2024, 92 percent of ballots cast in Colorado were mail ballots, most returned to a drop box{" "}
          <Src href={BB} label="Blue Book" />. The Secretary of State suggests mailing your ballot back by Oct. 26 and after that using a drop box or voting
          center, or voting in person <Src href={SOS} label="Secretary of State" />.
        </p>
        <h2>3. Your signature is checked</h2>
        <p>
          You sign the return envelope. The county compares it with the signature on file. If there is a discrepancy, two election judges of different
          political parties review it. If both agree it likely is not yours, the county contacts you, and you have until eight days after Election Day to
          confirm your identity or the ballot is not counted <Src href={BB} label="Blue Book, Amendment 84 analysis" />. Amendment 84 on this year's ballot would add
          an ID-number check.
        </p>
        <h2>4. The deadline</h2>
        <p>
          On Election Day, Nov. 3, voting centers are open 7 a.m. to 7 p.m. Your ballot must be received, or you must be in line, by 7 p.m.{" "}
          <Src href={SOS} label="Secretary of State" />. The last day to register and still be mailed a ballot is Oct. 26; after that you can still register and vote
          in person <Src href={SOS} label="Secretary of State" />.
        </p>
        <h2>5. What is on the ballot</h2>
        <ul>
          <li>
            <strong>Offices:</strong> statewide offices like Governor and U.S. Senate, plus races that depend on your address. See{" "}
            <Link href="/vote/colorado">what depends on your address</Link>.
          </li>
          <li>
            <strong>Judges:</strong> yes-or-no retention questions. See <Link href="/vote/colorado/judges">how judicial retention works</Link>.
          </li>
          <li>
            <strong>Ballot measures:</strong> questions put to voters directly. A <em>citizen initiative</em> gets on the ballot by petition; a{" "}
            <em>referred measure</em> is placed there by the legislature <Src href={BB} label="Blue Book, Amendment 85 analysis" />. Before signature
            collection, a state Title Board writes each initiative's ballot title <Src href={BB} label="Blue Book" />.
          </li>
        </ul>
        <h2>6. How many votes a measure needs</h2>
        <p>
          A change to the state constitution needs at least 55 percent of votes cast; a change to ordinary state law (a statute) needs a simple majority{" "}
          <Src href={BB} label="Blue Book" />. This year the Blue Book lists Amendment 87, which changes both the constitution and statutes, as needing only a majority; each measure page states its own threshold.
        </p>
        <h2>7. Words you will see</h2>
        <dl className="facts">
          <dt>TABOR</dt>
          <dd>
            Colorado's constitutional limit on how much revenue the state can keep. Revenue above the limit must be refunded to taxpayers unless voters allow
            the state to keep it <Src href={BB} label="Blue Book, Proposition NN analysis" />.
          </dd>
          <dt>Retention</dt>
          <dd>A yes-or-no vote on whether a judge stays in office for another term.</dd>
          <dt>Statute</dt>
          <dd>An ordinary state law, as opposed to a constitutional amendment.</dd>
          <dt>Independent redistricting commission</dt>
          <dd>
            Created by a 2018 amendment; redraws Colorado's congressional districts after each census <Src href={BB} label="Blue Book, Amendment 86 analysis" />.
          </dd>
        </dl>
        <h2>8. Who does what</h2>
        <p>
          County clerks mail ballots and run voting centers; the Secretary of State certifies the statewide ballot (it did so on Sept. 4, 2026){" "}
          <Src href={SOS} label="Secretary of State" />. Your county election office can answer questions about your districts. For details specific to your
          address, use <a href="https://www.govotecolorado.gov/" target="_blank" rel="noreferrer">GoVoteColorado</a>.
        </p>
        <p>
          <Link className="button primary" href="/vote/colorado/measures">
            Read the measures
          </Link>
        </p>
      </article>
    </>
  );
}
