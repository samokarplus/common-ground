import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  CircleHelp,
  Download,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Printer,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Vote,
} from "lucide-react";
import Link, { routeSearch } from "./link";
import raw from "../../data/elections/colorado-2026.json";
import { LOCAL_RACE_TYPES } from "@/lib/local-races";
import { JURISDICTIONS, coverageOf, officialElectionOffices } from "@/lib/states";
import rawProfiles from "../../data/elections/colorado-2026-profiles.json";
import rawGaps from "../../data/elections/colorado-2026-gaps.json";
import { CLAIM_KINDS, CLAIM_LABEL, RESEARCH_AREAS, completeness, validateGaps, validateProfiles, type Profile } from "@/lib/candidate";
import {
  COVERAGE,
  isHumanReviewed,
  GUIDE_KEY,
  KIND_LABEL,
  ORIGIN_LABEL,
  THRESHOLD_LABEL,
  daysUntil,
  deadlineState,
  electionPhase,
  emptyGuide,
  guideExport,
  guideItemIds,
  guideProgress,
  isStale,
  measureCoverage,
  parseElection,
  parseGuide,
  publishedExplanation,
  updateGuide,
  type Contest,
  type Election,
  type Guide,
  type GuideEntry,
  type Measure,
} from "@/lib/election";

export const election: Election = parseElection(raw);
const profiles: Profile[] = validateProfiles(rawProfiles, election.contests);
const gaps = validateGaps(rawGaps, election.contests, profiles);
const gapFor = (contestId: string, name: string) => gaps.find((g) => g.contestId === contestId && g.name === name);
const profileFor = (contestId: string, name: string) => profiles.find((p) => p.contestId === contestId && p.name === name);
const AREA_LABEL: Record<(typeof RESEARCH_AREAS)[number], string> = {
  background: "Background",
  "government-experience": "Government experience",
  positions: "Public positions",
  "voting-record": "Voting record",
  "campaign-website": "Official campaign website",
};
const allIds = guideItemIds(election);
const sourceById = new Map(election.sources.map((s) => [s.id, s]));

const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...opts,
  });
const fmtInstant = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: election.timeZone,
    timeZoneName: "short",
  });

/* ---------- Private guide store: memory by default, device storage only on opt-in ---------- */

function readStorage(): string | null {
  try {
    return localStorage.getItem(GUIDE_KEY);
  } catch {
    return null;
  }
}
let guideState: Guide = parseGuide(readStorage(), allIds);
let persistState = readStorage() !== null;
let storageError = "";
const listeners = new Set<() => void>();
let snapshot = { guide: guideState, persist: persistState, storageError };
function emit() {
  snapshot = { guide: guideState, persist: persistState, storageError };
  listeners.forEach((l) => l());
}
function writeStorage() {
  if (!persistState) return;
  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(guideState));
    storageError = "";
  } catch {
    storageError = "This browser blocked device storage. Your guide is kept only until you close the page.";
  }
}
const guideStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => snapshot,
  update(id: string, patch: Partial<GuideEntry>) {
    guideState = updateGuide(guideState, id, patch);
    writeStorage();
    emit();
  },
  setPersist(on: boolean) {
    persistState = on;
    if (on) writeStorage();
    else
      try {
        localStorage.removeItem(GUIDE_KEY);
      } catch {}
    emit();
  },
  clear() {
    guideState = emptyGuide();
    persistState = false;
    try {
      localStorage.removeItem(GUIDE_KEY);
    } catch {}
    emit();
  },
};
function useGuide() {
  return useSyncExternalStore(guideStore.subscribe, guideStore.get, guideStore.get);
}

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Shared pieces ---------- */

function CoverageBadge({ c }: { c: { label: string; detail: string } }) {
  const tone =
    c === COVERAGE.verifiedStatewide ? "ok" : c === COVERAGE.demo ? "demo" : c === COVERAGE.notCovered ? "gap" : "warn";
  return (
    <span className={"coverage-badge " + tone} title={c.detail}>
      {tone === "ok" ? <ShieldCheck size={13} /> : <Info size={13} />} {c.label}
    </span>
  );
}

function Freshness() {
  const now = new Date();
  const stale = isStale(election, now);
  return (
    <div className={"freshness " + (stale ? "stale" : "")} role={stale ? "alert" : undefined}>
      {stale && <TriangleAlert size={15} />}
      <span>
        <strong>Last checked against official sources:</strong> {fmtInstant(election.dataVerifiedAt)}
      </span>
      <span>
        <strong>Ballot certified:</strong> {fmtDay(election.certifiedOn, { year: "numeric" })}
      </span>
      {stale && (
        <span>
          This information may be out of date. Confirm details with your{" "}
          <a href="https://www.coloradosos.gov/pubs/elections/Resources/CountyElectionOffices.html" target="_blank" rel="noreferrer">
            county clerk
          </a>
          .
        </span>
      )}
    </div>
  );
}

