import { ChevronLeft, ExternalLink, Info } from "lucide-react";
import Link from "./link";
import { election, gaps, profiles } from "./help-me-vote";
import { CLAIM_LABEL, RESEARCH_AREAS, completeness, type Claim } from "@/lib/candidate";

const AREAS: [(typeof RESEARCH_AREAS)[number], string][] = [
  ["positions", "Public positions"],
  ["government-experience", "Government experience"],
  ["background", "Background"],
];
const last = (n: string) => n.trim().split(/\s+/).at(-1)!.toLowerCase();

export function CompareIndex() {
  const contests = election.contests.filter((c) => c.kind !== "retention" && profiles.some((p) => p.contestId === c.id));
  return (
    <>
      <Link href="/vote/colorado/contests" className="back-link">
        <ChevronLeft size={15} /> All offices & judges
      </Link>
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · COMPARE CANDIDATES</div>
        <h1>Compare candidates side by side.</h1>
        <p>Same questions for every candidate, in alphabetical order by last name. Nothing is ranked, scored or matched to you.</p>
      </div>
      <div className="measure-grid">
        {contests.map((c) => (
          <Link key={c.id} href={`/vote/colorado/compare/${c.id}`} className="measure-card">
            <h3>{c.office}</h3>
            <p>{profiles.filter((p) => p.contestId === c.id).length} of {c.candidates.filter((x) => x.status === "on-ballot").length} candidates have profiles</p>
            <span className="card-link">Compare</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function Compare({ contestId }: { contestId?: string }) {
  const c = election.contests.find((x) => x.id === contestId && x.kind !== "retention");
  if (!c) return <CompareIndex />;
  const cands = c.candidates.filter((x) => x.status === "on-ballot").sort((a, b) => last(a.name).localeCompare(last(b.name)));
  const rows: [string, (n: string) => React.ReactNode][] = [
    ["Listed party", (n) => cands.find((x) => x.name === n)?.affiliation ?? "None listed"],
    ...(cands.some((x) => x.runningMate) ? ([["Running mate", (n: string) => cands.find((x) => x.name === n)?.runningMate ?? "—"]] as [string, (n: string) => React.ReactNode][]) : []),
    ...AREAS.map(([area, label]) => [
      label,
      (n: string) => {
        const claims: Claim[] = profiles.find((p) => p.contestId === c.id && p.name === n)?.claims.filter((x) => x.area === area) ?? [];
        if (claims.length === 0)
          return <span className="muted">{profiles.some((p) => p.contestId === c.id && p.name === n) ? "No sourced information on this yet." : (gaps.find((g) => g.contestId === c.id && g.name === n)?.note ?? "Not yet researched.")}</span>;
        return (
          <ul className="compare-claims">
            {claims.map((x, i) => (
              <li key={i}>
                <span className="tag">{CLAIM_LABEL[x.kind].split(" (")[0]}</span> {x.text}{" "}
                <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                  {x.sourceTitle} <ExternalLink size={11} />
                </a>
              </li>
            ))}
          </ul>
        );
      },
    ]) as [string, (n: string) => React.ReactNode][],
    ["Research coverage", (n) => {
      const p = profiles.find((q) => q.contestId === c.id && q.name === n);
      return p ? `${completeness(p).covered.length} of ${RESEARCH_AREAS.length} areas sourced` : "No profile";
    }],
  ];
  return (
    <>
      <Link href="/vote/colorado/compare" className="back-link">
        <ChevronLeft size={15} /> All comparisons
      </Link>
      <div className="page-title">
        <div className="eyebrow">COMPARE · {c.office.toUpperCase()}</div>
        <h1>{c.office}: candidates side by side</h1>
        <p>Each row asks every candidate the same question. A blank row means we found no sourced information, not that a candidate has no view.</p>
      </div>
      <div className="notice">
        <Info size={18} /> Statements are what candidates say, paraphrased from the linked pages, and are not fact-checked. Differences in how much appears
        mostly reflect how much each candidate published. Machine-checked, not human-reviewed.
      </div>
      <div className="compare-wrap" role="region" aria-label={`Comparison table for ${c.office}`} tabIndex={0}>
        <table className="compare-grid">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Question</span>
              </th>
              {cands.map((x) => (
                <th scope="col" key={x.name}>
                  <Link href={profiles.some((p) => p.contestId === c.id && p.name === x.name) ? `/vote/colorado/candidate/${c.id}/${encodeURIComponent(x.name)}` : `/vote/colorado/contest/${c.id}`}>{x.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {cands.map((x) => (
                  <td key={x.name} data-label={x.name}>{cell(x.name)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <Link href={`/vote/colorado/contest/${c.id}`}>About the office and write-in candidates</Link>
      </p>
    </>
  );
}
