import { useMemo, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import GovSubnav from "./gov-subnav";
import Link from "./link";
import presidentialRaw from "../../data/government/presidential-actions.json";
import annotationsRaw from "../../data/government/annotations.json";
import { freshness } from "@/lib/freshness";
import { ISSUES, issueById } from "@/lib/issues";
import { fromPresidential, withIssues } from "@/lib/gov-actions";
import { isPolicyAction, validateAnnotations, type PresidentialAction } from "@/lib/presidential";

const snapshot = presidentialRaw as unknown as { retrievedAt: string; actions: PresidentialAction[] };
const annotations = new Map(validateAnnotations(annotationsRaw, snapshot.actions).map((a) => [a.url, a]));
const KIND = { "executive-order": "Executive order", proclamation: "Proclamation", memorandum: "Memorandum", "presidential-document": "Presidential document" } as const;
const day = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtShort = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const month = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export default function President() {
  const [issue, setIssue] = useState("");
  const [kind, setKind] = useState("");
  const [ceremonial, setCeremonial] = useState(false);
  const [onlyExplained, setOnlyExplained] = useState(false);
  const all = useMemo(() => snapshot.actions.filter(isPolicyAction).map((p) => withIssues(fromPresidential(p))), []);
  const shown = all.filter((a) => (ceremonial || !a.ceremonial) && (!issue || a.issues?.includes(issue)) && (!kind || a.kind === kind) && (!onlyExplained || annotations.has(a.sourceUrl)));
  const groups = [...new Set(shown.map((a) => a.date.slice(0, 7)))].map((m) => ({ m, items: shown.filter((a) => a.date.startsWith(m)) }));
  const fp = freshness(snapshot.retrievedAt, new Date(), 3);
  const counts = (k: string) => all.filter((a) => a.kind === k).length;
  const first = all.at(-1)!.date;
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">GOVERNMENT · THE PRESIDENT</div>
        <h1>What has the President been doing lately?</h1>
        <p>A dated list of presidential actions from the White House's own record, with what each one does, how far it has gotten, and what is not yet known.</p>
      </div>
      <GovSubnav current="president" />

      <section className="panel" aria-labelledby="how-to-read">
        <h2 id="how-to-read">How to read this page</h2>
        <ul className="plain-list">
          <li><strong>Signed is not the same as in effect, and in effect is not the same as working.</strong> An order tells agencies what to do; it can be challenged in court, changed, or slow to carry out.</li>
          <li><strong>The President is one branch.</strong> Laws are passed by Congress; this page shows presidential documents only. See <Link href="/government">all actions</Link> for Congress and agencies.</li>
          <li><strong>An announcement is not an outcome.</strong> "Measurable outcomes" says "none yet" until a source reports a measurement; we do not guess.</li>
        </ul>
        <p className="muted">
          <Info size={14} aria-hidden="true" /> Source: <a href="https://www.whitehouse.gov/presidential-actions/" target="_blank" rel="noreferrer">whitehouse.gov/presidential-actions</a>, newest {all.length} policy documents from {day(first)} to {day(all[0].date)}, retrieved {day(snapshot.retrievedAt.slice(0, 10))} ({fp.label}). That is {counts("executive-order")} executive orders, {counts("proclamation")} proclamations and {counts("memorandum")} memoranda; nominations are left out. This is a window, not the whole term.
        </p>
        <p className="muted"><strong>{annotations.size} items have an explanation</strong> (what changes, what is uncertain). They were drafted by Claude from the official text and have <strong>not been human-reviewed</strong>; the rest link to the official document only. Issue tags come from title keywords and can miss or misplace an item.</p>
      </section>

      <section aria-labelledby="timeline">
        <h2 id="timeline">Timeline</h2>
        <div className="filter-row filter-grid" role="group" aria-label="Filter presidential actions">
          <label className="topic-select">
            <span className="sr-only">Issue</span>
            <select value={issue} onChange={(e) => setIssue(e.target.value)}>
              <option value="">Any issue</option>
              {ISSUES.map((i) => (<option key={i.id} value={i.id}>{i.title}</option>))}
            </select>
          </label>
          <label className="topic-select">
            <span className="sr-only">Type</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Any type</option>
              <option value="executive-order">Executive orders</option>
              <option value="proclamation">Proclamations</option>
              <option value="memorandum">Memoranda</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={onlyExplained} onChange={(e) => setOnlyExplained(e.target.checked)} /> Only items with an explanation</label>
          <label className="check"><input type="checkbox" checked={ceremonial} onChange={(e) => setCeremonial(e.target.checked)} /> Include commemorative proclamations</label>
        </div>
        <p className="results-count" aria-live="polite">{shown.length} of {all.length} documents</p>
        {groups.map((g) => (
          <details key={g.m + issue + kind} className="tl-month" open={g.m === groups[0].m || !!issue || !!kind}>
            <summary><h3>{month(g.m + "-15")}</h3><span className="muted">{g.items.length} document{g.items.length === 1 ? "" : "s"}</span></summary>
            <ol className="timeline">
              {g.items.map((a) => {
                const ann = annotations.get(a.sourceUrl);
                return (
                  <li key={a.id} className="tl-item">
                    <div className="card-meta">
                      <span className="tag">{KIND[a.kind as keyof typeof KIND]}{ann?.number ? ` ${ann.number}` : ""}</span>
                      <span>Signed {day(a.date)}</span>
                      {ann && <span className="tag stage">Explained</span>}
                    </div>
                    <h4>{a.title}</h4>
                    {a.issues && a.issues.length > 0 && (
                      <p className="chips">
                        {a.issues.map((id) => (<Link key={id} href={"/issues/" + id} className="chip">{issueById(id)?.title}</Link>))}
                      </p>
                    )}
                    <p className="status-row" aria-label="Status">
                      <span className="status-chip ok">Signed {fmtShort(a.date)}</span>
                      <span className="status-chip unknown">In effect, challenged or blocked: not recorded</span>
                    </p>
                    <p className="stage-note">{ann?.stageNote ?? "A signed presidential document. We have not checked whether it is in effect, being carried out, or challenged in court."}</p>
                    {ann && (
                      <details>
                        <summary>What it changes, what is unknown</summary>
                        <h5>What it does</h5>
                        <ul>{ann.changes.map((c) => (<li key={c}>{c}</li>))}</ul>
                        <p><strong>When it takes effect:</strong> {ann.effective}</p>
                        <p><strong>Measurable outcomes:</strong> {ann.outcomes}</p>
                        <h5>Still uncertain</h5>
                        <ul>{ann.uncertain.map((c) => (<li key={c}>{c}</li>))}</ul>
                        <p className="muted">Machine-drafted from the official text on {ann.draft.basis.match(/\d{4}-\d{2}-\d{2}/)?.[0]}; not human-reviewed.</p>
                      </details>
                    )}
                    <p className="muted"><a href={a.sourceUrl} target="_blank" rel="noreferrer">Official text <ExternalLink size={12} /></a></p>
                  </li>
                );
              })}
            </ol>
          </details>
        ))}
        {shown.length === 0 && <p className="note">Nothing in this window matches. Try removing a filter.</p>}
      </section>
    </>
  );
}