function SourceList({ ids }: { ids: string[] }) {
  return (
    <ul className="source-list">
      {ids.map((id) => {
        const s = sourceById.get(id);
        if (!s) return null;
        return (
          <li key={id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} <ExternalLink size={12} />
            </a>
            <span>
              {s.publisher} · {s.kind === "official-primary" ? "Official primary source" : "Official nonpartisan analysis"} · checked{" "}
              {fmtDay(s.retrievedAt, { year: "numeric" })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function VoteNav({ here }: { here: string }) {
  const steps = [
    ["/vote/colorado", "1 · Find your ballot", "overview"],
    ["/vote/colorado/measures", "2 · Measures", "measures"],
    ["/vote/colorado/contests", "3 · Offices & judges", "contests"],
    ["/vote/my-guide", "4 · My research guide", "guide"],
  ] as const;
  return (
    <nav className="vote-steps" aria-label="Help Me Vote steps">
      {steps.map(([href, label, id]) => (
        <Link key={id} href={href} aria-current={here === id ? "page" : undefined} className={here === id ? "active" : ""}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function GuideControls({ id, label }: { id: string; label: string }) {
  const { guide } = useGuide();
  const entry = guide.entries[id] || {};
  const [open, setOpen] = useState(!!entry.note);
  const flags: [keyof GuideEntry, string][] = [
    ["read", "I've read this"],
    ["research", "Need to research"],
    ["question", "I have questions"],
  ];
  return (
    <div className="guide-controls" role="group" aria-label={`Private research notes for ${label}`}>
      {flags.map(([k, text]) => (
        <label key={k} className="check-chip">
          <input
            type="checkbox"
            checked={!!entry[k]}
            onChange={(e) => guideStore.update(id, { [k]: e.target.checked })}
          />
          {text}
        </label>
      ))}
      <button className="link-button" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Hide note" : entry.note ? "Edit note" : "Add a private note"}
      </button>
      {open && (
        <label className="field-label guide-note">
          Private note (stays in this browser)
          <textarea
            value={entry.note || ""}
            maxLength={5000}
            onChange={(e) => guideStore.update(id, { note: e.target.value })}
            placeholder="Questions to look into, sources to check…"
          />
        </label>
      )}
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-link">
      <ChevronLeft size={15} /> {label}
    </Link>
  );
}

/* ---------- Pages ---------- */

function StatePicker() {
  const [code, setCode] = useState("");
  const name = JURISDICTIONS.find(([c]) => c === code)?.[1];
  return (
    <div className="panel">
      <h2>Another state?</h2>
      <label className="field-label" htmlFor="state-pick">
        Choose your state
      </label>
      <select id="state-pick" value={code} onChange={(e) => setCode(e.target.value)}>
        <option value="">Select a state…</option>
        {JURISDICTIONS.map(([c, n]) => (
          <option key={c} value={c}>
            {n}
            {coverageOf(c) === "statewide-verified" ? " — covered" : ""}
          </option>
        ))}
      </select>
      <div aria-live="polite">
        {name &&
          (coverageOf(code) === "statewide-verified" ? (
            <p>
              <Link href="/vote/colorado">Open the {name} guide <ArrowRight size={14} /></Link>
            </p>
          ) : (
            <p>
              We have not verified ballot information for {name} yet, and we won't show unverified information. Your state election
              office has your official ballot and deadlines.
            </p>
          ))}
      </div>
      <a href={officialElectionOffices} target="_blank" rel="noreferrer" className="button secondary">
        Find your state election office <ExternalLink size={14} />
      </a>
      <p className="muted">
        Or use <a href="https://vote.gov" target="_blank" rel="noreferrer">vote.gov</a> to register or check your registration.
      </p>
    </div>
  );
}

function Landing() {
  const now = new Date();
  const phase = electionPhase(election, now);
  return (
    <>
      <div className="page-title vote-hero">
        <div className="eyebrow">HELP ME VOTE · 2026 MIDTERMS</div>
        <h1>Understand your ballot. Decide for yourself.</h1>
        <p>
          Plain-language, source-linked information about what's on Colorado ballots — with clear labels showing where our coverage
          ends. We never tell you how to vote, never match you to candidates, and never ask for your address.
        </p>
      </div>
      {phase.phase === "before" && (
        <div className="notice election-countdown">
          <Vote size={18} /> Colorado's general election is <strong>{fmtDay(election.electionDate, { year: "numeric" })}</strong> —{" "}
          {phase.days === 1 ? "tomorrow" : `${phase.days} days from today`}.
        </div>
      )}
      <div className="two-columns">
        <Link href="/vote/colorado" className="panel state-card">
          <MapPin size={26} />
          <div className="eyebrow">AVAILABLE NOW</div>
          <h2>Colorado</h2>
          <p>
            All {election.measures.filter((m) => m.scope === "statewide").length} statewide measures, statewide offices, and statewide
            judicial retention questions — plus links to your official personal ballot.
          </p>
          <span className="button primary">
            Start with Colorado <ArrowRight size={15} />
          </span>
        </Link>
        <StatePicker />
      </div>
      <div className="panel">
        <h2>How this works</h2>
        <ol className="how-list">
          <li><strong>Find your official ballot.</strong> Only your county clerk knows exactly which districts and races apply to your address.</li>
          <li><strong>See what we cover.</strong> Every item is labeled: verified statewide, only in some areas, or not covered.</li>
          <li><strong>Read the measures.</strong> Official titles, the nonpartisan Blue Book analysis, fiscal estimates, and what's unclear.</li>
          <li><strong>Meet the offices.</strong> What each office does and who is on the ballot — the same facts for every candidate.</li>
          <li><strong>Keep private notes.</strong> Mark what you've read and what you want to research. Notes stay in your browser.</li>
          <li><strong>Print your checklist</strong> and take it with you while you research.</li>
        </ol>
      </div>
      <div className="two-columns">
        <div className="panel">
          <ShieldCheck size={22} />
          <h3>Our privacy promise</h3>
          <p>
            No account, no address, no location detection, no tracking. Your notes are kept in this page unless you choose to save them
            on this device, and you can delete them any time.
          </p>
          <Link href="/privacy">Privacy details <ArrowUpRight size={13} /></Link>
        </div>
        <div className="panel">
          <CircleHelp size={22} />
          <h3>New to ballots?</h3>
          <p>A three-minute primer on reading a ballot, plus definitions for terms like "retention," "TABOR," and "statutory."</p>
          <Link href="/vote/how-to-read">How to read your ballot <ArrowRight size={13} /></Link>
        </div>
      </div>
      <p className="muted">
        Want to see how an explainer works before diving in? Try the <Link href="/vote/demo">fictional practice measure</Link> (clearly
        labeled, not a real ballot item).
      </p>
    </>
  );
}

function Overview() {
  const now = new Date();
  return (
    <>
      <BackLink href="/vote" label="Help Me Vote" />
      <div className="page-title">
        <div className="eyebrow">COLORADO · GENERAL ELECTION · {fmtDay(election.electionDate, { year: "numeric" }).toUpperCase()}</div>
        <h1>Colorado's 2026 ballot, explained.</h1>
        <p>Start with your official ballot. Then use this guide to research the statewide items every Colorado voter sees.</p>
      </div>
      <VoteNav here="overview" />
      <Freshness />
      <div className="panel highlight-panel">
        <h2>Step 1 · Get your official, personal ballot</h2>
        <p>
          Your exact ballot depends on your registered address — your congressional and legislative districts, county, city, school
          district, and special districts. <strong>A ZIP code or city isn't enough to know which races you'll see</strong>, so we don't
          guess.
        </p>
        <div className="link-stack">
          {election.officialLinks
            .filter((l) => ["govote", "county-clerks"].includes(l.id))
            .map((l) => (
              <a key={l.id} className="button primary" href={l.url} target="_blank" rel="noreferrer">
                {l.label} <ExternalLink size={14} />
              </a>
            ))}
        </div>
      </div>
      <div className="panel">
        <h2>Step 2 · What this guide covers</h2>
        <div className="coverage-table" role="table" aria-label="Coverage">
          <div role="row">
            <span role="cell"><CoverageBadge c={COVERAGE.verifiedStatewide} /></span>
            <span role="cell">
              All {election.measures.filter((m) => m.scope === "statewide").length} statewide ballot measures; U.S. Senate, Governor,
              Secretary of State, Treasurer, Attorney General; statewide judicial retention.
            </span>
          </div>
          <div role="row">
            <span role="cell"><CoverageBadge c={COVERAGE.district} /></span>
            <span role="cell">Ballot Issue 7A (Front Range Passenger Rail District) — listed, but only voters inside that district see it.</span>
          </div>
          <div role="row">
            <span role="cell"><CoverageBadge c={COVERAGE.notCovered} /></span>
            <span role="cell">{election.notCovered.join("; ")}.</span>
          </div>
          <div role="row">
            <span role="cell"><CoverageBadge c={COVERAGE.sourceChecked} /></span>
            <span role="cell">
              Measure explanations were compared line by line with the official Blue Book, but no human editor has reviewed them yet, and
              each page says so. Each measure also links straight to the Blue Book's analysis.
            </span>
          </div>
        </div>
      </div>
      <section className="panel" aria-labelledby="your-address">
        <h2 id="your-address">Your address decides most of your ballot</h2>
        <p>
          This guide is <strong>not personalized</strong>. It covers what every Colorado voter sees. Many other races and questions on your
          ballot depend on exactly where you live, and we do not ask for your address, guess your districts from a city name, or show a
          sample ballot.
        </p>
        <ol className="how-list">
          <li><strong>Get your official sample ballot.</strong> Use <a href="https://www.govotecolorado.gov/" target="_blank" rel="noreferrer">GoVoteColorado</a>; your address is entered on the official site, not here.</li>
          <li><strong>Match it to this page.</strong> Statewide items on your sample ballot are covered above. For anything else, use the list below to see what it is.</li>
          <li><strong>Ask your county.</strong> Your <a href="https://www.coloradosos.gov/pubs/elections/Resources/CountyElectionOffices.html" target="_blank" rel="noreferrer">county election office</a> can answer questions about your districts.</li>
        </ol>
        <h3>Races and questions that may appear on your ballot but are not covered here</h3>
        <ul>
          {LOCAL_RACE_TYPES.map((r) => (
            <li key={r.id}>
              <strong>{r.name}.</strong> {r.what} <span className="muted">Depends on: {r.dependsOn}</span>
            </li>
          ))}
        </ul>
        <p className="muted">These descriptions are general civic background written by Common Ground, not a list of what is on your ballot.</p>
      </section>
      {election.verificationLog && (
        <section className="panel" aria-labelledby="how-checked">
          <h2 id="how-checked">How we checked this, and what we couldn't</h2>
          <p className="muted">
            Data last verified {fmtDay(election.dataVerifiedAt.slice(0, 10), { year: "numeric" })}. Nothing here has been reviewed by a human
            editor. Where a check could not be done, that is stated.
          </p>
          <ul className="source-list">
            {election.verificationLog.map((v) => (
              <li key={v.scope}>
                <strong>{v.scope}</strong> · checked {fmtDay(v.on, { year: "numeric" })}
                <span>
                  Method: {v.method} Result: {v.result}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="two-columns">
        <Link href="/vote/colorado/measures" className="panel state-card">
          <FileText size={24} />
          <h2>{election.measures.length} ballot measures</h2>
          <p>Amendments, propositions, and one district issue — with official text, analysis, and fiscal estimates.</p>
          <span className="button secondary">Browse measures <ArrowRight size={15} /></span>
        </Link>
        <Link href="/vote/colorado/contests" className="panel state-card">
          <Vote size={24} />
          <h2>Statewide offices & judges</h2>
          <p>What each office does and who is on the ballot, listed in the same format for every candidate.</p>
          <span className="button secondary">See offices <ArrowRight size={15} /></span>
        </Link>
      </div>
      <div className="panel">
        <h2>Key dates</h2>
        <p className="muted">From the Colorado Secretary of State. Times are Mountain Time.</p>
        <ul className="deadline-list">
          {election.deadlines.map((d, i) => {
            const state = deadlineState(d.date, now, election.timeZone);
            const days = daysUntil(d.date, now, election.timeZone);
            return (
              <li key={i} className={state}>
                <span className="deadline-date">{fmtDay(d.date)}</span>
                <span>{d.label}</span>
                <span className="deadline-state">
                  {state === "passed" ? "Passed" : state === "today" ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="muted">
          Missed the mail-ballot registration deadline? You can still register and vote in person at a voter service and polling
          center through Election Day. Check details with your county clerk.
        </p>
      </div>
      <div className="panel">
        <h2>Official resources</h2>
        <ul className="source-list">
          {election.officialLinks.map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.label} <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Known gaps</h2>
        <ul>
          {election.knownGaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function MeasureList() {
  const initial = new URLSearchParams(routeSearch()).get("filter") || "all";
  const [filter, setFilter] = useState(initial);
  const [q, setQ] = useState("");
  const { guide } = useGuide();
  const groups: [string, string, (m: Measure) => boolean][] = [
    ["all", "All", () => true],
    ["constitutional", "Constitutional amendments", (m) => m.kind.startsWith("constitutional")],
    ["statutory", "Statutory propositions", (m) => m.kind === "statutory"],
    ["district", "District issues", (m) => m.scope === "district"],
  ];
  const topics = [...new Set(election.measures.map((m) => m.topic))].sort();
  const test =
    groups.find((g) => g[0] === filter)?.[2] ||
    ((m: Measure) => m.topic === filter);
  const needle = q.trim().toLowerCase();
  const list = election.measures.filter(
    (m) => test(m) && (!needle || `${m.designation} ${m.shortTitle} ${m.blueBookTitle} ${m.topic}`.toLowerCase().includes(needle)),
  );
  const progress = guideProgress(guide, election.measures.map((m) => m.id));
  return (
    <>
      <BackLink href="/vote/colorado" label="Colorado overview" />
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · BALLOT MEASURES</div>
        <h1>What you're being asked to decide.</h1>
        <p>
          Every statewide measure, grouped by type. Constitutional amendments need 55% to pass; statutory propositions need a
          simple majority.
        </p>
      </div>
      <VoteNav here="measures" />
      <Freshness />
      <div className="filter-row" role="group" aria-label="Filter measures">
        {groups.map(([id, label]) => (
          <button key={id} className={filter === id ? "selected" : ""} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
        <label className="topic-select">
          <span className="sr-only">Search measures</span>
          <input type="search" placeholder="Search measures" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="topic-select">
          <span className="sr-only">Filter by topic</span>
          <select value={topics.includes(filter) ? filter : ""} onChange={(e) => setFilter(e.target.value || "all")}>
            <option value="">Any topic</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="results-count" aria-live="polite">
        {list.length} of {election.measures.length} measures · you've marked {progress.read} as read
      </p>
      <div className="measure-grid">
        {list.map((m) => {
          const read = guide.entries[m.id]?.read;
          return (
            <Link key={m.id} href={`/vote/colorado/measure/${m.id}`} className="measure-card">
              <div className="card-meta">
                <span className="tag">{m.designation}</span>
                <CoverageBadge c={measureCoverage(m)} />
                {read && (
                  <span className="read-mark">
                    <Check size={13} /> Read
                  </span>
                )}
              </div>
              <h3>{m.shortTitle}</h3>
              <p>
                {KIND_LABEL[m.kind]} · {m.threshold === "55-percent" ? "55% to pass" : "Majority to pass"}
                {m.scope === "district" ? ` · ${m.district} only` : ""}
              </p>
              <span className="card-link">
                Understand this measure <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
      {list.length === 0 && <p className="empty">No measures match this filter.</p>}
    </>
  );
}

function MeasureDetail({ id }: { id?: string }) {
  const m = election.measures.find((x) => x.id === id);
  if (!m) return <NotFound />;
  const explanation = publishedExplanation(m);
  const idx = election.measures.indexOf(m);
  const prev = election.measures[idx - 1];
  const next = election.measures[idx + 1];
  const pages = m.blueBookPages;
  return (
    <>
      <BackLink href="/vote/colorado/measures" label="All measures" />
      <div className="page-title">
        <div className="eyebrow">
          {m.designation.toUpperCase()} · {m.scope === "district" ? m.district?.toUpperCase() : "STATEWIDE"} ·{" "}
          {fmtDay(election.electionDate, { year: "numeric" }).toUpperCase()}
        </div>
        <h1>{m.shortTitle}</h1>
        {m.blueBookTitle && m.blueBookTitle !== m.shortTitle && <p>Blue Book title: “{m.blueBookTitle}”</p>}
      </div>
      <div className="detail-toolbar">
        <CoverageBadge c={measureCoverage(m)} />
        {explanation && !isHumanReviewed(m) && <CoverageBadge c={COVERAGE.sourceChecked} />}
        <span className="tag">{KIND_LABEL[m.kind]}</span>
        <span>{THRESHOLD_LABEL[m.threshold]}</span>
      </div>
      {m.scope === "district" && (
        <div className="notice">
          <Info size={18} /> This measure appears only on ballots of voters who live in the {m.district}. Check your official sample
          ballot to see whether it's on yours.
        </div>
      )}
      {m.discrepancies?.map((d) => (
        <div className="notice" key={d}>
          <TriangleAlert size={18} /> {d}
        </div>
      ))}
      <div className="article-layout">
        <article className="panel longform">
          <h2>At a glance</h2>
          <dl className="facts">
            <dt>How it got on the ballot</dt>
            <dd>
              {ORIGIN_LABEL[m.origin]}
              {m.initiativeNumber ? ` (Initiative ${m.initiativeNumber})` : ""}
              {m.referringBill ? ` (${m.referringBill})` : ""}
            </dd>
            <dt>Type of change</dt>
            <dd>{KIND_LABEL[m.kind]}</dd>
            <dt>To pass</dt>
            <dd>{THRESHOLD_LABEL[m.threshold]}</dd>
            <dt>Topic</dt>
            <dd>{m.topic} <span className="muted">(our category, for browsing)</span></dd>
          </dl>

          <h2>The official wording</h2>
          <p>
            The legally binding question is the ballot title printed on your ballot. Read it in full in the{" "}
            <a href={m.officialTextUrl} target="_blank" rel="noreferrer">
              official text <ExternalLink size={12} />
            </a>
            {pages.titleAndText ? ` or on page ${pages.titleAndText} of the Blue Book` : ""}.
          </p>

          <h2>In plain English</h2>
          {explanation ? (
            <>
              <p>{explanation.summary}</p>
              {explanation.yes && explanation.no && (
                <div className="yes-no">
                  <div>
                    <h3>A YES vote means</h3>
                    <p>{explanation.yes}</p>
                  </div>
                  <div>
                    <h3>A NO vote means</h3>
                    <p>{explanation.no}</p>
                  </div>
                </div>
              )}
              {explanation.fiscal.length > 0 && (
                <>
                  <h2>Money and practical effects</h2>
                  <ul>{explanation.fiscal.map((f) => <li key={f}>{f}</li>)}</ul>
                  <p className="muted">Fiscal figures are official estimates from nonpartisan legislative staff, not guarantees.</p>
                </>
              )}
              {explanation.unclear.length > 0 && (
                <>
                  <h2>What's unclear</h2>
                  <ul>{explanation.unclear.map((f) => <li key={f}>{f}</li>)}</ul>
                </>
              )}
              {explanation.arguments && (
                <>
                  <h2>Arguments for and against</h2>
                  <p className="muted">
                    Summarized from the Blue Book's "Arguments For and Against" sections, which the Legislative Council Staff writes from
                    comments submitted by supporters and opponents. Each side is given in its own terms; these are claims, not findings.
                  </p>
                  <div className="yes-no">
                    <div>
                      <h3>Arguments for</h3>
                      <ul>{explanation.arguments.for.map((a) => <li key={a}>{a}</li>)}</ul>
                    </div>
                    <div>
                      <h3>Arguments against</h3>
                      <ul>{explanation.arguments.against.map((a) => <li key={a}>{a}</li>)}</ul>
                    </div>
                  </div>
                </>
              )}
              {isHumanReviewed(m) ? (
                <p className="muted">
                  Reviewed by {explanation.review.reviewer} on {explanation.review.reviewedOn}. Prepared from the official Blue Book and
                  fiscal impact statements.
                </p>
              ) : (
                <div className="notice">
                  <Info size={18} /> Source-checked, not human-reviewed. On {explanation.review.checkedOn}, Common Ground's AI-assisted process
                  compared this explanation with the official Blue Book text and corrected what did not match. No human editor has reviewed
                  it, and the separate fiscal impact statements were not read. The Blue Book is the authority; use the page numbers below.
                </div>
              )}
            </>
          ) : (
            <div className="awaiting-review">
              <CoverageBadge c={COVERAGE.awaitingReview} />
              <p>
                We've drafted a plain-language summary, YES/NO explanation, and fiscal notes for this measure, but an editor hasn't
                reviewed them yet, so we're not showing them. Until then, the nonpartisan Blue Book is the best place to start:
              </p>
              <ul>
                {pages.quickReference && <li>One-paragraph summary: Blue Book, Quick Ballot Reference Guide, p. {pages.quickReference}</li>}
                {pages.analysis && <li>Full analysis, including arguments for and against and fiscal impact: p. {pages.analysis}</li>}
                {pages.notice && <li>District notice: p. {pages.notice}</li>}
              </ul>
              <a className="button secondary" href={sourceById.get("blue-book")!.url} target="_blank" rel="noreferrer">
                Open the 2026 Blue Book <ExternalLink size={14} />
              </a>
              {m.moreInfoUrl && (
                <p>
                  District information:{" "}
                  <a href={m.moreInfoUrl} target="_blank" rel="noreferrer">
                    {new URL(m.moreInfoUrl).hostname} <ExternalLink size={12} />
                  </a>
                </p>
              )}
            </div>
          )}

          <h2>Who supports and opposes it</h2>
          <p>
            Registered committees for and against each measure are listed by the{" "}
            <a href="https://www.coloradosos.gov/pubs/elections/Initiatives/ballot/contacts/2026.html" target="_blank" rel="noreferrer">
              Secretary of State <ExternalLink size={12} />
            </a>
            . The Blue Book's analysis summarizes the main arguments on each side. Campaign claims are advocacy, not neutral analysis.
          </p>

          <h2>Questions worth asking</h2>
          <ul>
            <li>What exactly changes on day one, and what depends on later decisions by the legislature, agencies, or courts?</li>
            <li>Who pays, who benefits, and over what time frame?</li>
            <li>{m.kind.startsWith("constitutional") ? "This would change the state constitution. How hard would it be to adjust later if it works differently than expected?" : "This changes state law, which the legislature can later amend. Does that matter to you here?"}</li>
            <li>What would change your mind about this measure?</li>
          </ul>

          <h2>Sources</h2>
          <SourceList ids={m.sourceIds} />
        </article>
        <aside>
          <div className="panel">
            <div className="eyebrow">YOUR PRIVATE RESEARCH</div>
            <h3>Track this measure</h3>
            <p className="muted">Only you can see this. We never suggest a vote.</p>
            <GuideControls id={m.id} label={m.designation} />
            <Link href="/vote/my-guide">Open my research guide <ArrowRight size={13} /></Link>
          </div>
          <div className="panel">
            <h3>Read the originals</h3>
            <a href={m.officialTextUrl} target="_blank" rel="noreferrer">Official text <ExternalLink size={13} /></a>
            <a href={sourceById.get("blue-book")!.url} target="_blank" rel="noreferrer">Blue Book analysis <ExternalLink size={13} /></a>
            {m.sourceIds.includes("fiscal-statements") && (
              <a href={sourceById.get("fiscal-statements")!.url} target="_blank" rel="noreferrer">Fiscal impact statement <ExternalLink size={13} /></a>
            )}
          </div>
        </aside>
      </div>
      <div className="pager">
        {prev ? <Link href={`/vote/colorado/measure/${prev.id}`}><ChevronLeft size={14} /> {prev.designation}</Link> : <span />}
        {next && <Link href={`/vote/colorado/measure/${next.id}`}>{next.designation} <ArrowRight size={14} /></Link>}
      </div>
    </>
  );
}

function ContestList() {
  return (
    <>
      <BackLink href="/vote/colorado" label="Colorado overview" />
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · OFFICES & JUDGES</div>
        <h1>Who's running, and what the job is.</h1>
        <p>
          Statewide contests that appear on every Colorado ballot. Candidates are listed as the Secretary of State lists them. We don't
          rank, score, or match candidates.
        </p>
      </div>
      <VoteNav here="contests" />
      <Freshness />
      <div className="notice">
        <MapPin size={18} /> District races — U.S. House, state legislature, State Board of Education, CU Regent, district attorney,
        county offices, and local judges — depend on your address. <a href="https://www.govotecolorado.gov/" target="_blank" rel="noreferrer">See your official ballot</a>.
      </div>
      <div className="measure-grid">
        {election.contests.map((c) => (
          <Link key={c.id} href={`/vote/colorado/contest/${c.id}`} className="measure-card">
            <div className="card-meta">
              <CoverageBadge c={COVERAGE.verifiedStatewide} />
              <span className="tag">{c.kind === "retention" ? "Retention · nonpartisan" : "Partisan office"}</span>
            </div>
            <h3>{c.office}</h3>
            <p>
              {c.kind === "retention"
                ? `${c.candidates.length} ${c.candidates.length === 1 ? "judge" : "judges"} · yes/no questions`
                : `${c.candidates.filter((x) => x.status === "on-ballot").length} candidates on the ballot`}
              {" · "}
              {c.termYears}-year term
            </p>
            <span className="card-link">Learn more <ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </>
  );
}

function ContestDetail({ id }: { id?: string }) {
  const c: Contest | undefined = election.contests.find((x) => x.id === id);
  if (!c) return <NotFound />;
  const onBallot = c.candidates.filter((x) => x.status === "on-ballot");
  const writeIns = c.candidates.filter((x) => x.status === "write-in");
  const withdrawn = c.candidates.filter((x) => x.status === "withdrawn");
  return (
    <>
      <BackLink href="/vote/colorado/contests" label="All offices & judges" />
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · STATEWIDE</div>
        <h1>{c.office}</h1>
        <p>{c.termYears}-year term</p>
      </div>
      <div className="article-layout">
        <article className="panel longform">
          <h2>What this {c.kind === "retention" ? "question decides" : "office does"}</h2>
          <p>{c.role}</p>
          <p className="muted">Office description written by Common Ground as general civic background.</p>
          {c.kind === "retention" ? (
            <>
              <h2>Judges on the ballot</h2>
              <p>Each judge is a separate YES/NO question. Judges do not run against each other and have no party label.</p>
              <ul className="candidate-list">
                {c.candidates.map((x) => (
                  <li key={x.name}>
                    <strong>{x.name}</strong>
                    <GuideControls id={`${c.id}:${x.name}`} label={x.name} />
                  </li>
                ))}
              </ul>
              <div className="notice">
                <Info size={18} /> Colorado's Office of Judicial Performance Evaluation publishes an independent evaluation of each judge
                standing for retention. Common Ground does not rate judges or recommend retention votes.
              </div>
              <p>
                <Link className="button primary" href="/vote/colorado/judges">
                  How judicial retention works <ArrowRight size={14} />
                </Link>
              </p>
              <a className="button secondary" href={sourceById.get("judicial-performance")!.url} target="_blank" rel="noreferrer">
                Read the official evaluations <ExternalLink size={14} />
              </a>
            </>
          ) : (
            <>
              <h2>Candidates on the ballot</h2>
              <p className="muted">In the order the Secretary of State's official candidate list shows them. This is not ballot order.</p>
              <div className="compare-table" role="table" aria-label={`Candidates for ${c.office}`}>
                <div role="row" className="compare-head">
                  <span role="columnheader">Candidate</span>
                  {c.candidates.some((x) => x.runningMate) && <span role="columnheader">Running mate</span>}
                  <span role="columnheader">Listed affiliation</span>
                  <span role="columnheader">Positions & background</span>
                </div>
                {onBallot.map((x) => (
                  <div role="row" key={x.name}>
                    <span role="cell"><strong>{x.name}</strong></span>
                    {c.candidates.some((y) => y.runningMate) && <span role="cell">{x.runningMate || "—"}</span>}
                    <span role="cell">{x.affiliation || "None listed"}</span>
                    <span role="cell" className="muted">
                      {profileFor(c.id, x.name) ? (
                        <Link href={`/vote/colorado/candidate/${c.id}/${encodeURIComponent(x.name)}`}>
                          Research profile · {completeness(profileFor(c.id, x.name)).covered.length} of {RESEARCH_AREAS.length} areas sourced
                        </Link>
                      ) : (
                        gapFor(c.id, x.name)?.note ?? "Not yet researched — 0 of 5 areas; not inferred from party"
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {writeIns.length > 0 && (
                <>
                  <h3>Certified write-in candidates</h3>
                  <p>
                    These names are <strong>not printed on the ballot</strong>. A vote counts for them only if you write the name in:{" "}
                    {writeIns.map((x) => `${x.name} (${x.affiliation || "no affiliation listed"})`).join(", ")}.
                  </p>
                </>
              )}
              {withdrawn.length > 0 && (
                <p className="muted">Withdrawn: {withdrawn.map((x) => x.name).join(", ")}.</p>
              )}
              <div className="notice">
                <Info size={18} /> Party affiliation tells you a candidate's listed party, not their position on any specific issue. We
                haven't yet compiled sourced candidate positions; the cells above say so rather than guess.
              </div>
              <GuideControls id={c.id} label={c.office} />
            </>
          )}
          <h2>Sources</h2>
          <SourceList ids={c.sourceIds} />
          <p className="muted">
            Candidate names transcribed from the official list on {fmtDay(election.sources.find((s) => s.id === "sos-candidates")!.retrievedAt, { year: "numeric" })}.
            Withdrawals marked with strikethrough on the official list could not be captured; your ballot is authoritative.
          </p>
        </article>
        <aside>
          <div className="panel">
            <h3>Research tips</h3>
            <ul>
              <li>Look for candidates' own dated statements and proposals.</li>
              <li>For incumbents, check their official record (votes, decisions).</li>
              <li>Notice whether a claim comes from the candidate, an opponent, or an independent source.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function MyGuide() {
  const { guide, persist, storageError: err } = useGuide();
  const [confirm, setConfirm] = useState(false);
  const measures = election.measures;
  const progress = guideProgress(guide, measures.map((m) => m.id));
  const row = (id: string, title: string, href: string) => {
    const e = guide.entries[id] || {};
    return (
      <li key={id} className="guide-row">
        <div>
          <Link href={href}><strong>{title}</strong></Link>
          <div className="guide-flags">
            <span className={e.read ? "on" : ""}>{e.read ? "☑" : "☐"} Read</span>
            <span className={e.research ? "on" : ""}>{e.research ? "☑" : "☐"} Need to research</span>
            <span className={e.question ? "on" : ""}>{e.question ? "☑" : "☐"} Questions</span>
          </div>
          {e.note && <p className="guide-note-text">{e.note}</p>}
          <div className="print-lines" aria-hidden="true" />
        </div>
      </li>
    );
  };
  return (
    <>
      <BackLink href="/vote/colorado" label="Colorado overview" />
      <div className="page-title">
        <div className="eyebrow">PRIVATE · ON THIS DEVICE ONLY</div>
        <h1>My ballot research guide.</h1>
        <p>
          A checklist of everything statewide on Colorado's 2026 ballot, with your own notes. Common Ground never sees it, and it never
          appears in a link.
        </p>
      </div>
      <VoteNav here="guide" />
      <div className="panel no-print">
        <p>
          <strong>{progress.read}</strong> of {progress.total} measures marked as read.
        </p>
        <label className="toggle-label">
          <input type="checkbox" checked={persist} onChange={(e) => guideStore.setPersist(e.target.checked)} /> Save my guide on this
          device
        </label>
        <p className="muted">
          {persist
            ? "Saved in this browser's storage until you delete it or clear your browser data. Not synced to other devices."
            : "Not saved: your marks and notes disappear when you close or reload this page."}
        </p>
        {err && <p className="notice error">{err}</p>}
        <div className="utility-row">
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print or save as PDF
          </button>
          <button className="button secondary" onClick={() => download("my-ballot-research-guide.json", guideExport(guide, election))}>
            <Download size={15} /> Download my notes
          </button>
          {!confirm ? (
            <button className="button danger" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> Delete my guide
            </button>
          ) : (
            <span className="confirm-row" role="group" aria-label="Confirm deletion">
              Delete all marks and notes?{" "}
              <button className="button danger" onClick={() => { guideStore.clear(); setConfirm(false); }}>Yes, delete</button>{" "}
              <button className="button secondary" onClick={() => setConfirm(false)}>Cancel</button>
            </span>
          )}
        </div>
      </div>
      <div className="print-only print-header">
        <strong>My ballot research guide — {election.name} — Election Day {fmtDay(election.electionDate, { year: "numeric" })}</strong>
        <p>Personal research notes. Not an official ballot. Your official ballot comes from your county clerk.</p>
      </div>
      <section className="panel">
        <h2>Ballot measures</h2>
        <ul className="guide-list">
          {measures.map((m) =>
            row(m.id, `${m.designation}: ${m.shortTitle}${m.scope === "district" ? ` (${m.district} only)` : ""}`, `/vote/colorado/measure/${m.id}`),
          )}
        </ul>
      </section>
      <section className="panel">
        <h2>Statewide offices</h2>
        <ul className="guide-list">
          {election.contests.filter((c) => c.kind !== "retention").map((c) => row(c.id, c.office, `/vote/colorado/contest/${c.id}`))}
        </ul>
      </section>
      <section className="panel">
        <h2>Judicial retention</h2>
        <ul className="guide-list">
          {election.contests
            .filter((c) => c.kind === "retention")
            .flatMap((c) => c.candidates.map((x) => row(`${c.id}:${x.name}`, `${x.name} — ${c.office.replace(" — retention", "")}`, `/vote/colorado/contest/${c.id}`)))}
        </ul>
      </section>
      <section className="panel">
        <h2>Also on my ballot (from my official sample ballot)</h2>
        <p className="muted">District and local races aren't covered here. Use the space below when printing.</p>
        <div className="print-lines tall" aria-hidden="true" />
      </section>
    </>
  );
}

function HowToRead() {
  const terms: [string, string][] = [
    ["Amendment", "A proposed change to the Colorado Constitution. Needs at least 55% of votes cast (a measure that only repeals part of the constitution needs a majority)."],
    ["Proposition", "A proposed change to state statutes (ordinary state law). Needs a simple majority. The legislature can later amend a statute."],
    ["Citizen initiative", "A measure placed on the ballot by petition signatures."],
    ["Referred measure", "A measure placed on the ballot by the legislature or a local governing body."],
    ["Ballot title", "The official question printed on your ballot. It is the legal text you vote on."],
    ["Blue Book", "The State Ballot Information Booklet, mailed to voters and written by nonpartisan legislative staff. It explains each statewide measure and includes arguments for and against."],
    ["TABOR", "The Taxpayer's Bill of Rights in Colorado's constitution. It limits how much revenue the state may keep and spend; money above the limit is generally refunded unless voters allow otherwise."],
    ["Fiscal impact statement", "An official, nonpartisan estimate of a measure's effect on state and local budgets and taxpayers."],
    ["Retention", "A YES/NO question on whether a judge keeps their seat for another term. Judges don't run against opponents."],
    ["Write-in candidate", "A certified candidate whose name is not printed on the ballot. Your vote counts for them only if you write the name in."],
    ["Unaffiliated", "Not a member of any political party."],
    ["Special district", "A local government created for a specific purpose — such as fire protection, water, or transit — with its own boundaries."],
  ];
  return (
    <>
      <BackLink href="/vote" label="Help Me Vote" />
      <div className="page-title">
        <div className="eyebrow">A THREE-MINUTE PRIMER</div>
        <h1>How to read your ballot.</h1>
        <p>Ballots can look intimidating. Here's what's on one and how the pieces fit together.</p>
      </div>
      <div className="panel longform">
        <h2>What's on a Colorado ballot</h2>
        <ol className="how-list">
          <li><strong>Candidate races</strong> — federal, state, county, and local offices. Which ones you see depends on your districts.</li>
          <li><strong>Judicial retention</strong> — YES/NO questions on keeping judges in office.</li>
          <li><strong>Statewide measures</strong> — amendments (lettered or numbered) and propositions.</li>
          <li><strong>Local measures</strong> — county, city, school, and special district questions.</li>
        </ol>
        <h2>Reading a measure</h2>
        <p>
          The ballot title is long because it's a legal description. Start with the Blue Book's one-paragraph summary, then decide
          whether to read the full analysis. YES approves the change described; NO rejects it. Read carefully: a measure can repeal
          or limit something, so YES doesn't always mean “more.”
        </p>
        <h2>You don't have to vote on everything</h2>
        <p>Leaving a race or question blank doesn't invalidate the rest of your ballot.</p>
        <h2>Glossary</h2>
        <dl className="glossary">
          {terms.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">Definitions written by Common Ground for general understanding. Your county clerk is the authority on your ballot.</p>
      </div>
    </>
  );
}

function Demo() {
  return (
    <>
      <BackLink href="/vote" label="Help Me Vote" />
      <div className="demo-banner" role="note">
        <strong>FICTIONAL DEMONSTRATION · NOT A REAL BALLOT ITEM</strong> · Example Town and Measure A do not exist.
      </div>
      <div className="page-title">
        <div className="eyebrow">PRACTICE MEASURE</div>
        <h1>Example Town · Measure A</h1>
        <p>Use this made-up measure to see how an explainer separates official text, effects, money, and uncertainty.</p>
      </div>
      <div className="detail-toolbar">
        <CoverageBadge c={COVERAGE.demo} />
      </div>
      <div className="panel longform fictional-ballot">
        <h2>The official wording (fictional)</h2>
        <p>Shall Example Town create a dedicated fund for public library improvements through a temporary local levy?</p>
        <div className="yes-no">
          <div>
            <h3>A YES vote means</h3>
            <p>Approve the fund and levy described in the fictional measure.</p>
          </div>
          <div>
            <h3>A NO vote means</h3>
            <p>Reject this proposal. (In a real measure, check whether other laws or pending actions would still change things.)</p>
          </div>
        </div>
        <h2>Money and practical effects</h2>
        <p>No amounts are given in this demonstration. In a real explainer, this is where official fiscal estimates appear, labeled by source.</p>
        <h2>What's unclear</h2>
        <p>The levy's rate, duration, exemptions, and oversight — the kinds of details to look for in a real measure.</p>
        <p className="muted">Source: a fictional learning fixture written by Common Ground. No real jurisdiction, date, or candidate.</p>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="page-title">
      <div className="eyebrow">NOT FOUND</div>
      <h1>We couldn't find that ballot item.</h1>
      <p>
        <Link href="/vote/colorado">Return to the Colorado overview</Link>.
      </p>
    </div>
  );
}

function JudicialGuide() {
  const jp = sourceById.get("judicial-performance")!;
  const judges = election.contests.filter((c) => c.kind === "retention");
  return (
    <>
      <BackLink href="/vote/colorado/contests" label="All offices & judges" />
      <div className="page-title">
        <div className="eyebrow">COLORADO 2026 · JUDICIAL RETENTION</div>
        <h1>How to read the judges on your ballot.</h1>
        <p>Judges are not elected the way other officials are. You get one yes-or-no question per judge: keep them, or not.</p>
      </div>
      <div className="notice">
        <Info size={18} /> Verification status: the process described here is general civic background written by Common Ground from
        the Office of Judicial Performance Evaluation's public materials as summarized in search excerpts on 2026-10-22. The
        office's website blocks automated access, so a person should confirm details against its pages before this is treated as
        verified. Individual judges' recommendations are deliberately not reproduced here.
      </div>
      <article className="panel longform">
        <h2>What a YES or NO vote does</h2>
        <p>
          <strong>YES</strong> keeps the judge in office for another term. <strong>NO</strong> means the judge is not retained and a
          replacement is chosen through the state's appointment process. A judge is retained unless a majority votes NO.
          Retention questions have no party label.
        </p>
        <h2>How judges are evaluated</h2>
        <p>
          Independent judicial performance commissions evaluate judges before each retention election. There is a state commission
          for appellate judges and a commission for each judicial district. Commissions draw on inputs such as surveys of lawyers and
          others who have dealt with the judge, and they publish a narrative and a recommendation. The recommendation says whether the
          commission found that the judge meets performance standards. The standards cover areas such as legal knowledge, integrity,
          communication, temperament, and administration of cases.
        </p>
        <h2>What the evaluations can and cannot tell you</h2>
        <ul>
          <li>They are a structured, independent look at professional performance, with sources you can read.</li>
          <li>They are not a list of rulings you may agree or disagree with, and they do not decide what a judge <em>should</em> have ruled.</li>
          <li>Survey sample sizes vary, and some judges have few responses. Read the response counts.</li>
          <li>Commissions very rarely recommend against retention, and voters very rarely vote a judge out. Whether that reflects good performance or a weak filter is something reasonable people debate.</li>
          <li>Judges who expect poor reviews sometimes leave before the election, so the list of those who reach the ballot is itself filtered.</li>
        </ul>
        <h2>What the press has reported this year (not verified against the official site)</h2>
        <ul>
          <li>
            Colorado Politics reported on Oct. 16, 2026 that 123 state judges are standing for retention this year, that Supreme Court Justice
            William Hood's evaluation drew 31 survey responses, and that the only "does not meet performance standards" findings it
            described involved trial-level (district or county) judges, not the Supreme Court or Court of Appeals judges on every ballot.{" "}
            <a href="https://www.coloradopolitics.com/2026/10/16/judicial-retention-judges-on-the-ballot-in-2026/" target="_blank" rel="noreferrer">
              Colorado Politics, Oct. 16, 2026 <ExternalLink size={12} />
            </a>
          </li>
        </ul>
        <p className="muted">
          This is a news report's summary, read on 2026-10-22. Common Ground could not open the official evaluations, so it does not state any
          individual judge's recommendation. Read each judge's evaluation on the official site.
        </p>
        <h2>Questions you might ask</h2>
        <ul>
          <li>How many people answered the survey for this judge?</li>
          <li>Does the commission's narrative mention specific strengths or concerns, and are they backed by details?</li>
          <li>Which of my own concerns (fairness, speed, legal reasoning, courtroom conduct) does the evaluation actually speak to?</li>
          <li>Am I basing my vote on a judge's performance, or on a ruling I heard about?</li>
        </ul>
        <h2>Judges on every Colorado ballot</h2>
        {judges.map((c) => (
          <p key={c.id}>
            <strong>{c.office.replace(" — retention", "")}:</strong> {c.candidates.map((x) => x.name).join("; ")}
          </p>
        ))}
        <p className="muted">
          Common Ground does not summarize or score each judge's evaluation. Read each judge's full evaluation, including the commission's
          recommendation and survey counts, at the official site. District and county judges depend on your address.
        </p>
        <p>
          <a className="button primary" href={jp.url} target="_blank" rel="noreferrer">
            Official judicial performance evaluations <ExternalLink size={14} />
          </a>
        </p>
      </article>
    </>
  );
}

function CandidateProfile({ contestId, name }: { contestId?: string; name?: string }) {
  const p = contestId && name ? profileFor(contestId, name) : undefined;
  if (!p) return <NotFound />;
  const done = completeness(p);
  const contest = election.contests.find((c) => c.id === p.contestId)!;
  return (
    <>
      <BackLink href={`/vote/colorado/contest/${p.contestId}`} label={contest.office} />
      <div className="page-title">
        <div className="eyebrow">CANDIDATE RESEARCH · LAST VERIFIED {p.lastVerifiedOn}</div>
        <h1>{p.name}</h1>
        <p>
          {done.covered.length} of {RESEARCH_AREAS.length} research areas have sourced information. Anything not listed was not verified, and
          no position is inferred from party.
        </p>
      </div>
      <div className="notice">
        <Info size={18} /> Read this first: statements below are what the candidate or an official record says, paraphrased by Common Ground
        from the linked page on {p.lastVerifiedOn}. They are not independently fact-checked, and the exact wording is on the linked page.
        Candidates choose what to publish, so a short list does not mean a candidate has no other positions. Common Ground does not rank,
        score or recommend candidates.
      </div>
      <article className="panel longform">
        {p.campaignWebsite && (
          <p>
            <a href={p.campaignWebsite} target="_blank" rel="noreferrer">
              Official campaign website <ExternalLink size={14} />
            </a>
          </p>
        )}
        {CLAIM_KINDS.map((k) => {
          const list = p.claims.filter((c) => c.kind === k);
          return list.length === 0 ? null : (
            <section key={k}>
              <h2>{CLAIM_LABEL[k]}</h2>
              <ul>
                {list.map((c, i) => (
                  <li key={i}>
                    <span className="tag">{AREA_LABEL[c.area]}</span> {c.text}{" "}
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                      {c.sourceTitle}
                    </a>{" "}
                    <span className="muted">(retrieved {c.retrievedOn})</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <h2>Research status</h2>
        <ul>
          {RESEARCH_AREAS.map((a) => (
            <li key={a}>
              {AREA_LABEL[a]}:{" "}
              {done.covered.includes(a) ? "sourced" : done.notFound.includes(a) ? "checked, nothing verifiable found" : "not yet researched"}
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}

export default function HelpMeVote({ parts }: { parts: string[] }) {
  const [a, b, c] = parts;
  if (!a) return <Landing />;
  if (a === "my-guide") return <MyGuide />;
  if (a === "how-to-read") return <HowToRead />;
  if (a === "demo") return <Demo />;
  if (a !== "colorado") return <NotFound />;
  if (!b) return <Overview />;
  if (b === "measures") return <MeasureList />;
  if (b === "measure") return <MeasureDetail id={c} />;
  if (b === "contests") return <ContestList />;
  if (b === "contest") return <ContestDetail id={c} />;
  if (b === "judges") return <JudicialGuide />;
  if (b === "candidate") return <CandidateProfile contestId={c} name={parts[3]} />;
  return <NotFound />;
}
