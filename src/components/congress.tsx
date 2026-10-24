import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ExternalLink, Info } from "lucide-react";
import GovSubnav from "./gov-subnav";
import Link from "./link";
import raw from "../../data/congress/bills.json";
import { BillSchema, BILL_STATUSES, STATUS_LABEL, type Bill, type BillStatus } from "@/lib/congress";
import { z } from "zod";
import { POLICY_AREA_IDEAS } from "@/lib/crosslinks";
import { atlasNodes } from "@/lib/atlas";
import { freshness } from "@/lib/freshness";

const snapshot = z
  .object({ source: z.string(), sourceUrl: z.string(), congress: z.number(), retrievedAt: z.string(), selection: z.string(), bills: z.array(BillSchema) })
  .parse(raw);

const TYPE_LABEL: Record<string, string> = { hr: "H.R.", s: "S.", hjres: "H.J.Res.", sjres: "S.J.Res." };
const label = (b: Bill) => `${TYPE_LABEL[b.type] ?? b.type.toUpperCase()} ${b.number}`;
const day = (d: string) => new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Snapshot() {
  const f = freshness(snapshot.retrievedAt, new Date(), 3);
  return (
    <p className={"note" + (f.stale ? " stale" : "")} role="note">
      {f.stale && <strong>Out of date: this snapshot is {f.label}. Check Congress.gov for current status. </strong>}
      <Info size={15} aria-hidden="true" /> Dated snapshot of the {snapshot.bills.length} most recently updated bills from{" "}
      <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer">
        GovInfo BILLSTATUS
      </a>
      , retrieved {day(snapshot.retrievedAt)}. {snapshot.selection} Not a live feed and not every bill in the {snapshot.congress}th Congress.
    </p>
  );
}

