import { ExternalLink } from "lucide-react";
import Link from "./link";
import { allActions } from "./government";
import { COMPARISONS } from "./compare-data";
import { STAGES } from "@/lib/gov-actions";
import { RELATION_LABEL } from "@/lib/compare";
import { issueById } from "@/lib/issues";

const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const actionsForIssue = (issue: string) => allActions(new Date().toISOString().slice(0, 10)).filter((a) => !a.ceremonial && a.issues?.includes(issue));
/** Comparisons that have something documented on this issue for at least one candidate. */
export const comparisonsForIssue = (issue: string) =>
  COMPARISONS.flatMap((c) => {
    const block = c.issues.find((i) => i.issue === issue);
    return block && Object.values(block.positions).some((p) => p.length) ? [{ c, block }] : [];
  });

/** "What government is doing" for an issue: newest tagged actions across Congress, the President and agencies. */
export function GovernmentForIssue({ issue, limit = 4 }: { issue: string; limit?: number }) {
  const items = actionsForIssue(issue);
  const shown = items.slice(0, limit);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`gov-${issue}`} className="connected">
      <h2 id={`gov-${issue}`}>What government is doing about this</h2>
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
      <p className="muted">
        <Link href={`/government?issue=${issue}`}>See all {items.length} tagged actions</Link> · <Link href="/government/president">Presidential actions, dated</Link>. Tagged by CRS policy area or title keywords; a stage tells you how far something has gotten, not whether it is good policy.
      </p>
    </section>
  );
}

/** What candidates in a published comparison have documented on this issue. */
export function CandidatesForIssue({ issue }: { issue: string }) {
  const rows = comparisonsForIssue(issue);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={`cand-${issue}`} className="connected">
      <h2 id={`cand-${issue}`}>What candidates have said about this</h2>
      {rows.map(({ c, block }) => (
        <div key={c.id} className="panel">
          <h3>
            <Link href={`/compare/${c.id}?issue=${issue}`}>{c.title}</Link>
          </h3>
          <p><strong>{RELATION_LABEL[block.relation]}.</strong> {block.relationNote}</p>
          <p className="muted">
            {c.people.map((p) => `${p.name}: ${block.positions[p.id].length ? `${block.positions[p.id].length} documented item${block.positions[p.id].length > 1 ? "s" : ""}` : "nothing documented here"}`).join(" · ")}. A campaign page is the candidate's own statement. {issueById(issue)?.title} positions are shown as sourced, typed statements, never inferred from party.
          </p>
        </div>
      ))}
    </section>
  );
}
