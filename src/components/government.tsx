import { useMemo, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import Link, { routeSearch } from "./link";
import billsRaw from "../../data/congress/bills.json";
import frRaw from "../../data/federal-register.json";
import { freshness } from "@/lib/freshness";
import presidentialRaw from "../../data/government/presidential-actions.json";
import type { PresidentialAction } from "@/lib/presidential";
import { ISSUES } from "@/lib/issues";
import { STAGES, applyFilters, facets, mergeActions, type Filters, type FrRecord, type GovAction, type StageId } from "@/lib/gov-actions";
import type { Bill } from "@/lib/congress";

const bills = billsRaw as unknown as { retrievedAt: string; bills: Bill[] };
const presidential = presidentialRaw as unknown as { retrievedAt: string; actions: PresidentialAction[] };
const fr = frRaw as unknown as { retrievedAt: string; results: FrRecord[] };
const KIND: Record<GovAction["kind"], string> = { bill: "Bill", law: "Law", "executive-order": "Executive order", "presidential-document": "Presidential document", proclamation: "Proclamation", memorandum: "Memorandum", "proposed-rule": "Proposed rule", "final-rule": "Final rule", notice: "Notice" };
const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function allActions(today: string) {
  return mergeActions(bills.bills, fr.results, presidential.actions, today);
}

export default function Government() {
  const today = new Date().toISOString().slice(0, 10);
  const everything = useMemo(() => allActions(today), [today]);
  const all = useMemo(() => everything.filter((a) => !a.ceremonial), [everything]);
  const hiddenCeremonial = everything.length - all.length;
  const initial = new URLSearchParams(routeSearch()).get("stage") as StageId | null;
  const initialIssue = new URLSearchParams(routeSearch()).get("issue");
  const [f, setF] = useState<Filters>({ stage: initial && STAGES.some((s) => s.id === initial) ? initial : "all", branch: "all", agencyOrTopic: "", sinceDays: 0, query: "", issue: ISSUES.some((i) => i.id === initialIssue) ? (initialIssue as string) : undefined });
  const [limit, setLimit] = useState(24);
  const shown = useMemo(() => applyFilters(all, f, today), [all, f, today]);
  const set = (p: Partial<Filters>) => {
    setF({ ...f, ...p });
    setLimit(24);
  };
  const fc = freshness(bills.retrievedAt, new Date(), 3);
  const ff = freshness(fr.retrievedAt, new Date(), 3);
  const fp = freshness(presidential.retrievedAt, new Date(), 3);
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">GOVERNMENT</div>
        <h1>What is the federal government doing?</h1>
        <p>Laws from Congress, presidential actions and agency rules, placed on one ladder so you can see how far each has actually gotten, and what it is not.</p>
      </div>
      <nav className="subnav" aria-label="Government views">
        <Link href="/government" aria-current="page">All actions</Link>
        <Link href="/government/president">Presidential actions, dated</Link>
        <Link href="/compare">Compare candidates</Link>
      </nav>

      <details className="disclosure ladder-box" open={typeof window !== "undefined" && window.matchMedia?.("(min-width: 900px)").matches}>
        <summary><h2 id="ladder">Announced is not enacted: the stages</h2></summary>
        <p className="muted">A headline can describe any of these. They are different things, and only some change the law.</p>
        <ol className="ladder">
          {STAGES.map((s) => (
            <li key={s.id}>
              <button className={f.stage === s.id ? "selected" : ""} aria-pressed={f.stage === s.id} onClick={() => set({ stage: f.stage === s.id ? "all" : s.id })}>
                <strong>{s.label}</strong>
              </button>
              <span>{s.means}</span>
              <span className="not-this"><strong>What it isn't:</strong> {s.notThis}</span>
            </li>
          ))}
        </ol>
      </details>

      <section aria-labelledby="explore-actions">
        <h2 id="explore-actions">Recent actions</h2>
        <div className={"note" + (fc.stale || ff.stale || fp.stale ? " stale" : "")} role="note">
          <Info size={15} aria-hidden="true" />{" "}
          <strong>Selected, not comprehensive.</strong> Congress: the {bills.bills.length} most recently updated bills, retrieved {fmt(bills.retrievedAt.slice(0, 10))} ({fc.label}). Federal Register: the {fr.results.length} newest documents, retrieved {fmt(fr.retrievedAt.slice(0, 10))} ({ff.label}). Presidential actions: the {presidential.actions.length} newest on whitehouse.gov, retrieved {fmt(presidential.retrievedAt.slice(0, 10))} ({fp.label}).{hiddenCeremonial > 0 && ` ${hiddenCeremonial} commemorative proclamations are hidden (picked by title, so the rule can be wrong).`}
          {(fc.stale || ff.stale || fp.stale) && " One of these snapshots is out of date."} For complete lists use{" "}
          <a href="https://www.congress.gov/" target="_blank" rel="noreferrer">Congress.gov</a> and{" "}
          <a href="https://www.federalregister.gov/" target="_blank" rel="noreferrer">the Federal Register</a>.
        </div>
        <div className="filter-row" role="group" aria-label="Filter government actions">
          <label className="topic-select">
            <span className="sr-only">Search</span>
            <input type="search" placeholder="Search titles, agencies, topics" value={f.query} onChange={(e) => set({ query: e.target.value })} />
          </label>
          <label className="topic-select">
            <span className="sr-only">Issue</span>
            <select value={f.issue ?? ""} onChange={(e) => set({ issue: e.target.value || undefined })}>
              <option value="">Any issue</option>
              {ISSUES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </label>
          <label className="topic-select">
            <span className="sr-only">Stage</span>
            <select value={f.stage} onChange={(e) => set({ stage: e.target.value as Filters["stage"] })}>
              <option value="all">Any stage</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="topic-select">
            <span className="sr-only">Branch</span>
            <select value={f.branch} onChange={(e) => set({ branch: e.target.value as Filters["branch"] })}>
              <option value="all">Any branch</option>
              <option>Congress</option>
              <option>President</option>
              <option>Agencies</option>
            </select>
          </label>
          <label className="topic-select">
            <span className="sr-only">Agency or topic</span>
            <select value={f.agencyOrTopic} onChange={(e) => set({ agencyOrTopic: e.target.value })}>
              <option value="">Any agency or topic</option>
              {facets(all).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="topic-select">
            <span className="sr-only">Date</span>
            <select value={f.sinceDays} onChange={(e) => set({ sinceDays: Number(e.target.value) })}>
              <option value={0}>Any date in the snapshot</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </div>
        <p className="results-count" aria-live="polite">
          {shown.length} of {all.length} actions
        </p>
        <ul className="action-feed">
          {shown.slice(0, limit).map((a) => {
            const stage = STAGES.find((s) => s.id === a.stage)!;
            return (
              <li key={a.id} className="action-item">
                <div className="card-meta">
                  <span className="tag">{KIND[a.kind]}</span>
                  {KIND[a.kind].toLowerCase() !== stage.label.toLowerCase() && <span className="tag stage">{stage.label}</span>}
                  <span>
                    {a.dateLabel} {fmt(a.date)}
                  </span>
                </div>
                <h3>
                  <Link href={a.href}>{a.title}</Link>
                </h3>
                <p>{a.detail}</p>
                <p className="muted">
                  {a.branch}
                  {a.agency ? ` · ${a.agency}` : ""}
                  {a.topic ? ` · ${a.topic}` : ""} ·{" "}
                  <a href={a.sourceUrl} target="_blank" rel="noreferrer">
                    Official record <ExternalLink size={12} />
                  </a>
                </p>
              </li>
            );
          })}
        </ul>
        {shown.length > limit && (
          <button className="button secondary" onClick={() => setLimit(limit + 24)}>
            Show more ({shown.length - limit} remaining)
          </button>
        )}
        {shown.length === 0 && <p className="empty">Nothing in the snapshot matches those filters. That does not mean nothing happened; the snapshot is limited.</p>}
        {!all.some((a) => a.kind === "executive-order") && null}
        {f.stage === "executive-action" && (
          <p className="muted">
            Executive orders appear here only when they are among the newest Federal Register documents in the snapshot. Common Ground could not refresh the full list of presidential documents; see the Federal Register for every order.
          </p>
        )}
      </section>

      <section aria-labelledby="deeper" className="panel">
        <h2 id="deeper">Go deeper</h2>
        <ul className="claims">
          <li><Link href="/congress">Congress tracker: bills, sponsors, votes and timelines</Link></li>
          <li><Link href="/legislation">Federal Register explorer: rules, notices and presidential documents</Link></li>
          <li><Link href="/congress/how-it-works">How a bill becomes law</Link></li>
          <li><Link href="/chain">Follow one bill from introduction to law, stage by stage</Link></li>
        </ul>
      </section>
    </>
  );
}
