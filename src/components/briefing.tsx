import { ChevronLeft, ExternalLink, Info } from "lucide-react";
import Link from "./link";
import ChartView from "./chart";
import { BRIEFINGS, briefingById } from "./briefings-data";
import { CandidatesForIssue, GovernmentForIssue, actionsForIssue, comparisonsForIssue } from "./connected";
import { issueById, issuesForBriefing } from "@/lib/issues";
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
  const linked = issuesForBriefing(b.id);
  const toc: [string, string][] = [["evidence", "Evidence"], ...(b.context.length ? [["context", "Why it matters"] as [string, string]] : []), ...(linked.some((i) => actionsForIssue(i).length > 0) ? ([["government", "Government"]] as [string, string][]) : []), ...(linked.some((i) => comparisonsForIssue(i).length > 0) ? ([["candidates", "Candidates"]] as [string, string][]) : []), ["disagree", "Different views"], ["sources", "Sources and limits"]];
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/issues">Issues</Link>
        {linked[0] && (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/issues/${linked[0]}`}>{issueById(linked[0])?.title}</Link>
          </>
        )}
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Briefing</span>
      </nav>
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
            <dd>
              <span className={"status-chip " + (b.review.status === "human-reviewed" ? "ok" : "warn")}>
                {b.review.status === "human-reviewed" ? `Human-reviewed by ${b.review.reviewer}` : "Machine-checked, not human-reviewed"}
              </span>
            </dd>
          </div>
        </dl>
      </header>

      <nav className="toc" aria-label="On this page">
        {toc.map(([id2, label]) => (
          <a key={id2} href={`#${id2}`} onClick={(e) => { e.preventDefault(); document.getElementById(id2)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            {label}
          </a>
        ))}
      </nav>

      <section aria-labelledby="evidence-h" id="evidence">
        <h2 id="evidence-h">The evidence</h2>
        {b.evidence.map((blk, i) =>
          blk.type === "stats" ? (
            <div key={i} className="stat-feature">
              {blk.items.map((st) => (
                <div key={st.label} className="stat-card">
                  <span className="stat-label">{st.label}</span>
                  <strong className="stat-value">{st.value}</strong>
                  {st.plain && <p className="stat-plain"><span className="sr-only">In plain English: </span>{st.plain}</p>}
                  {st.note && <p className="stat-note">{st.note}<Cite ids={st.sourceIds} b={b} /></p>}
                  {!st.note && <Cite ids={st.sourceIds} b={b} />}
                </div>
              ))}
            </div>
          ) : blk.type === "chart" ? (
            <div key={i} className="chart-panel">
              <ChartView chart={blk.chart} />
              <p className="chart-src">
                Source: {blk.chart.sourceIds.map((sid) => b.sources.find((x) => x.id === sid)?.publisher).join("; ")}
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
        <section aria-labelledby="context-h" id="context">
          <h2 id="context-h">Why it matters, and how to read it</h2>
          <ClaimList claims={b.context} b={b} />
          {(b.recent.length > 0 || b.next.length > 0) && (
            <div className="two-up">
              {b.recent.length > 0 && (
                <div className="panel">
                  <h3>What changed recently</h3>
                  <ul className="claims">
                    {b.recent.map((r) => (
                      <li key={r.text}>
                        <strong>{day(r.date)}.</strong> {r.href ? <Link href={r.href}>{r.text}</Link> : r.text}
                        <Cite ids={r.sourceIds} b={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {b.next.length > 0 && (
                <div className="panel">
                  <h3>What happens next</h3>
                  <ul className="claims">
                    {b.next.map((n) => (
                      <li key={n.text}>
                        <span className={`kind kind-${n.kind === "scheduled" ? "fact" : "unknown"}`}>{n.kind === "scheduled" ? "Scheduled" : "Unknown"}</span> {n.text}
                        <Cite ids={n.sourceIds} b={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {linked.map((i) => (
        <div key={i}>
          <div id="government"><GovernmentForIssue issue={i} limit={4} /></div>
          <div id="candidates"><CandidatesForIssue issue={i} /></div>
        </div>
      ))}

      <section aria-labelledby="disagree-h" id="disagree">
        <h2 id="disagree-h">What people disagree about</h2>
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

      <section aria-labelledby="sources-h" id="sources">
        <h2 id="sources-h">Original sources and limits</h2>
        <ol className="source-list numbered">
          {b.sources.map((x) => (
            <li key={x.id} id={`src-${b.id}-${x.id}`}>
              <a href={x.url} target="_blank" rel="noreferrer">
                {x.label} <ExternalLink size={12} aria-hidden="true" />
              </a>
              <span>
                {x.publisher} · {x.kind === "official" ? "Official record" : "Official research agency"} · checked {day(x.retrievedOn)}
              </span>
            </li>
          ))}
        </ol>
        <h3 id="limits">Limitations</h3>
        <div className="notice">
          <Info size={18} aria-hidden="true" />
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
