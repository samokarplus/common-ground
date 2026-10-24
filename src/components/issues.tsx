import { Info } from "lucide-react";
import { ISSUE_ICON } from "./issue-icons";
import Link from "./link";
import { BRIEFINGS, briefingById } from "./briefings-data";
import { BriefingPage } from "./briefing";
import { CandidatesForIssue, GovernmentForIssue } from "./connected";
import { allActions } from "./government";
import { COMPARISONS } from "./compare-data";
import { BRIEFING_FOR_ISSUE, ISSUES, OFFICIAL_DATA, issueById, type IssueId } from "@/lib/issues";

/** `/issues/<id>`: a briefing if one exists under that id, an issue page if it is one of the nine issues, otherwise not found. */
export function IssueRoute({ id }: { id?: string }) {
  if (!id) return <IssuesHub />;
  if (briefingById(id)) return <BriefingPage id={id} />;
  if (issueById(id)) return <IssuePage id={id as IssueId} />;
  return <BriefingPage id={id} />;
}

export function IssuesHub() {
  const today = new Date().toISOString().slice(0, 10);
  const actions = allActions(today).filter((a) => !a.ceremonial);
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">ISSUES</div>
        <h1>Start with what you care about.</h1>
        <p>Pick an issue to see what is happening, what the numbers show, what different people argue, and what government is doing, with the original sources one click away.</p>
      </div>
      <div className="briefing-grid">
        {ISSUES.map((i) => {
          const briefings = (BRIEFING_FOR_ISSUE[i.id] ?? []).length;
          const n = actions.filter((a) => a.issues?.includes(i.id)).length;
          const cand = COMPARISONS.filter((c) => c.issues.some((x) => x.issue === i.id && Object.values(x.positions).some((p) => p.length))).length;
          return (
            <Link key={i.id} href={`/issues/${i.id}`} className="briefing-card issue-card">
              <span className="pill-icon" aria-hidden="true">{(() => { const Icon = ISSUE_ICON[i.id]; return <Icon size={22} />; })()}</span>
              <h3>{i.title}</h3>
              <p>{i.blurb}</p>
              <ul className="has-list" aria-label={`What we have on ${i.title}`}>
                <li className={briefings ? "yes" : "no"}>{briefings ? "Evidence briefing" : "Evidence briefing: not yet written"}</li>
                <li className={n ? "yes" : "no"}>{n} recent government action{n === 1 ? "" : "s"} tagged</li>
                <li className={cand ? "yes" : "no"}>{cand ? "Candidate positions" : "No candidate comparison yet"}</li>
              </ul>
              <span className="card-link">Explore this issue →</span>
            </Link>
          );
        })}
      </div>
      <p className="muted">
        We would rather publish fewer issues done properly than all of them thinly. Briefings are machine-checked from official sources and not human-reviewed. See <Link href="/review">what still needs review</Link>. Looking for a race? <Link href="/compare">Compare candidates</Link>.
      </p>
    </>
  );
}

export function IssuePage({ id }: { id: IssueId }) {
  const issue = issueById(id)!;
  const briefs = (BRIEFING_FOR_ISSUE[id] ?? []).map((b) => BRIEFINGS.find((x) => x.id === b)).filter((b): b is NonNullable<typeof b> => !!b);
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/issues">Issues</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{issue.title}</span>
      </nav>
      <div className="page-title issue-head">
        <div className="eyebrow">ISSUE</div>
        <h1>{issue.title}</h1>
        <p>{issue.question}</p>
      </div>
      <nav className="toc" aria-label="On this page">
        {([["what-is-happening", "What is happening"], ["gov-section", "Government"], ["sides", "Different views"], ["cand-section", "Candidates"], ["sources-section", "Sources"]] as const).map(([h, l]) => (
          <a key={h} href={`#${h}`} onClick={(e) => { e.preventDefault(); document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{l}</a>
        ))}
      </nav>

      <section id="what-is-happening" aria-labelledby="happening-h" className="connected">
        <h2 id="happening-h">What is happening, and what the numbers show</h2>
        {briefs.length === 0 ? (
          <div className="empty-state" role="note">
            <h3><Info size={18} aria-hidden="true" /> No evidence briefing yet.</h3>
            <p>We have not yet checked and summarized the official numbers on this issue, so we are not summarizing them here. We would rather say nothing than guess.</p>
            <p>The <a href="#sources-section">official sources below</a> are where to look. Government actions and candidate statements on this issue appear further down the page.</p>
          </div>
        ) : (
          briefs.map((b) => (
            <article key={b.id} className="panel">
              <h3><Link href={`/issues/${b.id}`}>{b.question}</Link></h3>
              {b.shortAnswer.slice(0, 2).map((c) => (<p key={c.text}>{c.text}</p>))}
              <p className="muted">Data through {b.dataThrough}. Machine-checked, not human-reviewed.</p>
              <Link href={`/issues/${b.id}`} className="card-link">Read the full briefing, with charts and sources →</Link>
            </article>
          ))
        )}
      </section>

      <div id="gov-section"><GovernmentForIssue issue={id} /></div>

      <section id="sides" aria-labelledby="sides-h" className="connected">
        <h2 id="sides-h">What different people argue</h2>
        {briefs.length > 0 ? (
          briefs.map((b) => (
            <details key={b.id} className="disclosure" open>
              <summary>{b.question}</summary>
              <p><strong>Disagreements about facts:</strong></p>
              <ul>{b.disagreements.factual.map((c) => (<li key={c.text}>{c.text}</li>))}</ul>
              <p><strong>Disagreements about values:</strong></p>
              <ul>{b.disagreements.values.map((c) => (<li key={c.text}>{c.text}</li>))}</ul>
            </details>
          ))
        ) : (
          <div className="empty-state"><p>Not yet written for this issue. In the meantime the <Link href="/debate/maps">Debate Lab</Link> maps arguments on ballot questions, and the <Link href="/atlas">Thought Atlas</Link> explains the ideas behind political disagreements.</p></div>
        )}
      </section>

      <div id="cand-section"><CandidatesForIssue issue={id} /></div>

      <section id="sources-section" aria-labelledby="sources-h" className="connected">
        <h2 id="sources-h">Where the official data lives</h2>
        <ul>
          {OFFICIAL_DATA[id].map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>
          ))}
        </ul>
        <p className="muted">These are pointers to official sources, not summaries by Common Ground.</p>
      </section>
    </>
  );
}
