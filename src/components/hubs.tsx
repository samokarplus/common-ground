import Link from "./link";
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
  const rows: [string, string, string, string, number, [string, string][]][] = [
    ["Federal debt and budget totals", "U.S. Treasury (Fiscal Data)", (treasuryRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:fiscal)", 35, [["Federal spending briefing", "/issues/federal-spending"]]],
    ["Congress bills", "GovInfo bill status data", (billsRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script; scheduling not yet active", 3, [["Government actions", "/government"], ["Congress tracker", "/congress"]]],
    ["Federal Register documents", "Federal Register API", (frRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script; scheduling not yet active", 3, [["Government actions", "/government"]]],
    ["Consumer prices (CPI)", "Bureau of Labor Statistics", (cpiRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:cpi)", 45, [["Consumer prices briefing", "/issues/consumer-prices"]]],
    ["Presidential actions", "whitehouse.gov Presidential Actions", (presRaw as { retrievedAt: string }).retrievedAt, "Refreshed by script (npm run refresh:presidential)", 3, [["Presidential actions", "/government/president"]]],
    ["Ukraine appropriations", "Congressional Research Service (April 2024 update)", "2026-10-23", "Static; not updated automatically", 9999, [["Ukraine assistance briefing", "/issues/ukraine-assistance"]]],
    ["Abortion statistics", "CDC surveillance report (2022 data)", "2026-10-23", "Static; CDC publishes about once a year", 9999, [["Abortion statistics briefing", "/issues/abortion-statistics"]]],
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
              <th scope="col">Used in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c, d, max, used]) => {
              const f = freshness(c, now, max);
              return (
                <tr key={a}>
                  <th scope="row">{a}</th>
                  <td>{b}</td>
                  <td>
                    {day(c)} ({f.label}){f.stale ? " — out of date" : ""}
                  </td>
                  <td>{d}</td>
                  <td>{used.map(([l, h], i) => (<span key={h}>{i > 0 && ", "}<Link href={h}>{l}</Link></span>))}</td>
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
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">DATA</div>
        <h1>The data behind every number.</h1>
        <p>Every dataset behind the site: where it comes from, how fresh it is, and where it is used. Open a briefing to see the numbers charted with their definitions.</p>
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
