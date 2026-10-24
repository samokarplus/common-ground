import { useMemo, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import GovSubnav from "./gov-subnav";
import Link, { routeSearch } from "./link";
import { COMPARISONS, comparisonById } from "./compare-data";
import { RELATION_LABEL, type Comparison, type Entry } from "@/lib/compare";
import { ISSUES, issueById } from "@/lib/issues";

const dateLabel = (d?: string) => (!d ? "undated page" : new Date((d.length === 4 ? d + "-06-15" : d.length === 7 ? d + "-15" : d) + "T12:00:00Z").toLocaleDateString("en-US", { month: d.length === 4 ? undefined : "long", day: d.length === 10 ? "numeric" : undefined, year: "numeric", timeZone: "UTC" }));
const longDay = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const KIND_SHORT: Record<Entry["kind"], string> = {
  "own-statement": "Own statement",
  "documented-action": "Documented action",
  "independent-finding": "Independent finding",
  allegation: "Allegation, not established",
  opinion: "Third-party opinion",
};
const KIND_MEANS: Record<Entry["kind"], string> = {
  "own-statement": "What the person or their campaign says. It tells you their stated position, not whether it is accurate or acted on.",
  "documented-action": "Something an official record shows: a vote, a signed law, a lawsuit filed, an election result.",
  "independent-finding": "A conclusion reached by a source other than the person or their opponents.",
  allegation: "A claim that has not been established. Shown only with its source.",
  opinion: "A judgment by someone else. Not evidence of what happened.",
};
const entryLabel = (e: Entry) => (e.kind === "own-statement" && /jamestalarico\.com|kenpaxton\.com/.test(e.sourceUrl) ? "Campaign statement" : KIND_SHORT[e.kind]);

function EntryCard({ e }: { e: Entry }) {
  return (
    <li className="entry">
      <span className={"kind-badge kind-" + e.kind}>{entryLabel(e)}</span>
      <p>{e.text}</p>
      <details>
        <summary>Evidence</summary>
        <p>
          <a href={e.sourceUrl} target="_blank" rel="noreferrer">{e.sourceTitle} <ExternalLink size={12} /></a>
          <br />Source date: {dateLabel(e.sourceDate)} · Read on {longDay(e.retrievedOn)}
        </p>
        {e.note && <p className="muted">{e.note}</p>}
      </details>
    </li>
  );
}

export function CompareIndex() {
  const [q, setQ] = useState("");
  const shown = COMPARISONS.filter((c) => !q.trim() || `${c.title} ${c.office} ${c.people.map((p) => p.name + " " + p.party).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">GOVERNMENT · CANDIDATES</div>
        <h1>Compare candidates, side by side.</h1>
        <p>What each person has said on the issues, what their record shows, and what is not documented, with the source behind every line. No scores, rankings or recommendations.</p>
      </div>
      <GovSubnav current="compare" />
      <label className="topic-select wide">
        <span className="sr-only">Search races and candidates</span>
        <input type="search" placeholder="Search a candidate or race, e.g. Talarico, Paxton, Texas" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="briefing-grid">
        {shown.map((c) => (
          <Link key={c.id} href={`/compare/${c.id}`} className="briefing-card">
            <span className="eyebrow">{c.office.toUpperCase()}</span>
            <h3>{c.people.map((p) => p.name).join(" and ")}</h3>
            <p>{c.title}. {c.summary}</p>
            <span className="card-link">Compare them →</span>
          </Link>
        ))}
      </div>
      {shown.length === 0 && <p className="note">No published comparison matches that search. We only publish races we have researched properly; the <Link href="/vote">Colorado Help Me Vote guide</Link> has its own candidate pages.</p>}
      <p className="muted">Only one race is published so far. Prioritising a complete, sourced comparison over covering every race thinly.</p>
    </>
  );
}

export function ComparePage({ id }: { id?: string }) {
  const c = id ? comparisonById(id) : undefined;
  if (!id) return <CompareIndex />;
  if (!c) return (
    <div className="page-title">
      <div className="eyebrow">404</div>
      <h1>We do not have that comparison.</h1>
      <p><Link href="/compare">See the published comparisons</Link>.</p>
    </div>
  );
  return <Side c={c} />;
}

function Side({ c }: { c: Comparison }) {
  const initial = new URLSearchParams(routeSearch()).get("issue") ?? "";
  const [issue, setIssue] = useState(ISSUES.some((i) => i.id === initial) ? initial : "");
  const wide = typeof window !== "undefined" && window.matchMedia?.("(min-width: 900px)").matches;
  const blocks = useMemo(() => c.issues.filter((b) => !issue || b.issue === issue), [c, issue]);
  const [a, b] = c.people;
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">{c.office.toUpperCase()} · ELECTION {longDay(c.electionDate).toUpperCase()}</div>
        <h1>{a.name} and {b.name}</h1>
        <p>{c.summary}</p>
      </div>
      <GovSubnav current="compare" />

      <div className="note" role="note">
        <Info size={15} aria-hidden="true" /> <strong>Information, not advice.</strong> There are no scores, rankings or endorsements here. A campaign's own page is that candidate's statement, not a fact-check; "not documented here" means we did not find it, not that the person has no view. Machine-checked from public sources on {longDay(c.asOf)}; not human-reviewed.
      </div>

      <section aria-labelledby="who" className="compare-people">
        <h2 id="who" className="sr-only">Who they are</h2>
        {c.people.map((p) => (
          <article key={p.id} className="person-card">
            <h3>{p.name}</h3>
            <p className="muted">{p.party} · {p.role}</p>
            <ul className="facts">
              {p.about.map((e) => (
                <li key={e.text}>
                  {e.text} <a href={e.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={12} aria-hidden="true" /></a>
                </li>
              ))}
            </ul>
            <p><a href={p.website} target="_blank" rel="noreferrer">Campaign website <ExternalLink size={12} aria-hidden="true" /></a></p>
          </article>
        ))}
      </section>

      <section aria-labelledby="by-issue">
        <h2 id="by-issue">Issue by issue</h2>
        <details className="disclosure key">
          <summary>How to read the labels</summary>
          <dl className="label-key">
            {(Object.keys(KIND_SHORT) as Entry["kind"][]).map((k) => (
              <div key={k}>
                <dt><span className={"kind-badge kind-" + k}>{KIND_SHORT[k]}</span></dt>
                <dd>{KIND_MEANS[k]}</dd>
              </div>
            ))}
            <div>
              <dt><span className="kind-badge">Nothing documented here</span></dt>
              <dd>We did not find a source. It does not mean the person has no view.</dd>
            </div>
          </dl>
        </details>
        <div className="chips filter" role="group" aria-label="Filter by issue">
          <button className={"chip-btn" + (!issue ? " on" : "")} aria-pressed={!issue} onClick={() => setIssue("")}>All issues</button>
          {c.issues.map((x) => (
            <button key={x.issue} className={"chip-btn" + (issue === x.issue ? " on" : "")} aria-pressed={issue === x.issue} onClick={() => setIssue(issue === x.issue ? "" : x.issue)}>
              {issueById(x.issue)?.title}
            </button>
          ))}
        </div>
        {blocks.map((blk) => (
          <details key={blk.issue + issue} className="issue-compare" open={wide || !!issue} id={`ic-${blk.issue}`}>
            <summary>
              <span className="ic-title">{issueById(blk.issue)?.title}</span>
              <span className={"rel rel-" + blk.relation}>{RELATION_LABEL[blk.relation]}</span>
            </summary>
            <p className="relation">{blk.relationNote} <Link href={`/issues/${blk.issue}`}>Evidence, numbers and government actions on this issue →</Link></p>
            <div className="two-col">
              {c.people.map((p, pi) => (
                <div key={p.id} className={"col person-" + pi}>
                  <h4><span className="person-dot" aria-hidden="true" />{p.name}</h4>
                  {blk.positions[p.id].length ? (
                    <ul className="entries">{blk.positions[p.id].map((e) => (<EntryCard key={e.text} e={e} />))}</ul>
                  ) : (
                    <p className="undocumented">Nothing documented here. This is not a statement about what {p.name} believes.</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>

      <section aria-labelledby="limits" className="panel">
        <h2 id="limits">What this comparison does not show</h2>
        <ul>{c.limitations.map((l) => (<li key={l}>{l}</li>))}</ul>
        <p className="muted">Spot a mistake? See <Link href="/corrections">corrections</Link>. How we separate statements from facts: <Link href="/methodology">methodology</Link>.</p>
      </section>
    </>
  );
}