function Explainer() {
  const steps: [string, string][] = [
    ["Introduction", "A member of the House or Senate introduces a bill. Anyone can ask a member to introduce one, but only members can."],
    ["Committee", "A committee studies the bill, may hold hearings, amend it, or let it sit. Most bills never get past this stage."],
    ["Floor action", "If it reaches the floor, the chamber debates, may amend, and votes. House and Senate rules differ, and the Senate often needs 60 votes to end debate."],
    ["Other chamber", "The other chamber repeats the process. Bills usually need to pass in identical form."],
    ["Resolving differences", "If versions differ, one chamber can accept the other's version, or a conference committee or negotiation produces a compromise both vote on."],
    ["President", "The President can sign, veto, or do nothing. Congress can override a veto with two-thirds of each chamber. Unsigned bills become law after 10 days (Sundays excepted) unless Congress has adjourned, in which case a pocket veto can apply."],
    ["Law", "A signed bill becomes a Public Law with a number such as 119-21 (Congress 119, the 21st law). Agencies then write rules to carry it out."],
  ];
  return (
    <>
      <Link href="/congress" className="back-link">
        <ChevronLeft size={15} /> Congress
      </Link>
      <div className="page-title">
        <div className="eyebrow">CONGRESS · HOW IT WORKS</div>
        <h1>How a federal bill becomes law.</h1>
        <p>General civics guidance, simplified. Real bills often take detours: they are folded into other bills, attached as amendments, or passed through special procedures such as budget reconciliation.</p>
      </div>
      <ol className="process-steps">
        {steps.map(([t, d], i) => (
          <li key={t}>
            <h3>
              {i + 1}. {t}
            </h3>
            <p>{d}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

function List() {
  const [status, setStatus] = useState<BillStatus | "all">("all");
  const [chamber, setChamber] = useState("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(30);
  const list = useMemo(
    () =>
      snapshot.bills.filter(
        (b) =>
          (status === "all" || b.status === status) &&
          (chamber === "all" || b.originChamber === chamber) &&
          (!q.trim() || `${label(b)} ${b.title} ${b.policyArea ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [status, chamber, q],
  );
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">CONGRESS · {snapshot.congress}TH CONGRESS</div>
        <h1>Follow federal legislation.</h1>
        <p>
          Official bill status from GovInfo. A bill's status shows how far it got, not whether it is good policy.{" "}
          <Link href="/congress/how-it-works">How a bill becomes law →</Link>
        </p>
      </div>
      <GovSubnav current="congress" />
      <Snapshot />
      <div className="filter-row" role="group" aria-label="Filter bills by status">
        {(["all", ...BILL_STATUSES] as const).map((s) => (
          <button key={s} className={status === s ? "selected" : ""} aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
        <label className="topic-select">
          <span className="sr-only">Chamber of origin</span>
          <select value={chamber} onChange={(e) => setChamber(e.target.value)}>
            <option value="all">Both chambers</option>
            <option>House</option>
            <option>Senate</option>
          </select>
        </label>
        <label className="topic-select">
          <span className="sr-only">Search bills</span>
          <input type="search" placeholder="Search number, title, topic" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <p className="results-count" aria-live="polite">
        {list.length} of {snapshot.bills.length} bills
      </p>
      <div className="measure-grid">
        {list.slice(0, limit).map((b) => (
          <Link key={b.id} href={`/congress/bill/${b.id}`} className="measure-card">
            <div className="card-meta">
              <span className="tag">{label(b)}</span>
              <span className="tag">{STATUS_LABEL[b.status]}</span>
            </div>
            <h3>{b.title}</h3>
            <p>
              {b.sponsor ? b.sponsor.name : "Sponsor not listed"}
              {b.latestAction ? ` · Latest: ${day(b.latestAction.date)}` : ""}
            </p>
            <span className="card-link">
              Bill details <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
      {list.length > limit && (
        <button className="button secondary load-more" onClick={() => setLimit(limit + 30)}>
          Show {Math.min(30, list.length - limit)} more of {list.length - limit} remaining
        </button>
      )}
      {list.length === 0 && <p className="empty">No bills in this snapshot match those filters.</p>}
    </>
  );
}

function Detail({ id }: { id?: string }) {
  const [showAllActions, setShowAllActions] = useState(false);
  const b = snapshot.bills.find((x) => x.id === id);
  if (!b)
    return (
      <>
        <Link href="/congress" className="back-link">
          <ChevronLeft size={15} /> Congress
        </Link>
        <h1>Bill outside this snapshot</h1>
        <p className="empty">That bill is not in the current snapshot. This does not mean it was withdrawn or does not exist.</p>
        <a className="button secondary" href="https://www.congress.gov/search" target="_blank" rel="noreferrer">Search the official Congress.gov record <ExternalLink size={14} /></a>
      </>
    );
  return (
    <>
      <Link href="/congress" className="back-link">
        <ChevronLeft size={15} /> Congress
      </Link>
      <div className="page-title">
        <div className="eyebrow">
          {label(b)} · {STATUS_LABEL[b.status].toUpperCase()}
        </div>
        <h1>{b.title}</h1>
        <p>
          Introduced {day(b.introducedDate)} in the {b.originChamber}
          {b.sponsor ? ` by ${b.sponsor.name}` : ""}. {b.cosponsorCount} cosponsor{b.cosponsorCount === 1 ? "" : "s"}.
          {b.publicLaw ? ` Became Public Law ${b.publicLaw}.` : ""}
        </p>
      </div>
      <Snapshot />
      <p className="note" role="note">
        {b.status === "enacted"
          ? "This bill has become law."
          : "No enactment is recorded in this snapshot. Check the official record for changes since retrieval."}{" "}
        Status is derived from the official action log below; check Congress.gov for the authoritative record.
      </p>
      {b.crsSummary && (
        <section>
          <h2>Official summary</h2>
          <p>{b.crsSummary}</p>
          <p className="card-meta">Summary by the Congressional Research Service (Library of Congress). Plain text; may be shortened.</p>
        </section>
      )}
      <section>
        <h2>Details</h2>
        <ul>
          {b.policyArea && <li>Policy area (official label): {b.policyArea}</li>}
          {b.committees.length > 0 && <li>Committees: {b.committees.join("; ")}</li>}
          <li>Record last updated: {day(b.updateDate)}</li>
          {b.votes.map((v) => (
            <li key={v.url}>
              {v.chamber} recorded vote, {day(v.date)}
              {v.action ? ` (official action text: “${v.action}”)` : ""}:{" "}
              <a href={v.url} target="_blank" rel="noreferrer">
                official roll call
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Legislative timeline</h2>
        <ol className="timeline">
          {b.actions.slice(0, showAllActions ? undefined : 25).map((a, i) => (
            <li key={i}>
              <strong>{day(a.date)}</strong> — {a.text}
            </li>
          ))}
        </ol>
        {b.actions.length > 25 && (
          <button className="button secondary" aria-expanded={showAllActions} onClick={() => setShowAllActions(!showAllActions)}>
            {showAllActions ? "Show only the 25 most recent actions" : `Show all ${b.actions.length} official actions`}
          </button>
        )}
      </section>
      {b.policyArea && (
        <section>
          <h2>Related reading</h2>
          <p className="muted">Editorial suggestions based on the bill's official policy area, "{b.policyArea}". They are not an analysis of this bill.</p>
          <ul>
            {(POLICY_AREA_IDEAS[b.policyArea] ?? []).map((id) => {
              const n = atlasNodes.find((x) => x.id === id);
              return n ? (
                <li key={id}>
                  <Link href={`/atlas?node=${id}`}>Thought Atlas: {n.name}</Link>
                </li>
              ) : null;
            })}
            <li>
              <Link href={`/legislation?q=${encodeURIComponent(b.policyArea.split(/[ ,]+/)[0])}`}>Federal Register documents mentioning “{b.policyArea.split(/[ ,]+/)[0]}”</Link>{" "}
              <span className="muted">(keyword match, not related by analysis)</span>
            </li>
            <li>
              <Link href="/chain">See how a bill's journey is recorded, stage by stage</Link>
            </li>
          </ul>
        </section>
      )}
      <p>
        <a className="button secondary" href={b.url} target="_blank" rel="noreferrer">
          Read on Congress.gov <ExternalLink size={14} />
        </a>
      </p>
    </>
  );
}

export default function Congress({ parts }: { parts: string[] }) {
  if (parts[0] === "how-it-works") return <Explainer />;
  if (parts[0] === "bill") return <Detail id={parts[1]} />;
  return <List />;
}
