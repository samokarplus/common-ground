import { Info } from "lucide-react";
import { ISSUE_ICON } from "./issue-icons";
import Link from "./link";
import { BRIEFINGS, briefingById } from "./briefings-data";
import { BriefingPage } from "./briefing";
import { CandidatesForIssue, GovernmentForIssue, actionsForIssue, comparisonsForIssue } from "./connected";
import { BRIEFING_FOR_ISSUE, ISSUES, OFFICIAL_DATA, issueById, type IssueId } from "@/lib/issues";

/** `/issues/<id>`: a briefing if one exists under that id, an issue page if it is one of the nine issues, otherwise not found. */
export function IssueRoute({ id }: { id?: string }) {
  if (!id) return <IssuesHub />;
  if (briefingById(id)) return <BriefingPage id={id} />;
  if (issueById(id)) return <IssuePage id={id as IssueId} />;
  return <BriefingPage id={id} />;
}

export function IssuesHub() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">ISSUES</div>
        <h1>Start with what you care about.</h1>
        <p>Pick an issue to see what is happening, what the numbers show, what different people argue, and what government is doing, with the original sources one click away.</p>
      </div>
      <div className="briefing-grid">
        {[...ISSUES].sort((a, b) => Number((BRIEFING_FOR_ISSUE[b.id] ?? []).length > 0) - Number((BRIEFING_FOR_ISSUE[a.id] ?? []).length > 0)).map((i) => {
          const briefings = (BRIEFING_FOR_ISSUE[i.id] ?? []).length;
          return (
            <Link key={i.id} href={`/issues/${i.id}`} className="briefing-card issue-card">
              <span className="pill-icon" aria-hidden="true">{(() => { const Icon = ISSUE_ICON[i.id]; return <Icon size={22} />; })()}</span>
              <h3>{i.title}</h3>
              <p>{i.blurb}</p>
              {briefings > 0 && <span className="status-chip ok">Evidence briefing</span>}
              <span className="card-link">Explore this issue →</span>
            </Link>
          );
        })}
      </div>
      <p className="muted">
        Issues marked "Evidence briefing" have checked numbers from official sources. The others show what government is doing and what candidates have said, and point to official data; we publish a briefing only when the numbers are checked. Briefings are machine-checked, not human-reviewed (<Link href="/review">status</Link>).
      </p>
    </>
  );
}

export function IssuePage({ id }: { id: IssueId }) {
  const issue = issueById(id)!;
  const hasGov = actionsForIssue(id).length > 0;
  const hasCand = comparisonsForIssue(id).length > 0;
  const briefs = (BRIEFING_FOR_ISSUE[id] ?? []).map((b) => BRIEFINGS.find((x) => x.id === b)).filter((b): b is NonNullable<typeof b> => !!b);
  const toc: [string, string][] = [["what-is-happening", briefs.length ? "What is happening" : "Evidence"], ...(hasGov ? ([["gov-section", "Government"]] as [string, string][]) : []), ...(briefs.length ? ([["sides", "Different views"]] as [string, string][]) : []), ...(hasCand ? ([["cand-section", "Candidates"]] as [string, string][]) : []), ["sources-section", "Sources"]];
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
        {toc.map(([h, l]) => (
          <a key={h} href={`#${h}`} onClick={(e) => { e.preventDefault(); document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{l}</a>
        ))}
      </nav>

      <section id="what-is-happening" aria-labelledby="happening-h" className="connected">
        <h2 id="happening-h">What is happening, and what the numbers show</h2>
        {briefs.length === 0 ? (
          <div className="empty-state" role="note">
            <h3><Info size={18} aria-hidden="true" /> No evidence briefing yet.</h3>
            <p>We have not yet checked and summarized the official numbers on this issue, so we are not summarizing them here. We would rather say nothing than guess.</p>
            <p>The <a href="#sources-section">official sources below</a> are where to look.{hasGov || hasCand ? " What government is doing and what candidates have said appear on this page." : ""}</p>
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

      {briefs.length > 0 && (
        <section id="sides" aria-labelledby="sides-h" className="connected">
          <h2 id="sides-h">What different people argue</h2>
          {briefs.map((b) => (
            <details key={b.id} className="disclosure" open>
              <summary>{b.question}</summary>
              <p><strong>Disagreements about facts:</strong></p>
              <ul>{b.disagreements.factual.map((c) => (<li key={c.text}>{c.text}</li>))}</ul>
              <p><strong>Disagreements about values:</strong></p>
              <ul>{b.disagreements.values.map((c) => (<li key={c.text}>{c.text}</li>))}</ul>
            </details>
          ))}
        </section>
      )}

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
