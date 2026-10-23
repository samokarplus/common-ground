import { ExternalLink, Info } from "lucide-react";
import Link from "./link";
import { CHAINS, STAGE_INFO } from "@/lib/chain";

export default function ChainPage() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">PROMISES, VOTES AND OUTCOMES</div>
        <h1>Follow a decision from promise to outcome.</h1>
        <p>
          Politics blurs seven different things: a promise, a proposal, a bill, a vote, a law, its implementation and what happened
          afterward. Each is a separate record with its own source and its own responsible people. Common Ground shows them separately and
          never turns them into a score.
        </p>
      </div>
      <div className="notice">
        <Info size={18} /> This is a framework with one worked example about how a bill moved through Congress. It is not a ranking of
        anyone's honesty and covers no promises yet. Statements here are limited to what the cited official records say.
      </div>
      {CHAINS.map((c) => (
        <section key={c.id} className="panel" aria-labelledby={c.id}>
          <h2 id={c.id}>{c.title}</h2>
          <p>{c.scope}</p>
          <ol className="process-steps">
            {c.steps.map((s, i) => (
              <li key={s.stage}>
                <h3>
                  {i + 1}. {STAGE_INFO[s.stage].label}
                </h3>
                <p className="muted">{STAGE_INFO[s.stage].question}</p>
                {s.status === "documented" ? (
                  <ul>
                    {s.events.map((e) => (
                      <li key={e.what}>
                        <strong>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong> ·{" "}
                        {e.actor} <span className="muted">({e.role})</span>: {e.what}{" "}
                        <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                          {e.sourceTitle} <ExternalLink size={12} />
                        </a>
                      </li>
                    ))}
                    <li className="muted">Sources retrieved {s.retrievedOn}.</li>
                  </ul>
                ) : (
                  <p>
                    <strong>Not documented here.</strong> {s.why}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <h3>Cautions</h3>
          <ul>{c.cautions.map((x) => <li key={x}>{x}</li>)}</ul>
          <p>
            Related: <Link href="/congress/how-it-works">How a bill becomes law</Link> · <Link href="/congress">Congress tracker</Link>
          </p>
        </section>
      ))}
    </>
  );
}
