import raw from "../../data/research-health.json";
import linkRaw from "../../data/link-status.json";
import { freshness } from "@/lib/freshness";
const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", ...opts });

type Src = { snapshotRetrievedAt?: string; dataVerifiedAt?: string; lastSuccess?: string; lastFailure?: string; lastError?: string };
const health = raw as unknown as {
  generatedOn: string;
  sources: Record<string, Src & { billCount?: number; reviewQueue?: Record<string, number> }>;
  upcomingElectionDeadlines: { date: string; label: string }[];
  knownGaps: string[];
};

const ROWS: [id: string, label: string, kind: "automated" | "manual", maxAge: number][] = [
  ["federal-register", "Federal Register (daily refresh script)", "automated", 3],
  ["govinfo-billstatus", "Congress bills, GovInfo (refresh script)", "automated", 3],
  ["colorado-2026-election", "Colorado 2026 election data (manual, machine-checked)", "manual", 7],
];

const links = linkRaw as { checkedOn: string; summary: { total: number; ok: number; dead: number; inconclusive: number }; results: { url: string; status: string }[] };

export default function HealthPanel() {
  const now = new Date();
  const q = health.sources["colorado-2026-election"]?.reviewQueue ?? {};
  return (
    <section className="panel" aria-labelledby="research-health">
      <h2 id="research-health">Research health</h2>
      <p className="muted">
        Ages are computed when you open this page, from the last time each source's data actually changed. A source can be checked without
        changing; failed checks are listed. The scheduled workflow is <strong>not yet active</strong>, so refreshes currently run by hand.
        Report generated {health.generatedOn}.
      </p>
      <div className="compare-table" role="table" aria-label="Source freshness">
        <div role="row" className="compare-head">
          <span role="columnheader">Source</span>
          <span role="columnheader">Data last changed</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Last problem</span>
        </div>
        {ROWS.map(([id, label, , maxAge]) => {
          const s = health.sources[id] ?? {};
          const when = s.snapshotRetrievedAt ?? s.dataVerifiedAt ?? "";
          const f = freshness(when, now, maxAge);
          return (
            <div role="row" key={id}>
              <span role="cell"><strong>{label}</strong></span>
              <span role="cell">{when ? `${fmtDay(when.slice(0, 10), { year: "numeric" })} (${f.label})` : "never"}</span>
              <span role="cell">{f.stale ? `Stale: older than ${maxAge} days` : "Fresh"}</span>
              <span role="cell">{s.lastError ? `${s.lastError} (${s.lastFailure})` : "None recorded"}</span>
            </div>
          );
        })}
      </div>
      <h3>Citation links</h3>
      <p>
        Checked {links.checkedOn}: {links.summary.ok} of {links.summary.total} cited links responded normally, {links.summary.dead} are broken,
        {" "}{links.summary.inconclusive} could not be confirmed. "Could not confirm" usually means the site blocks automated requests (a person can
        usually still open it); it is not a verdict. The check runs by hand with <code>npm run check:links</code>.
      </p>
      {links.results.filter((r) => r.status !== "ok").length > 0 && (
        <ul>
          {links.results
            .filter((r) => r.status !== "ok")
            .map((r) => (
              <li key={r.url}>
                {r.status === "dead" ? "Broken" : "Unconfirmed"}:{" "}
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.url}
                </a>
              </li>
            ))}
        </ul>
      )}
      <h3>Editorial review queue (Colorado measure explanations)</h3>
      <ul>
        <li>Drafts, hidden: {q.draft ?? 0}</li>
        <li>Source-checked by an AI-assisted process, shown with a "not human-reviewed" label: {q["source-checked"] ?? 0}</li>
        <li>Human-reviewed: {q.reviewed ?? 0}</li>
        <li>Needs re-review after a source change: {q["needs-re-review"] ?? 0}</li>
      </ul>
      <h3>Known gaps</h3>
      <ul>{health.knownGaps.map((g) => <li key={g}>{g}</li>)}</ul>
    </section>
  );
}
