import { ChevronLeft, ExternalLink, Info } from "lucide-react";
import Link from "./link";
import ChartView from "./chart";
import { BRIEFINGS, briefingById } from "./briefings-data";
import { CLAIM_KIND_LABEL, type Briefing, type Claim } from "@/lib/briefing";

const day = (iso: string) => new Date((iso.length === 7 ? iso + "-15" : iso) + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: iso.length === 7 ? undefined : "numeric", year: "numeric", timeZone: "UTC" });

function Cite({ ids, b }: { ids: string[]; b: Briefing }) {
  if (!ids.length) return null;
  return (
    <sup className="cite">
      {ids.map((id) => {
        const n = b.sources.findIndex((s) => s.id === id) + 1;
        return (
          <a key={id} href={`#src-${b.id}-${id}`} aria-label={`Source ${n}: ${b.sources[n - 1]?.label}`}>
            [{n}]
          </a>
        );
      })}
    </sup>
  );
}

function ClaimList({ claims, b, showKind = true }: { claims: Claim[]; b: Briefing; showKind?: boolean }) {
  return (
    <ul className="claims">
      {claims.map((c) => (
        <li key={c.text}>
          {showKind && <span className={`kind kind-${c.kind}`}>{CLAIM_KIND_LABEL[c.kind]}</span>} {c.text}
          <Cite ids={c.sourceIds} b={b} />
        </li>
      ))}
    </ul>
  );
}

export function BriefingPage({ id }: { id?: string }) {
  const b = id ? briefingById(id) : undefined;
  if (!b)
    return (
      <>
        <Link href="/issues" className="back-link">
          <ChevronLeft size={15} /> Issues
        </Link>
        <p className="empty">That briefing does not exist.</p>
      </>
    );
  return (
    <>
      <Link href="/issues" className="back-link">
        <ChevronLeft size={15} /> Issues
      </Link>
      <header className="briefing-head">
        <div className="eyebrow">BRIEFING · {b.topic.toUpperCase()}</div>
        <h1>{b.question}</h1>
        <section className="short-answer" aria-labelledby="short-answer">
          <h2 id="short-answer">The short answer</h2>
          {b.shortAnswer.map((c) => (
            <p key={c.text}>
              {c.text}
              <Cite ids={c.sourceIds} b={b} />
            </p>
          ))}
        </section>
        <dl className="freshness-strip">
          <div>
            <dt>Data through</dt>
            <dd>{b.dataThrough}</dd>
          </div>
          <div>
            <dt>Sources last checked</dt>
            <dd>{day(b.sourceCheckedOn)}</dd>
          </div>
          <div>
            <dt>Editorial review</dt>
            <dd>{b.review.status === "human-reviewed" ? `Human-reviewed by ${b.review.reviewer}` : "Machine-checked, not human-reviewed"}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="evidence">
        <h2 id="evidence">The evidence</h2>
        {b.evidence.map((blk, i) =>
          blk.type === "stats" ? (
            <div key={i} className="stat-row">
              {blk.items.map((s) => (
                <div key={s.label} className="stat">
                  <span className="stat-label">{s.label}</span>
                  <strong>{s.value}</strong>
                  {s.note && <span className="stat-note">{s.note}</span>}
                  <Cite ids={s.sourceIds} b={b} />
                </div>
              ))}
            </div>
          ) : blk.type === "chart" ? (
            <div key={i} className="panel chart-panel">
              <ChartView chart={blk.chart} />
              <p className="chart-src">
                Source: {blk.chart.sourceIds.map((sid) => b.sources.find((s) => s.id === sid)?.publisher).join("; ")}
                <Cite ids={blk.chart.sourceIds} b={b} />
              </p>
            </div>
          ) : (
            <div key={i} className="panel">
              {blk.heading && <h3>{blk.heading}</h3>}
              <ClaimList claims={blk.claims} b={b} />
            </div>
          ),
        )}
      </section>

      {b.context.length > 0 && (
        <section aria-labelledby="context">
          <h2 id="context">Historical context</h2>
          <ClaimList claims={b.context} b={b} />
        </section>
      )}
      {b.recent.length > 0 && (
        <section aria-labelledby="recent">
          <h2 id="recent">What changed recently</h2>
          <ul className="claims">
            {b.recent.map((r) => (
              <li key={r.text}>
                <strong>{day(r.date)}.</strong> {r.href ? <Link href={r.href}>{r.text}</Link> : r.text}
                <Cite ids={r.sourceIds} b={b} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {b.next.length > 0 && (
        <section aria-labelledby="next">
          <h2 id="next">What happens next</h2>
          <ul className="claims">
            {b.next.map((n) => (
              <li key={n.text}>
                <span className={`kind kind-${n.kind === "scheduled" ? "fact" : "unknown"}`}>{n.kind === "scheduled" ? "Scheduled" : "Unknown"}</span> {n.text}
                <Cite ids={n.sourceIds} b={b} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="disagree">
        <h2 id="disagree">What people disagree about</h2>
        <div className="two-up">
          <div className="panel">
            <h3>Disagreements about facts</h3>
            {b.disagreements.factual.length ? <ClaimList claims={b.disagreements.factual} b={b} /> : <p className="muted">No factual dispute is described here.</p>}
          </div>
          <div className="panel">
            <h3>Disagreements about values</h3>
            <ClaimList claims={b.disagreements.values} b={b} />
          </div>
        </div>
      </section>
      <section aria-labelledby="sources">
        <h2 id="sources">Original sources</h2>
        <ol className="source-list numbered">
          {b.sources.map((s) => (
            <li key={s.id} id={`src-${b.id}-${s.id}`}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label} <ExternalLink size={12} />
              </a>
              <span>
                {s.publisher} · {s.kind === "official" ? "Official record" : "Official research agency"} · checked {day(s.retrievedOn)}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="limits">
        <h2 id="limits">Limitations</h2>
        <div className="notice">
          <Info size={18} />
          <ul>
            {b.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </section>
      {b.related.length > 0 && (
        <section aria-labelledby="more">
          <h2 id="more">Keep exploring</h2>
          <ul className="claims">
            {b.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {b.review.note && <p className="muted">{b.review.note}</p>}
    </>
  );
}

export function IssuesIndex() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">ISSUES</div>
        <h1>Understand a big question, with the evidence in view.</h1>
        <p>Each briefing starts with a plain question and a short answer, then shows the numbers, the history, the original sources and what is still uncertain.</p>
      </div>
      <div className="briefing-grid">
        {BRIEFINGS.filter((b) => b.sections.includes("issues")).map((b) => (
          <Link key={b.id} href={`/issues/${b.id}`} className="briefing-card">
            <span className="eyebrow">{b.topic.toUpperCase()}</span>
            <h3>{b.question}</h3>
            <p>{b.shortAnswer[0].text.slice(0, 190)}…</p>
            <span className="card-link">Read the briefing →</span>
          </Link>
        ))}
      </div>
      <p className="muted">
        These briefings are machine-checked from official sources and have not been reviewed by a human editor. More topics will be added only as fast as they can be sourced properly. See{" "}
        <Link href="/review">what still needs review</Link>.
      </p>
    </>
  );
}
