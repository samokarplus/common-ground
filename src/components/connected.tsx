import { ExternalLink } from "lucide-react";
import Link from "./link";
import { allActions } from "./government";
import { COMPARISONS } from "./compare-data";
import { STAGES } from "@/lib/gov-actions";
import { RELATION_LABEL } from "@/lib/compare";
import { issueById } from "@/lib/issues";

const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "What government is doing" for an issue: newest tagged actions across Congress, the President and agencies. */
export function GovernmentForIssue({ issue, limit = 4 }: { issue: string; limit?: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const items = allActions(today).filter((a) => !a.ceremonial && a.issues?.includes(issue));
  const shown = items.slice(0, limit);
  return (
    <section aria-labelledby={`gov-${issue}`} className="connected">
      <h2 id={`gov-${issue}`}>What government is doing about this</h2>
      {shown.length === 0 ? (
        <p className="muted">No action in our current snapshots is tagged with this issue. That does not mean nothing is happening: our snapshots hold only the newest items, and tags come from keywords.</p>
      ) : (
        <ul className="action-feed compact">
          {shown.map((a) => (
            <li key={a.id} className="action-item">
              <div className="card-meta">
                <span className="tag">{a.branch}</span>
                <span className="tag stage">{STAGES.find((s) => s.id === a.stage)!.label}</span>
                <span>{fmt(a.date)}</span>
              </div>
              <h3 title={a.title} className="clamp-3">{a.title}</h3>
              <p className="muted">
                {a.detail} <a href={a.sourceUrl} target="_blank" rel="noreferrer">Official record <ExternalLink size={12} /></a>
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="muted">
        <Link href={`/government?issue=${issue}`}>See all {items.length} tagged actions</Link> · <Link href="/government/president">Presidential actions, dated</Link>. Tagged by CRS policy area or title keywords; a stage tells you how far something has gotten, not whether it is good policy.
      </p>
    </section>
  );
}

/** What candidates in a published comparison have documented on this issue. */
export function CandidatesForIssue({ issue }: { issue: string }) {
  const rows = COMPARISONS.flatMap((c) => {
    const block = c.issues.find((i) => i.issue === issue);
    return block ? [{ c, block }] : [];
  });
  return (
    <section aria-labelledby={`cand-${issue}`} className="connected">
      <h2 id={`cand-${issue}`}>What candidates have said about this</h2>
      {rows.length === 0 ? (
        <p className="muted">No candidate comparison has been published yet.</p>
      ) : (
        rows.map(({ c, block }) => (
          <div key={c.id} className="panel">
            <h3>
              <Link href={`/compare/${c.id}?issue=${issue}`}>{c.title}</Link>
            </h3>
            <p><strong>{RELATION_LABEL[block.relation]}.</strong> {block.relationNote}</p>
            <p className="muted">
              {c.people.map((p) => `${p.name}: ${block.positions[p.id].length ? `${block.positions[p.id].length} documented item${block.positions[p.id].length > 1 ? "s" : ""}` : "nothing documented here"}`).join(" · ")}. A campaign page is the candidate's own statement.
            </p>
          </div>
        ))
      )}
      <p className="muted">Only races we have researched appear here. {issueById(issue)?.title} positions are shown as sourced, typed statements, never inferred from party.</p>
    </section>
  );
}
