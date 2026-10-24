import Link from "./link";
import { BRIEFINGS } from "./briefings-data";
import billsRaw from "../../data/congress/bills.json";
import frRaw from "../../data/federal-register.json";
import treasuryRaw from "../../data/fiscal/treasury.json";
import { freshness } from "@/lib/freshness";

const day = (iso: string) => new Date(iso.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Where each data set comes from and how fresh it is. Ages are computed when the page opens. */
import cpiRaw from "../../data/stats/cpi-bls.json";
import presRaw from "../../data/government/presidential-actions.json";

export function SourceFreshness() {
  const now = new Date();
  const rows: [string, string, string, string, number][] = [
    ["Federal debt and budget totals", "U.S. Treasury (Fiscal Data)", (treasuryRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:fiscal)", 35],
    ["Congress bills", "GovInfo bill status data", (billsRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script; scheduling not yet active", 3],
    ["Federal Register documents", "Federal Register API", (frRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script; scheduling not yet active", 3],
    ["Consumer prices (CPI)", "Bureau of Labor Statistics", (cpiRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:cpi)", 45],
    ["Presidential actions", "whitehouse.gov Presidential Actions", (presRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:presidential)", 3],
    ["Ukraine appropriations", "Congressional Research Service (April 2024 update)", "2026-10-23", "Static; not updated automatically", 9999],
    ["Abortion statistics", "CDC surveillance report (2022 data)", "2026-10-23", "Static; CDC publishes about once a year", 9999],
  ];
  return (
    <section className="panel" aria-labelledby="freshness">
      <h2 id="freshness">Where the numbers come from, and how fresh they are</h2>
      <div className="table-wrap" role="region" aria-label="Data sources and freshness table" tabIndex={0}>
        <table>
          <caption className="sr-only">Data sources and freshness</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Source</th>
              <th scope="col">Last checked</th>
              <th scope="col">How it is updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c, d, max]) => {
              const f = freshness(c, now, max);
              return (
                <tr key={a}>
                  <th scope="row">{a}</th>
                  <td>{b}</td>
                  <td>
                    {day(c)} ({f.label}){f.stale ? " — out of date" : ""}
                  </td>
                  <td>{d}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">A data refresh is not an editorial review. Explanations are machine-checked and labeled as not human-reviewed.</p>
    </section>
  );
}

export function DataHub() {
  const withCharts = BRIEFINGS.filter((b) => b.sections.includes("data"));
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">DATA</div>
        <h1>America by the numbers, with the definitions in view.</h1>
        <p>A few important national statistics from official sources, each with its source, units, date range, what it measures and what it leaves out.</p>
      </div>
      <div className="briefing-grid">
        {withCharts.map((b) => {
          const charts = b.evidence.filter((e) => e.type === "chart").length;
          return (
            <Link key={b.id} href={`/issues/${b.id}`} className="briefing-card">
              <span className="eyebrow">{b.topic.toUpperCase()}</span>
              <h3>{b.question}</h3>
              <p>
                {charts} chart{charts === 1 ? "" : "s"} with data tables · {b.dataThrough}
              </p>
              <span className="card-link">Open the numbers →</span>
            </Link>
          );
        })}
      </div>
      <SourceFreshness />
    </>
  );
}

export function ExploreHub() {
  const items: [string, string, string][] = [
    ["/debate/maps", "Debate maps", "The strongest arguments on real questions, with facts, predictions and values kept apart."],
    ["/atlas", "Thought Atlas", "Eighty-six political and philosophical ideas and how they connect, with readings."],
    ["/paths", "Pathways", "Guided routes from a ballot question or a bill to the ideas behind it."],
    ["/values", "My Values", "A private place to reflect on what matters to you. Optional, never scored."],
    ["/chain", "Promises, votes and outcomes", "Follow one decision from promise to outcome, separating what is and is not documented."],
    ["/debate", "Debate Lab", "Practice examining a position fairly."],
  ];
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">EXPLORE</div>
        <h1>Follow your curiosity.</h1>
        <p>Optional tools for thinking: competing arguments, big ideas and private reflection. They support the evidence on the rest of the site and never tell you what to conclude.</p>
      </div>
      <div className="briefing-grid">
        {items.map(([href, title, text]) => (
          <Link key={href} href={href} className="briefing-card">
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="card-link">Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
