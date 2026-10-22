"use client";
// External URL and local-storage state is hydrated after SSR; these effects intentionally initialize client state.
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from "react";
import Link, { routeSearch } from "./link";
import { getFeed, getDocument } from "@/lib/free-source";
import { localDebate } from "@/lib/local-debate";
import HelpMeVote, { election } from "./help-me-vote";
import { daysUntil, electionPhase } from "@/lib/election";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Sun,
  Landmark,
  Layers,
  Compass,
  MessageCircle,
  Vote,
  Network,
  Bookmark,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  Trash2,
  Menu,
  X,
  Plus,
  Minus,
  BookOpen,
  SlidersHorizontal,
  Leaf,
  Scale,
  Globe,
  Info,
} from "lucide-react";
import type { Action } from "@/lib/domain";
import { clearPrivate, metadataClaims } from "@/lib/domain";
import { topics, scenarios, atlasNodes, atlasEdges } from "@/lib/content";
import type { Feed } from "@/lib/free-source";
const nav = [
  ["today", "Today", Sun],
  ["vote", "Help Me Vote", Vote],
  ["legislation", "Legislation", Landmark],
  ["policy", "Policy Explorer", Layers],
  ["values", "My Values", Compass],
  ["debate", "Debate Lab", MessageCircle],
  ["atlas", "Thought Atlas", Network],
  ["saved", "Reading List", Bookmark],
] as const;
const FEED_SECTIONS = ["today", "legislation", "saved", "action", "status", "debate"];
const fmt = (d: string) =>
  new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function Capitol() {
  return (
    <svg
      viewBox="0 0 640 370"
      role="img"
      aria-label="Illustration of the United States Capitol"
      className="capitol"
    >
      <defs>
        <pattern id="lines" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 5L5 0" stroke="#597267" strokeWidth=".4" opacity=".25" />
        </pattern>
        <linearGradient id="sky">
          <stop stopColor="#d5ded2" />
          <stop offset="1" stopColor="#e9e8d7" />
        </linearGradient>
      </defs>
      <rect width="640" height="370" fill="url(#sky)" />
      <circle cx="480" cy="79" r="49" fill="#eee9d0" opacity=".8" />
      <path
        d="M0 286Q72 211 140 272T280 271T435 268T640 255V370H0Z"
        fill="#a9b9a4"
      />
      <g fill="#e7e5d5" stroke="#677c6d" strokeWidth="1.2">
        <path d="M68 247H570V326H68Z" />
        <path d="M198 212H442V326H198Z" />
        <path d="M194 215L320 168L446 215Z" />
        <path d="M270 169V142H370V169Z" />
        <path d="M270 140Q272 82 320 69Q368 82 370 140Z" />
        <path d="M303 71V54H337V71Z" />
        <path d="M314 54V39H326V54Z" />
        <path d="M320 39V22" />
        <path d="M320 24L343 29L320 34" fill="#7a8d78" />
        <path d="M260 143H380V153H260Z" />
        <path
          d="M293 79Q294 113 290 140M306 73L305 140M320 70V140M334 73L335 140M347 79Q347 110 350 140"
          fill="none"
        />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${219 + i * 24} 222h9v88h-9z`} />
        ))}
        {[88, 115, 142, 169, 466, 493, 520, 547].map((x) => (
          <g key={x}>
            <path
              d={`M${x} 257h10v21h-10zM${x} 290h10v21h-10z`}
              fill="#839181"
            />
          </g>
        ))}
        <path d="M186 326H454V334H186ZM171 334H469V342H171ZM154 342H486V350H154Z" />
        <path d="M205 215H435M205 219H435M206 314H434M70 250H568" />
      </g>
      <path
        d="M0 334Q70 310 132 331L151 370H0ZM640 326Q568 299 501 335L487 370H640Z"
        fill="#617b60"
      />
      <path
        d="M0 350Q82 329 148 353M640 345Q569 324 494 353"
        fill="none"
        stroke="#8b9c7f"
        strokeWidth="7"
      />
      <rect width="640" height="370" fill="url(#lines)" />
    </svg>
  );
}
function SourceBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "source-badge small" : "source-badge"}>
      <ShieldCheck size={12} /> PRIMARY SOURCE
    </span>
  );
}
export default function CommonGround({
  section,
  documentId,
  parts = [],
}: {
  section: string;
  documentId?: string;
  parts?: string[];
}) {
  const [feed, setFeed] = useState<Feed | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [query, setQuery] = useState(
      () => new URLSearchParams(routeSearch()).get("q") || "",
    ),
    [filter, setFilter] = useState("All actions"),
    [saved, setSaved] = useState<string[]>([]),
    [mobile, setMobile] = useState(false),
    [selected, setSelected] = useState<Action | null>(null),
    [page, setPage] = useState(1);
  async function load(more = false) {
    setBusy(true);
    setError("");
    try {
      const data = await getFeed(more ? page + 1 : 1);
      setFeed((old) =>
        more && old
          ? {
              ...data,
              actions: [
                ...new Map(
                  [...old.actions, ...data.actions].map((a) => [
                    a.document_number,
                    a,
                  ]),
                ).values(),
              ],
            }
          : data,
      );
      if (more) setPage((p) => p + 1);
      else setPage(1);
    } catch {
      setError("We couldn’t reach the source service. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
    try {
      setSaved(JSON.parse(localStorage.getItem("cg-saved") || "[]"));
    } catch {}
    // Initial source load only; later pagination is explicitly triggered by the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (documentId)
      getDocument(documentId)
        .then((d) => setSelected(d.action || null))
        .catch(() => setError("This document could not be retrieved."));
  }, [documentId]);
  function save(id: string) {
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem("cg-saved", JSON.stringify(next));
  }
  const actions = feed?.actions || [];
  const filtered = actions.filter(
    (a) =>
      (filter === "All actions" || a.status === filter) &&
      `${a.title} ${a.document_number} ${a.agencies.map((x) => x.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const lead =
    filtered.find((a) => a.abstract && a.abstract.length > 100) || filtered[0];
  const current =
    nav.find((n) => n[0] === section)?.[1] ||
    {
      action: "Federal action",
      ballot: "Help Me Vote",
      methodology: "Our Methodology",
      status: "Source Status",
      privacy: "Your Privacy",
    }[section] ||
    "Page not found";
  return (
    <div className="app-shell">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <aside className={"sidebar " + (mobile ? "show" : "")}>
        <Link href="/" className="brand" aria-label="Common Ground home">
          <span className="brand-symbol">
            ∩<span>∩</span>
          </span>
          <span>
            common
            <br />
            ground<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="nav-label">YOUR DAILY PERSPECTIVE</div>
        <nav aria-label="Main navigation">
          {nav.map(([id, label, Icon], i) => (
            <Link
              href={id === "today" ? "/" : "/" + id}
              key={id}
              onClick={() => setMobile(false)}
              className={
                "nav-link " +
                (section === id ? "active" : "") +
                (i === 4 ? " nav-break" : "")
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "saved" && saved.length > 0 && (
                <span className="count">{saved.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="independent">
            <span className="tiny-dot" /> Independent by design.
            <p>
              No sides to take.
              <br />
              More to understand.
            </p>
          </div>
          <Link href="/methodology">
            <Info size={15} /> About & methodology
          </Link>
          <Link href="/privacy">
            <ShieldCheck size={15} /> Privacy & your data
          </Link>
          <div className="version">COMMON GROUND · FREE PUBLIC BETA</div>
        </div>
      </aside>
      <div className="page-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>The world, explained.</span>
            <ChevronRight size={14} />
            <strong>{current}</strong>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.hash =
                "/legislation?q=" + encodeURIComponent(query);
            }}
          >
            <Search size={16} />
            <input
              aria-label="Search actions and ideas"
              name="q"
              placeholder="Search actions, topics, ideas…"
              defaultValue={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <Link
            href="/saved"
            className="top-bookmark"
            aria-label="Reading list"
          >
            <Bookmark size={19} />
          </Link>
          <div className="avatar" aria-label="Anonymous browsing">
            CG
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className={"main-content " + (section === "today" ? "home" : "")}
        >
          {error && FEED_SECTIONS.includes(section) && (
            <div className="notice error" role="alert">
              {error}
              <button
                onClick={() => {
                  getFeed(1, true)
                    .then(setFeed)
                    .catch(() => setError("Source unavailable"));
                }}
              >
                Retry
              </button>
            </div>
          )}
          {feed?.error && FEED_SECTIONS.includes(section) && (
            <div className="notice" role="status">
              <Info size={16} />
              {feed.error} Retrieved{" "}
              {new Date(feed.retrievedAt).toLocaleString()}.
            </div>
          )}
          {section === "today" && (
            <>
              <div className="edition-line">
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "America/Denver",
                  })}
                </span>
                <Link href="/status" className="live-status">
                  <span className={"tiny-dot " + (!feed ? "gray" : "")} />
                  {busy
                    ? "Connecting to official sources"
                    : feed?.mode === "live"
                      ? "Official source connected"
                      : feed?.mode === "cache"
                        ? "Cached official records"
                        : "Dated source snapshot"}
                </Link>
              </div>
              {feed && (
                <div className="retrieval-line">
                  Source retrieved {new Date(feed.retrievedAt).toLocaleString()}{" "}
                  ·{" "}
                  {feed.mode === "live"
                    ? "official API"
                    : feed.mode === "cache"
                      ? "session cache"
                      : "dated snapshot"}
                </div>
              )}
              <div className="home-intro">
                <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
                <h1>
                  Make sense of the world.
                  <br />
                  <em>Make up your own mind.</em>
                </h1>
                <p>
                  The facts behind the headlines. The ideas behind the debate.
                  <br className="desktop-break" /> A place to understand more,
                  and decide for yourself.
                </p>
              </div>
              <HomeVoteBanner />
              <nav className="paths-grid" aria-label="Start exploring">
                {(
                  [
                    ["/vote", "Help Me Vote", "Understand Colorado's 2026 ballot", Vote],
                    ["/legislation", "Explore government", "Official federal actions, explained", Landmark],
                    ["/policy", "Understand a policy", "Questions behind the headlines", Layers],
                    ["/debate", "Debate an idea", "Test your reasoning, privately", MessageCircle],
                    ["/values", "Discover your values", "Reflection, not a quiz score", Compass],
                    ["/atlas", "Thought Atlas", "Ideas that shape the debate", Network],
                  ] as const
                ).map(([href, title, text, Icon]) => (
                  <Link key={href} href={href} className="path-card">
                    <strong>
                      <Icon size={17} /> {title}
                    </strong>
                    <span>{text}</span>
                  </Link>
                ))}
              </nav>
              <div
                className="topic-tabs"
                role="group"
                aria-label="Filter federal feed"
              >
                {[
                  "All actions",
                  "Final rule",
                  "Proposed rule",
                  "Presidential document",
                  "Agency notice",
                ].map((t) => (
                  <button
                    key={t}
                    className={filter === t ? "selected" : ""}
                    onClick={() => setFilter(t)}
                  >
                    {t === "All actions"
                      ? "All actions"
                      : t === "Final rule"
                        ? "Final rules"
                        : t === "Proposed rule"
                          ? "Proposals"
                          : t === "Agency notice"
                            ? "Notices"
                            : "Presidential actions"}
                  </button>
                ))}
                <span className="no-algorithm">
                  <SlidersHorizontal size={13} /> Curated for clarity, not
                  clicks
                </span>
              </div>
              <div className="home-columns">
                <div className="main-column">
                  <div className="section-heading">
                    <h2>The latest, in context</h2>
                    <Link href="/legislation">
                      All federal actions <ArrowRight size={15} />
                    </Link>
                  </div>
                  {busy && !lead ? (
                    <div className="skeleton lead-skeleton" />
                  ) : (
                    lead && (
                      <article className="lead-card">
                        <Link
                          href={"/action/" + lead.document_number}
                          className="lead-visual"
                        >
                          <Capitol />
                          <span className="visual-caption">
                            WASHINGTON, D.C. · FEDERAL ACTIONS
                          </span>
                        </Link>
                        <div className="lead-content">
                          <div className="card-meta">
                            <span className="tag">{lead.status}</span>
                            <span>{fmt(lead.publication_date)}</span>
                            <button
                              className={
                                "icon-button " +
                                (saved.includes(lead.document_number)
                                  ? "is-saved"
                                  : "")
                              }
                              aria-label="Save featured action"
                              onClick={() => save(lead.document_number)}
                            >
                              <Bookmark
                                size={17}
                                fill={
                                  saved.includes(lead.document_number)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                          <Link href={"/action/" + lead.document_number}>
                            <h2>{lead.title}</h2>
                          </Link>
                          <p>{lead.abstract}</p>
                          <div className="lead-footer">
                            <SourceBadge />
                            <Link href={"/action/" + lead.document_number}>
                              Understand this action <ArrowRight size={16} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                  <div className="action-list">
                    {filtered
                      .filter(
                        (a) => a.document_number !== lead?.document_number,
                      )
                      .slice(0, 3)
                      .map((a) => (
                        <ActionRow
                          key={a.document_number}
                          action={a}
                          saved={saved.includes(a.document_number)}
                          onSave={() => save(a.document_number)}
                        />
                      ))}
                  </div>
                  {filtered.length === 0 && !busy && (
                    <p className="empty">No records match this filter.</p>
                  )}
                  <div className="section-heading explore-heading">
                    <h2>Go beyond the headline</h2>
                    <Link href="/policy">
                      Explore all topics <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div className="topic-grid">
                    {topics.slice(0, 3).map((t, i) => (
                      <Link
                        href={"/policy?topic=" + encodeURIComponent(t.tag)}
                        className={"topic-card topic-" + i}
                        key={t.tag}
                      >
                        <span className="topic-icon">
                          {i === 0 ? <Scale /> : i === 1 ? <Globe /> : <Leaf />}
                        </span>
                        <div className="eyebrow">{t.tag}</div>
                        <h3>{t.question}</h3>
                        <span>
                          Explore the question <ArrowUpRight size={15} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                <aside className="right-rail">
                  <div className="values-invite">
                    <div className="compass-art">
                      <Compass size={55} strokeWidth={0.8} />
                      <span className="orbit one" />
                      <span className="orbit two" />
                    </div>
                    <div className="eyebrow">
                      THE OTHER SIDE OF UNDERSTANDING
                    </div>
                    <h2>
                      The world is complex.
                      <br />
                      So are your values.
                    </h2>
                    <p>
                      Explore what matters to you, where your values meet, and
                      where they pull apart.
                    </p>
                    <Link className="button primary" href="/values">
                      Explore my values <ArrowUpRight size={16} />
                    </Link>
                    <span className="micro">
                      No labels. No scores. Just reflection.
                    </span>
                  </div>
                  <div className="briefing">
                    <div className="eyebrow">
                      <span className="tiny-dot" /> A MOMENT TO THINK
                    </div>
                    <h3>
                      “What would change
                      <br />
                      your mind?”
                    </h3>
                    <p>
                      A good question is often more useful than a quick answer.
                    </p>
                    <Link href="/debate">
                      Enter the Debate Lab <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div className="source-promise">
                    <ShieldCheck size={20} />
                    <h3>
                      Understanding starts
                      <br />
                      with the source.
                    </h3>
                    <p>
                      Official documents. Clear distinctions. Uncertainty made
                      visible.
                    </p>
                    <Link href="/methodology">
                      How we work <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </aside>
              </div>
              <section className="panel" aria-labelledby="gov-guide">
                <div className="eyebrow">START HERE IN 3 MINUTES</div>
                <h2 id="gov-guide">How government action actually happens</h2>
                <p>
                  Headlines often blur these steps. Each one means something
                  different, and only some of them change the law.
                </p>
                <div className="gov-guide">
                  {[
                    ["Bills", "Proposed laws in Congress or a state legislature. Most never pass. A bill becomes law only after both chambers pass the same text and the executive signs it (or a veto is overridden)."],
                    ["Laws", "Enacted statutes. They set the rules and often direct agencies to fill in the details."],
                    ["Rulemaking", "Agencies propose rules, take public comments, then publish final rules in the Federal Register. A proposed rule is not in force."],
                    ["Executive orders", "Presidential directives to the executive branch. They can't override statutes and can be revoked by a later president."],
                    ["Courts", "Judges decide disputes, including whether laws and rules are lawful. A ruling can pause (stay) or block an action."],
                    ["Implementation", "What agencies and officials actually do. Effective dates, funding, and enforcement can lag well behind an announcement."],
                    ["Ballot measures", "In states like Colorado, voters can change the constitution or state law directly."],
                  ].map(([t, d]) => (
                    <div key={t}>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="bottom-note">
                <span className="brand-symbol small-symbol">
                  ∩<span>∩</span>
                </span>
                <p>
                  Understand the world. Understand yourself.{" "}
                  <strong>Decide for yourself.</strong>
                </p>
                <span>No ads. No outrage. No agenda.</span>
              </div>
            </>
          )}
          {(section === "legislation" || section === "saved") && (
            <>
              <PageTitle
                eyebrow={
                  section === "saved"
                    ? "YOUR OWN READING ROOM"
                    : "FOLLOW THE PRIMARY DOCUMENTS"
                }
                title={
                  section === "saved"
                    ? "A little more to think about."
                    : "Government, without the guesswork."
                }
                text={
                  section === "saved"
                    ? "Your saved actions stay in this browser."
                    : "Explore official federal actions. A proposed rule is a proposal, not an enacted law."
                }
              />
              <div className="notice">
                <Info size={18} /> Federal Register integration. Congressional
                bills are not yet included. This edition uses only keyless
                public data. Source status appears below.
              </div>
              <SearchPanel
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
              />
              <FeedStatus feed={feed} />
              <div className="results-count">
                {
                  (section === "saved"
                    ? filtered.filter((a) => saved.includes(a.document_number))
                    : filtered
                  ).length
                }{" "}
                records in this feed
              </div>
              <div className="record-grid">
                {(section === "saved"
                  ? filtered.filter((a) => saved.includes(a.document_number))
                  : filtered
                ).map((a) => (
                  <ActionRow
                    key={a.document_number}
                    action={a}
                    saved={saved.includes(a.document_number)}
                    onSave={() => save(a.document_number)}
                  />
                ))}
              </div>
              {!busy &&
                (section === "saved"
                  ? filtered.filter((a) => saved.includes(a.document_number))
                  : filtered
                ).length === 0 && (
                  <div className="empty">
                    <Bookmark />
                    <h3>
                      {section === "saved"
                        ? "Your reading list is open."
                        : "No matching actions."}
                    </h3>
                    <p>
                      {section === "saved"
                        ? "Save an action using its bookmark button. Older saved records can be opened by document ID."
                        : "Try another search or action type."}
                    </p>
                  </div>
                )}
              {section === "saved" &&
                saved
                  .filter(
                    (id) => !actions.some((a) => a.document_number === id),
                  )
                  .map((id) => (
                    <p key={id}>
                      <Link href={"/action/" + id}>
                        Saved document {id} <ArrowUpRight size={14} />
                      </Link>
                    </p>
                  ))}
              {section === "legislation" && feed?.nextPage && (
                <button
                  className="button secondary load-more"
                  disabled={busy}
                  onClick={() => load(true)}
                >
                  {busy ? "Loading…" : "Load more official records"}
                </button>
              )}
            </>
          )}
          {section === "action" && (
            <ActionDetail
              action={
                selected ||
                actions.find((a) => a.document_number === documentId) ||
                null
              }
              busy={busy}
              saved={saved.includes(documentId || "")}
              onSave={() => save(documentId || "")}
            />
          )}
          {section === "policy" && <PolicyExplorer />}
          {section === "values" && <ValuesExplorer />}
          {section === "debate" && <DebateLab actions={actions} />}
          {section === "atlas" && <Atlas />}
          {(section === "vote" || section === "ballot") && (
            <HelpMeVote parts={section === "vote" ? parts.slice(1) : []} />
          )}
          {section === "methodology" && <Methodology />}
          {section === "privacy" && <Privacy onClear={() => setSaved([])} />}
          {section === "status" && (
            <>
              <PageTitle
                eyebrow="TRANSPARENCY, BUILT IN"
                title="A clear view of our sources."
                text="Source health, retrieval times, and what is—and isn’t—connected."
              />
              <FeedStatus feed={feed} />
              <div className="panel">
                <div className="section-heading">
                  <h2>Federal Register</h2>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      getFeed(1, true)
                        .then(setFeed)
                        .catch(() => setError("Source unavailable"));
                    }}
                  >
                    <RefreshCw size={15} />{" "}
                    {busy ? "Checking…" : "Check source"}
                  </button>
                </div>
                <p>
                  Public REST API · no key required · newest 40 documents per
                  page.
                </p>
                <dl className="facts">
                  <dt>Mode</dt>
                  <dd>{feed?.mode || "Connecting"}</dd>
                  <dt>Last retrieval</dt>
                  <dd>
                    {feed?.retrievedAt
                      ? new Date(feed.retrievedAt).toLocaleString()
                      : "Pending"}
                  </dd>
                  <dt>Durable storage</dt>
                  <dd>
                    No cloud database. Official records are cached in page
                    memory; a dated snapshot ships with the app.
                  </dd>
                  <dt>Cache policy</dt>
                  <dd>
                    15-minute browser-memory cache. Official data loads directly
                    from the free public API; no backend or paid proxy.
                  </dd>
                  <dt>Known limits</dt>
                  <dd>
                    Not a complete historical archive. The bundled snapshot is
                    refreshed by a daily scheduled job when official content
                    changes (best-effort; see the research pipeline docs). No
                    Congressional bill coverage yet.
                  </dd>
                </dl>
                <a
                  href="https://www.federalregister.gov/developers/documentation/api/v1"
                  target="_blank"
                  rel="noreferrer"
                >
                  API documentation <ExternalLink size={14} />
                </a>
              </div>
              <div className="panel">
                <h2>Colorado 2026 election data</h2>
                <p>
                  Manually transcribed from the Colorado Secretary of State and
                  Legislative Council, then validated by automated checks. Last
                  verified{" "}
                  {new Date(election.dataVerifiedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Denver",
                    timeZoneName: "short",
                  })}
                  .{" "}
                  {election.measures.filter((m) => m.draft.review.status === "reviewed").length}{" "}
                  of {election.measures.length} measure explanations reviewed.
                </p>
                <Link href="/vote/colorado">
                  Open Help Me Vote <ArrowRight size={14} />
                </Link>
              </div>
              <div className="panel">
                <h2>Congress.gov & GovInfo</h2>
                <p>
                  Congress.gov ingestion is not yet connected. GovInfo PDF links
                  are supplied by Federal Register records; a separate GovInfo
                  API adapter is not implemented.
                </p>
              </div>
              <div className="panel">
                <h2>Corrections log</h2>
                <p>
                  The effective-date presentation was corrected on October 22,
                  2026: comment deadlines now appear separately from effective
                  dates. Records are official metadata, not independently
                  reviewed explainers. Report other issues through the public
                  GitHub repository.
                </p>
              </div>
            </>
          )}
          {![
            "today",
            "legislation",
            "saved",
            "action",
            "policy",
            "values",
            "debate",
            "atlas",
            "ballot",
            "vote",
            "methodology",
            "privacy",
            "status",
          ].includes(section) && (
            <PageTitle
              eyebrow="404"
              title="This path is still unexplored."
              text="Use the navigation to return to Common Ground."
            />
          )}
          <footer>
            <span>Common Ground · An independent space for understanding</span>
            <Link href="/methodology">Methodology</Link>
            <Link href="/status">Source status</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
function HomeVoteBanner() {
  const phase = electionPhase(election, new Date());
  if (phase.phase === "after") return null;
  return (
    <div className="home-vote">
      <div>
        <div className="eyebrow" style={{ color: "#cfe0d4" }}>
          COLORADO · ELECTION DAY{" "}
          {new Date(election.electionDate + "T12:00:00Z")
            .toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })
            .toUpperCase()}
        </div>
        <h2>
          {phase.phase === "election-day"
            ? "It's Election Day. Ballots are due by 7 p.m."
            : `Your ballot, explained — ${phase.days} ${phase.days === 1 ? "day" : "days"} to go.`}
        </h2>
        <p>
          All {election.measures.filter((m) => m.scope === "statewide").length} statewide measures, statewide races, and how to find your
          official personal ballot. No recommendations, no address required.
        </p>
      </div>
      <Link className="button" href="/vote">
        Help Me Vote <ArrowRight size={15} />
      </Link>
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-title">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function FeedStatus({ feed }: { feed: Feed | null }) {
  return (
    <div className="feed-status">
      <span className="tiny-dot" />
      {feed
        ? `${feed.mode === "live" ? "Retrieved from official API" : feed.mode === "cache" ? "Cached official records" : "Dated real-source snapshot"} · Retrieved ${new Date(feed.retrievedAt).toLocaleString()}`
        : "Connecting to the Federal Register…"}
      {feed?.error && <span>{feed.error}</span>}
    </div>
  );
}
function SearchPanel({
  query,
  setQuery,
  filter,
  setFilter,
}: {
  query: string;
  setQuery: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
}) {
  useEffect(() => {
    const q = new URLSearchParams(routeSearch()).get("q");
    if (q) setQuery(q);
  }, [setQuery]);
  return (
    <div className="search-panel">
      <label>
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keyword, agency, or document ID"
          aria-label="Search federal records"
        />
      </label>
      <select
        aria-label="Action type"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        {[
          "All actions",
          "Final rule",
          "Proposed rule",
          "Presidential document",
          "Agency notice",
        ].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </div>
  );
}
function ActionRow({
  action: a,
  saved,
  onSave,
}: {
  action: Action;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <article className="action-row">
      <div
        className={"action-icon " + (a.type === "Proposed Rule" ? "gold" : "")}
      >
        <Landmark size={21} strokeWidth={1.4} />
      </div>
      <div className="action-text">
        <div className="card-meta">
          <span
            className={
              "type-label " + (a.type === "Proposed Rule" ? "gold-text" : "")
            }
          >
            {a.status}
          </span>
          <span>·</span>
          <span>{fmt(a.publication_date)}</span>
        </div>
        <Link href={"/action/" + a.document_number}>
          <h3>{a.title}</h3>
        </Link>
        <p>{a.agencies.map((x) => x.name || x.raw_name).join(" · ")}</p>
        <SourceBadge small />
      </div>
      <button
        aria-label={(saved ? "Remove from" : "Save to") + " reading list"}
        className={"icon-button " + (saved ? "is-saved" : "")}
        onClick={onSave}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
function ActionDetail({
  action: a,
  busy,
  saved,
  onSave,
}: {
  action: Action | null;
  busy: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  if (!a)
    return (
      <div className="empty">
        {busy
          ? "Retrieving official document…"
          : "Document unavailable. Search the Federal Register by document ID or try again."}
      </div>
    );
  const claims = metadataClaims(a);
  return (
    <>
      <Link href="/legislation" className="back-link">
        <ChevronLeft size={15} /> Federal actions
      </Link>
      <PageTitle
        eyebrow={a.status.toUpperCase() + " · " + a.document_number}
        title={a.title}
        text={a.agencies.map((x) => x.name || x.raw_name).join(" · ")}
      />
      <div className="detail-toolbar">
        <SourceBadge />
        <span>Published {fmt(a.publication_date)}</span>
        <button className="button secondary" onClick={onSave}>
          <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save for later"}
        </button>
        <CopyLink action={a} />
        <button className="button secondary" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <div className="notice">
        <ShieldCheck size={18} /> Official metadata and agency abstract. This is
        not an independently reviewed or AI-generated legal explainer.
      </div>
      <div className="topic-tabs">
        {["Overview", "Timeline", "Evidence & sources"].map((x) => (
          <button
            key={x}
            className={tab === x ? "selected" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="article-layout">
        <article className="panel longform">
          {tab === "Overview" ? (
            <>
              <h2>What the agency says</h2>
              <p>
                {a.abstract ||
                  "No abstract was supplied in this source record. Read the primary document for its substantive provisions."}
              </p>
              <h2>What happened</h2>
              <p>
                A {a.type.toLowerCase()} was published in the Federal Register
                on {fmt(a.publication_date)}.{" "}
                {a.type === "Proposed Rule"
                  ? "This is a proposal. Publication does not establish that it has been finalized or taken effect."
                  : a.type === "Rule"
                    ? "A final-rule publication is distinct from a bill becoming law. Effective dates and any exceptions must be checked in the document."
                    : "Publication alone does not establish enactment of legislation."}
              </p>
              {a.comments_close_on && (
                <>
                  <h2>Public comment period</h2>
                  <p>
                    <CommentStatus date={a.comments_close_on} /> Comments close{" "}
                    {fmt(a.comments_close_on)}, according to the official
                    record. The document explains how to submit a comment.
                  </p>
                </>
              )}
              <h2>When it takes effect</h2>
              <p>
                {a.effective_on
                  ? fmt(a.effective_on)
                  : "No effective date is established from the available metadata. A comment deadline is not an effective date."}
              </p>
              {a.dates && (
                <>
                  <h2>Dates stated in the source</h2>
                  <p>{a.dates}</p>
                  <p className="muted">
                    This may describe comment periods, hearings, or other
                    procedural dates. Read the source for context.
                  </p>
                </>
              )}
              <h2>
                Why this may matter <span className="tag">Analysis</span>
              </h2>
              <p>
                Understanding the scope, timing, and legal authority of this
                action is necessary before assessing its practical consequences.
                The abstract is a starting point; it may omit exceptions and
                procedural details.
              </p>
              <h2>What we have not established</h2>
              <ul>
                <li>
                  Who is affected and which exceptions apply, beyond the
                  agency’s abstract.
                </li>
                <li>
                  Fiscal effects, implementation costs, or independent evidence
                  of effectiveness.
                </li>
                <li>
                  Attributed supporter and critic arguments, or the status of
                  any legal challenge.
                </li>
              </ul>
              <p className="muted">
                These questions require full-text review and supporting
                evidence. We do not fill those gaps with generated claims.
              </p>
              <h2>Questions to ask</h2>
              <ul>
                {questionsFor(a.type).map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="muted">
                Neutral prompts based only on the document type, not on this
                document's content.
              </p>
              <h2>Key terms</h2>
              <dl className="glossary">
                {termsFor(a.type).map(([t, d]) => (
                  <div key={t}>
                    <dt>{t}</dt>
                    <dd>{d}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : tab === "Timeline" ? (
            <>
              <h2>Document timeline</h2>
              <div className="timeline">
                <div>
                  <span className="tiny-dot" />
                  <strong>{fmt(a.publication_date)}</strong>
                  <h3>{a.status} published</h3>
                  <p>Federal Register document {a.document_number}.</p>
                </div>
                {a.signing_date && (
                  <div>
                    <strong>{fmt(a.signing_date)}</strong>
                    <p>Signing date in official metadata.</p>
                  </div>
                )}
                {a.comments_close_on && (
                  <div>
                    <strong>{fmt(a.comments_close_on)}</strong>
                    <p>
                      Public comments close (official metadata).{" "}
                      <CommentStatus date={a.comments_close_on} />
                    </p>
                  </div>
                )}
                {a.effective_on && (
                  <div>
                    <strong>{fmt(a.effective_on)}</strong>
                    <p>Effective date in official metadata.</p>
                  </div>
                )}
                <div>
                  <span className="tiny-dot" />
                  <strong>{fmt(a.retrievedAt)}</strong>
                  <p>Record retrieved by Common Ground.</p>
                </div>
              </div>
              <p>
                No Congressional passage or presidential bill signature is
                inferred from this timeline.
              </p>
            </>
          ) : (
            <>
              <h2>Claims you can trace</h2>
              {claims.map((c, i) => (
                <div className="evidence-claim" key={i}>
                  <span className="tag">
                    Metadata validated · editorially unreviewed
                  </span>
                  <p>{c.text}</p>
                  <a href={a.html_url} target="_blank" rel="noreferrer">
                    [{a.document_number}] ·{" "}
                    {i === 0 ? "publication_date" : "abstract"} · characters{" "}
                    {c.passage?.start}–{c.passage?.end}{" "}
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
              <p>
                “Validated” refers to source schema and linkage, not independent
                confirmation of the agency’s substantive claims.
              </p>
              <h2>Version history</h2>
              <p>
                This static edition retrieves current metadata directly from the
                source. Historical full-text version comparison and editorial
                review are not yet available.
              </p>
            </>
          )}
        </article>
        <aside>
          <div className="panel source-panel">
            <div className="eyebrow">GO TO THE ORIGINAL</div>
            <h3>Primary documents</h3>
            <a href={a.html_url} target="_blank" rel="noreferrer">
              Federal Register document <ExternalLink size={15} />
            </a>
            {a.pdf_url && (
              <a href={a.pdf_url} target="_blank" rel="noreferrer">
                Official GovInfo PDF <ExternalLink size={15} />
              </a>
            )}
            <dl>
              <dt>Document ID</dt>
              <dd>{a.document_number}</dd>
              <dt>Jurisdiction</dt>
              <dd>{a.jurisdiction}</dd>
              <dt>Action type</dt>
              <dd>{a.eventType}</dd>
              <dt>Retrieved</dt>
              <dd>{new Date(a.retrievedAt).toLocaleString()}</dd>
            </dl>
          </div>
          <div className="panel">
            <h3>Publication ≠ implementation</h3>
            <p>
              A document’s publication date, legal effective date, and practical
              implementation can differ.
            </p>
            <Link href="/methodology">
              Our sourcing standards <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
const GLOSSARY: Record<string, [string, string]> = {
  fr: ["Federal Register", "The U.S. government's daily official publication of agency rules, proposed rules, notices, and presidential documents."],
  proposed: ["Proposed rule", "A draft regulation published for public comment. It has no legal force until an agency publishes a final rule."],
  final: ["Final rule", "A regulation the agency has adopted. It takes effect on its stated effective date, which can be later than publication."],
  comment: ["Comment period", "The window when anyone can submit comments on a proposed rule. Agencies must consider significant comments before finalizing."],
  effective: ["Effective date", "The date a rule becomes legally binding. It is different from the publication date."],
  notice: ["Notice", "An agency announcement — such as a meeting, application deadline, or policy statement — that usually does not itself create binding rules."],
  eo: ["Executive order", "A presidential directive to federal agencies. It cannot override a statute and can be revoked by a later president."],
  proclamation: ["Proclamation", "A presidential statement, often ceremonial; some proclamations have legal effect under specific statutes."],
  cfr: ["Code of Federal Regulations (CFR)", "The organized collection of final federal rules currently in force."],
};
function termsFor(type: string): [string, string][] {
  const k: Record<string, string[]> = {
    "Proposed Rule": ["fr", "proposed", "comment", "cfr"],
    Rule: ["fr", "final", "effective", "cfr"],
    Notice: ["fr", "notice"],
    "Presidential Document": ["fr", "eo", "proclamation"],
  };
  return (k[type] || ["fr"]).map((x) => GLOSSARY[x]);
}
function questionsFor(type: string) {
  const common = [
    "What legal authority does the agency cite for this action?",
    "Who is directly affected, and who might be affected indirectly?",
  ];
  const byType: Record<string, string[]> = {
    "Proposed Rule": [
      "When does the comment period close, and how can the public comment?",
      "What alternatives did the agency consider, and why did it prefer this one?",
      "What costs and benefits does the agency estimate, and how confident is it?",
    ],
    Rule: [
      "When does it take effect, and are there phase-ins or exceptions?",
      "How did the final rule change from the proposal after public comments?",
      "How will it be enforced, and could it face legal challenge?",
    ],
    Notice: [
      "Does this notice change anyone's obligations, or only announce something?",
      "Is there a deadline or meeting the public can take part in?",
    ],
    "Presidential Document": [
      "Which agencies are directed to act, and by when?",
      "Which existing laws limit what this document can do?",
      "What later actions (rules, guidance, funding) would be needed to implement it?",
    ],
  };
  return [...(byType[type] || []), ...common];
}
function CommentStatus({ date }: { date: string }) {
  const days = daysUntil(date, new Date(), "America/New_York");
  return (
    <span className="tag">
      {days < 0
        ? "Comment period closed"
        : days === 0
          ? "Comments close today"
          : `${days} ${days === 1 ? "day" : "days"} left to comment`}
    </span>
  );
}
function CopyLink({ action }: { action: Action }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="button secondary"
      onClick={() => {
        const text = `${action.title} — Federal Register ${action.document_number} (${action.publication_date}). Official source: ${action.html_url}`;
        navigator.clipboard
          ?.writeText(text)
          .then(() => setDone(true))
          .catch(() => setDone(false));
      }}
    >
      {done ? "Citation copied" : "Copy citation"}
    </button>
  );
}
function PolicyExplorer() {
  const [topic, setTopic] = useState("Economy"),
    [question, setQuestion] = useState("");
  useEffect(() => {
    const t = new URLSearchParams(routeSearch()).get("topic");
    if (t) setTopic(t);
  }, []);
  const t = topics.find((x) => x.tag === topic) || topics[0];
  return (
    <>
      <PageTitle
        eyebrow="FOLLOW YOUR CURIOSITY"
        title="Every policy begins with a question."
        text="Explore the values and mechanisms underneath public choices. These are conceptual learning guides, not claims about pending legislation."
      />
      <div className="topic-tabs">
        {topics.map((t) => (
          <button
            key={t.tag}
            className={topic === t.tag ? "selected" : ""}
            onClick={() => {
              setTopic(t.tag);
              setQuestion("");
            }}
          >
            {t.tag}
          </button>
        ))}
      </div>
      <div className="policy-feature">
        <div className="eyebrow">{t.name} · CONCEPTUAL GUIDE</div>
        <h2>{t.question}</h2>
        <p>{t.description}</p>
        <div className="three-columns">
          {[
            [
              "The goal",
              "What problem would a policy solve? Define the outcome before choosing a tool.",
            ],
            [
              "The mechanism",
              "Through what steps would the policy cause change? What assumptions must hold?",
            ],
            [
              "The tradeoff",
              "Who gains, who pays, and whose perspective is missing?",
            ],
          ].map(([h, p]) => (
            <div key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="two-columns">
        <div className="panel">
          <h2>Build your own question</h2>
          <label className="field-label" htmlFor="policy-question">
            What do you want to understand about this topic?
          </label>
          <textarea
            id="policy-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="For example: what would a fair transition look like?"
          />
          <Link
            href={
              "/debate?topic=" +
              encodeURIComponent(t.name) +
              "&question=" +
              encodeURIComponent(question)
            }
            className="button primary"
          >
            Think it through in Debate Lab <ArrowRight size={16} />
          </Link>
        </div>
        <div className="panel">
          <h2>Start with evidence</h2>
          <p>
            Look for a primary document, a baseline, a comparison, and the
            limits of what can be inferred.
          </p>
          <Link
            href={
              "/legislation?q=" +
              encodeURIComponent(
                t.tag === "Environment"
                  ? "environment"
                  : t.tag === "Health"
                    ? "health"
                    : t.tag === "Technology"
                      ? "data"
                      : "",
              )
            }
          >
            Search official actions <ArrowRight size={16} />
          </Link>
          <p className="muted">
            Search results are keyword matches, not an editorial assessment of
            relevance.
          </p>
          <a href="https://www.cbo.gov/topics" target="_blank" rel="noreferrer">
            Congressional Budget Office research <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </>
  );
}
type Reflection = {
  choice: string;
  why: string;
  confidence: string;
  change: string;
  tension: string;
};
function ValuesExplorer() {
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState<Record<number, Reflection>>({}),
    [persist, setPersist] = useState(false),
    [journal, setJournal] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cg-values");
      if (raw) {
        setAnswers(JSON.parse(raw));
        setPersist(true);
      }
    } catch {}
  }, []);
  const a = answers[step] || {
    choice: "",
    why: "",
    confidence: "Unsure",
    change: "",
    tension: "",
  };
  function update(p: Partial<Reflection>) {
    const next = { ...answers, [step]: { ...a, ...p } };
    setAnswers(next);
    if (persist) localStorage.setItem("cg-values", JSON.stringify(next));
  }
  const s = scenarios[step];
  return (
    <>
      <PageTitle
        eyebrow="NO LABELS. NO SCORES. JUST YOU."
        title="What matters to you—and why?"
        text="A private space to explore your values through real tensions. Your answers are not used to recommend candidates or infer a party."
      />
      <div className="privacy-strip">
        <ShieldCheck size={17} />
        <span>
          {persist
            ? "Saving on this device only."
            : "Session only. Your reflections disappear when you leave this page."}
        </span>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => {
              setPersist(e.target.checked);
              if (e.target.checked)
                localStorage.setItem("cg-values", JSON.stringify(answers));
              else localStorage.removeItem("cg-values");
            }}
          />{" "}
          Save on this device
        </label>
      </div>
      <div className="values-layout">
        <aside className="steps">
          <div className="eyebrow">YOUR EXPLORATION</div>
          {scenarios.map((s, i) => (
            <button
              key={s.title}
              className={step === i && !journal ? "selected" : ""}
              onClick={() => {
                setStep(i);
                setJournal(false);
              }}
            >
              <span>{answers[i]?.choice ? <Check size={14} /> : i + 1}</span>
              {s.dimension.split(" · ")[0]}
            </button>
          ))}
          <button
            className={journal ? "selected" : ""}
            onClick={() => setJournal(true)}
          >
            <span>
              <BookOpen size={14} />
            </span>
            Your reflection journal
          </button>
        </aside>
        <div>
          {journal ? (
            <div className="panel journal">
              <div className="eyebrow">IN YOUR OWN WORDS</div>
              <h2>Your values are a conversation.</h2>
              <p>
                This journal reflects only what you wrote. It does not classify
                your beliefs or score your choices.
              </p>
              {Object.keys(answers).length === 0 ? (
                <p className="empty">
                  Your journal is waiting. Explore a scenario to begin.
                </p>
              ) : (
                scenarios.map(
                  (s, i) =>
                    answers[i] && (
                      <div className="journal-entry" key={s.title}>
                        <h3>{s.title}</h3>
                        <p>
                          {answers[i].choice} · Certainty:{" "}
                          {answers[i].confidence}
                        </p>
                        <label className="field-label">
                          Your reasoning
                          <textarea
                            value={answers[i].why}
                            onChange={(e) => {
                              const next = {
                                ...answers,
                                [i]: { ...answers[i], why: e.target.value },
                              };
                              setAnswers(next);
                              if (persist)
                                localStorage.setItem(
                                  "cg-values",
                                  JSON.stringify(next),
                                );
                            }}
                          />
                        </label>
                        <p>
                          <strong>Evidence that could change your mind:</strong>{" "}
                          {answers[i].change || "An open question."}
                        </p>
                        <p>
                          <strong>A tension you noticed:</strong>{" "}
                          {answers[i].tension || "Still to explore."}
                        </p>
                      </div>
                    ),
                )
              )}
            </div>
          ) : (
            <div className="panel scenario">
              <div className="scenario-top">
                <span className="eyebrow">
                  SCENARIO {step + 1} OF {scenarios.length}
                </span>
                <span className="tag">Fictional scenario</span>
              </div>
              <div className="progress-track">
                <span
                  style={{ width: ((step + 1) / scenarios.length) * 100 + "%" }}
                />
              </div>
              <h2>{s.title}</h2>
              <p className="scenario-text">{s.text}</p>
              <h3>{s.question}</h3>
              <div className="choices">
                {s.choices.map((c) => (
                  <button
                    aria-pressed={a.choice === c}
                    className={a.choice === c ? "selected" : ""}
                    key={c}
                    onClick={() => update({ choice: c })}
                  >
                    {c}
                    {a.choice === c ? (
                      <Check size={16} />
                    ) : (
                      <span className="radio-circle" />
                    )}
                  </button>
                ))}
              </div>
              <label className="field-label">
                Why? What matters most in your reasoning?
                <textarea
                  value={a.why}
                  onChange={(e) => update({ why: e.target.value })}
                  placeholder="There isn’t a correct answer. Start with what feels important."
                />
              </label>
              <label className="field-label">
                How sure are you?
                <select
                  value={a.confidence}
                  onChange={(e) => update({ confidence: e.target.value })}
                >
                  {["Unsure", "Tentative", "Somewhat sure", "Very sure"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="field-label">
                What evidence would change your mind?
                <textarea
                  value={a.change}
                  onChange={(e) => update({ change: e.target.value })}
                  placeholder="Name a finding, experience, or unanswered question."
                />
              </label>
              <label className="field-label">
                Which two values feel in tension?
                <input
                  value={a.tension}
                  onChange={(e) => update({ tension: e.target.value })}
                  placeholder="For example: safety and privacy"
                />
              </label>
              <div className="scenario-nav">
                <button
                  className="button secondary"
                  disabled={step === 0}
                  onClick={() => setStep((x) => x - 1)}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    step === scenarios.length - 1
                      ? setJournal(true)
                      : setStep((x) => x + 1)
                  }
                >
                  {step === scenarios.length - 1
                    ? "Read my journal"
                    : "Next scenario"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="utility-row">
            <button
              onClick={() =>
                download("common-ground-values.json", {
                  exportedAt: new Date().toISOString(),
                  answers,
                  scenarios: scenarios.map((s) => s.title),
                })
              }
            >
              <Download size={15} /> Export reflections
            </button>
            <button
              onClick={() => {
                setAnswers({});
                localStorage.removeItem("cg-values");
                setPersist(false);
                setNotice(
                  "All values reflections deleted from this page and device.",
                );
              }}
            >
              <Trash2 size={15} /> Delete reflections
            </button>
          </div>
          <p role="status" className="muted">
            {notice}
          </p>
        </div>
      </div>
    </>
  );
}
function DebateLab({ actions }: { actions: Action[] }) {
  const modes = [
    "Socratic Coach",
    "Steelman Both Sides",
    "Explain Like I’m New",
    "Policy Tradeoffs",
    "Philosophical Roots",
  ];
  const [mode, setMode] = useState(modes[0]),
    [topic, setTopic] = useState("A question I’m exploring"),
    [position, setPosition] = useState(""),
    [turns, setTurns] = useState<{ heading: string; text: string }[]>([]),
    [notice, setNotice] = useState(""),
    [working, setWorking] = useState(false),
    [revision, setRevision] = useState(""),
    [history, setHistory] = useState<{ position: string; revision: string }[]>(
      [],
    );
  useEffect(() => {
    const u = new URLSearchParams(routeSearch());
    setTopic(u.get("topic") || "A question I’m exploring");
    setPosition(u.get("question") || "");
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setNotice("");
    try {
      const d = await localDebate({ position, mode, topic });
      setTurns(d.turns);
      setNotice(d.notice);
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : "The coach is unavailable. Please try again.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="UNDERSTAND, DON’T JUST WIN"
        title="A better kind of disagreement."
        text="Examine a position. Give a counterargument a fair hearing. See what becomes clearer."
      />
      <div className="debate-layout">
        <div>
          <form onSubmit={submit} className="panel">
            <label className="field-label">
              Choose a thinking mode
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {modes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Topic
              <input
                value={topic}
                maxLength={150}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
            <label className="field-label">
              Your position or question
              <textarea
                className="large-textarea"
                value={position}
                minLength={8}
                maxLength={4000}
                required
                onChange={(e) => setPosition(e.target.value)}
                placeholder="I think… because… But I’m uncertain about…"
              />
            </label>
            <div className="form-footer">
              <span>{position.length}/4,000 · private session</span>
              <button disabled={working} className="button primary">
                {working ? "Thinking…" : "Let’s think this through"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
          {notice && (
            <div role="status" className="notice">
              {notice}
            </div>
          )}
          {turns.length > 0 && (
            <div className="panel coach-response">
              <div className="eyebrow">
                <Compass size={15} /> YOUR THINKING PARTNER
              </div>
              {turns.map((t, i) => (
                <section key={i}>
                  <h3>{t.heading}</h3>
                  <p>{t.text}</p>
                </section>
              ))}
              <label className="field-label">
                How has your position changed?
                <textarea
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="I still think… but now I’m considering…"
                />
              </label>
              <button
                className="button secondary"
                disabled={!revision.trim()}
                onClick={() => {
                  setHistory((h) => [...h, { position, revision }]);
                  setPosition(revision);
                  setRevision("");
                  setTurns([]);
                  setNotice(
                    "Revision recorded for this session. Explore it again, or export your reflection.",
                  );
                }}
              >
                Record my revision <Check size={15} />
              </button>
            </div>
          )}
          {history.length > 0 && (
            <div className="panel">
              <h2>Your thinking, over time</h2>
              {history.map((h, i) => (
                <div className="journal-entry" key={i}>
                  <p>
                    <strong>Before:</strong> {h.position}
                  </p>
                  <p>
                    <strong>After:</strong> {h.revision}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="utility-row">
            <button
              onClick={() =>
                download("common-ground-debate.json", {
                  topic,
                  mode,
                  position,
                  turns,
                  history,
                })
              }
            >
              <Download size={15} /> Export session
            </button>
            <button
              onClick={() => {
                setPosition("");
                setTurns([]);
                setRevision("");
                setHistory([]);
                setNotice("Session deleted.");
              }}
            >
              <Trash2 size={15} /> Clear session
            </button>
          </div>
        </div>
        <aside>
          <div className="panel">
            <ShieldCheck size={24} />
            <h3>A coach, not a verdict.</h3>
            <p>
              Your reflections stay in this browser. This free edition has no AI
              endpoint, API key, account, or cloud database.
            </p>
            <p>
              This is a template-based reasoning guide, not generative AI. It
              asks questions and offers conceptual frames without recommending
              votes or candidates.
            </p>
            <Link href="/methodology">
              Our debate standards <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="panel">
            <div className="eyebrow">A SOURCE IS A STARTING POINT</div>
            <h3>Bring facts into the conversation.</h3>
            <p>
              These official documents are a separate reading list. The coach
              has not reviewed them and does not cite them as evidence.
            </p>
            {actions
              .filter((a) => a.abstract)
              .slice(0, 2)
              .map((a) => (
                <Link
                  className="source-reading"
                  key={a.document_number}
                  href={"/action/" + a.document_number}
                >
                  {a.title}
                  <ArrowUpRight size={15} />
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </>
  );
}
function Atlas() {
  const [query, setQuery] = useState(""),
    [period, setPeriod] = useState("All traditions"),
    [selected, setSelected] = useState("justice"),
    [zoom, setZoom] = useState(1),
    [offset, setOffset] = useState({ x: 0, y: 0 }),
    [list, setList] = useState(false),
    [edge, setEdge] = useState(""),
    [paths, setPaths] = useState<string[][]>([]);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const node = atlasNodes.find((n) => n.id === selected)!;
  const visible = atlasNodes.filter(
    (n) =>
      (period === "All traditions" || n.period === period) &&
      n.name.toLowerCase().includes(query.toLowerCase()),
  );
  const positions = Object.fromEntries(
    atlasNodes.map((n, i) => {
      if (n.id === "justice") return [n.id, { x: 400, y: 255 }];
      const angle = i * 2.39996;
      const radius = 115 + ((i * 37) % 140);
      return [
        n.id,
        {
          x: 400 + Math.cos(angle) * radius * 1.2,
          y: 255 + Math.sin(angle) * radius * 0.85,
        },
      ];
    }),
  );
  return (
    <>
      <PageTitle
        eyebrow="IDEAS HAVE ROOTS. FOLLOW THEM."
        title="A living map of human questions."
        text="Explore thinkers, traditions, and concepts. Connections are curated reading paths—interpretive similarities, not documented claims of influence."
      />
      <div className="search-panel">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search ideas"
            placeholder="Find a thinker or an idea…"
          />
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Filter period or tradition"
        >
          {[
            "All traditions",
            "Classical",
            "South Asian",
            "Early modern",
            "Modern",
            "Contemporary",
            "Concept",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="button secondary" onClick={() => setList(!list)}>
          {list ? "Graph view" : "Accessible list"}
        </button>
      </div>
      <div className="atlas-layout">
        <div className="atlas-canvas">
          {list ? (
            <div className="atlas-list">
              {visible.map((n) => (
                <button
                  key={n.id}
                  className={selected === n.id ? "selected" : ""}
                  onClick={() => setSelected(n.id)}
                >
                  <strong>{n.name}</strong>
                  <span>{n.period}</span>
                  <p>{n.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <svg
              viewBox="0 0 800 510"
              className="graph"
              role="img"
              aria-label="Interactive philosophy reading map. Use the accessible list for keyboard navigation."
              onPointerDown={(e) => {
                if ((e.target as SVGElement).tagName === "svg") {
                  drag.current = {
                    x: e.clientX,
                    y: e.clientY,
                    ox: offset.x,
                    oy: offset.y,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                if (drag.current)
                  setOffset({
                    x: drag.current.ox + (e.clientX - drag.current.x),
                    y: drag.current.oy + (e.clientY - drag.current.y),
                  });
              }}
              onPointerUp={() => (drag.current = null)}
            >
              <defs>
                <pattern
                  id="grid"
                  width="23"
                  height="23"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r=".7" fill="#c7cec4" />
                </pattern>
              </defs>
              <rect
                width="800"
                height="510"
                fill="url(#grid)"
                pointerEvents="none"
              />
              <g
                transform={`translate(${400 + offset.x},${255 + offset.y}) scale(${zoom}) translate(-400,-255)`}
              >
                {atlasEdges
                  .filter(
                    ([a, b]) =>
                      visible.some((n) => n.id === a) &&
                      visible.some((n) => n.id === b),
                  )
                  .map(([a, b]) => (
                    <g
                      key={a + b}
                      onClick={() =>
                        setEdge(
                          atlasNodes.find((n) => n.id === a)?.name +
                            " ↔ " +
                            atlasNodes.find((n) => n.id === b)?.name,
                        )
                      }
                    >
                      <line
                        x1={positions[a].x}
                        y1={positions[a].y}
                        x2={positions[b].x}
                        y2={positions[b].y}
                        stroke="transparent"
                        strokeWidth="13"
                      />
                      <line
                        x1={positions[a].x}
                        y1={positions[a].y}
                        x2={positions[b].x}
                        y2={positions[b].y}
                        stroke={
                          a === selected || b === selected
                            ? "#4e8172"
                            : "#c0cbbf"
                        }
                        strokeWidth={
                          a === selected || b === selected ? "2" : "1"
                        }
                        pointerEvents="none"
                      />
                    </g>
                  ))}
                {visible.map((n) => (
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={"Explore " + n.name}
                    key={n.id}
                    transform={`translate(${positions[n.id].x},${positions[n.id].y})`}
                    onClick={() => setSelected(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(n.id);
                    }}
                    className="graph-node"
                  >
                    <circle
                      r={n.period === "Concept" ? 27 : 21}
                      fill={
                        selected === n.id
                          ? "#245c50"
                          : n.period === "Concept"
                            ? "#e4d7b5"
                            : "#f9faf5"
                      }
                      stroke={selected === n.id ? "#245c50" : "#849780"}
                    />
                    <text
                      textAnchor="middle"
                      y="4"
                      fill={selected === n.id ? "#fff" : "#365144"}
                      fontSize="12"
                    >
                      {n.period === "Concept" ? "◇" : "✦"}
                    </text>
                    <text
                      textAnchor="middle"
                      y={n.period === "Concept" ? 45 : 39}
                      fill="#273f36"
                      fontSize="12"
                      fontWeight={selected === n.id ? "700" : "500"}
                    >
                      {n.name}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          )}
          <div className="graph-controls">
            <button
              className="icon-button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            >
              <Plus size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            >
              <Minus size={17} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              Reset
            </button>
            <span>Drag background to pan</span>
          </div>
        </div>
        <aside className="panel atlas-detail">
          <div className="eyebrow">{node.period}</div>
          <h2>{node.name}</h2>
          <p>{node.description}</p>
          <a href={node.source} target="_blank" rel="noreferrer">
            {node.id === "upanishads"
              ? "Stanford Encyclopedia · Upanishadic context"
              : "Stanford Encyclopedia of Philosophy"}{" "}
            <ExternalLink size={14} />
          </a>
          <h3>Keep exploring</h3>
          {atlasEdges
            .filter(([a, b]) => a === selected || b === selected)
            .map(([a, b]) => {
              const other = atlasNodes.find(
                (n) => n.id === (a === selected ? b : a),
              )!;
              return (
                <button
                  key={other.id}
                  className="trail-button"
                  onClick={() => {
                    setPaths((p) => [...p, [selected, other.id]]);
                    setSelected(other.id);
                  }}
                >
                  {other.name}
                  <ArrowRight size={14} />
                </button>
              );
            })}
          <p className="muted">
            Reading-path relationship · editorial interpretation. Consult each
            entry for differences within and across traditions.
          </p>
          {edge && (
            <div className="notice">
              {edge}: a thematic reading path, not a historical influence claim.
            </div>
          )}
          <button
            className="button secondary"
            onClick={() => download("common-ground-reading-paths.json", paths)}
          >
            <Download size={14} /> Export explored paths
          </button>
        </aside>
      </div>
    </>
  );
}
function Methodology() {
  return (
    <>
      <PageTitle
        eyebrow="TRUST IS SOMETHING YOU CAN INSPECT"
        title="More understanding. Less spin."
        text="Our purpose is civic education: to help you examine documents, understand uncertainty, and make your own judgments."
      />
      <div className="methodology-grid">
        {[
          [
            "01",
            "Start with primary sources",
            "Federal Register metadata and agency abstracts are fetched from the official public API. Original document and GovInfo PDF links appear on each record. Agency statements are attributed; they are not independent proof of outcomes.",
          ],
          [
            "02",
            "Keep facts and interpretation separate",
            "Document type, publication date, and agency are source metadata. Agency abstracts are displayed as supplied. Analytical context is labeled; unknown effects, costs, and political reactions remain unknown.",
          ],
          [
            "03",
            "A proposal is not a law",
            "Proposed rules, final rules, notices, and presidential documents remain distinct. A publication date is not an enactment or effective date. Congressional bills are not yet ingested.",
          ],
          [
            "04",
            "Don’t fill uncertainty with confidence",
            "There are no numerical truth scores, fabricated quotations, or invented citations. Source-linked metadata claims are schema-validated but editorially unreviewed. High-impact generated factual explainers are not published.",
          ],
          [
            "05",
            "Reflection without persuasion",
            "Values are private reflections, not a party classifier. Debate modes examine assumptions and tradeoffs without vote recommendations. No sensitive data is used for political targeting.",
          ],
          [
            "06",
            "Selection without outrage",
            "The feed is the newest documents returned by the Federal Register, ordered by publication. The featured card is the first record with an informative abstract. This is neither a complete world news service nor an engagement ranking.",
          ],
        ].map(([n, t, p]) => (
          <section className="panel" key={n}>
            <div className="eyebrow">{n} / OUR APPROACH</div>
            <h2>{t}</h2>
            <p>{p}</p>
          </section>
        ))}
      </div>
      <div className="panel longform">
        <h2>What this beta can and cannot establish</h2>
        <p>
          We provide a traceable way into official documents. We have not
          independently verified the full substantive contents of each document.
          Colorado ballot information is transcribed from official sources and
          checked; plain-language ballot explanations appear only after editorial
          review.
          The debate coach runs locally using transparent reasoning templates.
          Generative AI and paid API integrations are disabled in this
          zero-spending edition.
        </p>
        <h2>Thought Atlas references</h2>
        <p>
          Curated nodes link to scholarly entries in the Stanford Encyclopedia
          of Philosophy. Descriptions are brief editorial paraphrases. Graph
          edges are labeled thematic reading paths; they do not assert direct
          historical influence.
        </p>
        <h2>Corrections & source history</h2>
        <p>
          This edition displays live official metadata or a clearly dated
          bundled snapshot. It has no cloud database or historical version
          archive. A formal correction submission and review system remains to
          be implemented.
        </p>
        <Link className="button secondary" href="/status">
          Inspect source status <ArrowRight size={15} />
        </Link>
        <h2>Working name</h2>
        <p>
          Common Ground is a working product name. Trademark and domain
          clearance have not been completed; no exclusive rights are claimed.
        </p>
      </div>
    </>
  );
}
function Privacy({ onClear }: { onClear: () => void }) {
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="YOUR THINKING BELONGS TO YOU"
        title="Private by default. Clear by design."
        text="Browse anonymously. Choose what to keep. Take it with you, or delete it."
      />
      <div className="panel longform">
        <h2>What stays on your device</h2>
        <p>
          Values reflections and your ballot research guide remain in page memory unless you
          explicitly enable device saving. Saved reading IDs use local storage.
          Debate history exists only in the current page session. Nothing is
          synchronized across devices.
        </p>
        <h2>What reaches a server</h2>
        <p>
          GitHub Pages serves the static app and may keep standard request logs.
          Your browser requests public records directly from
          FederalRegister.gov. Values, debate text, and ballot notes never leave
          this browser. No analytics, advertising, AI API, or third-party font
          requests are included.
        </p>
        <h2>Retention</h2>
        <p>
          Session reflections are cleared when you leave or reload the page.
          Opt-in device data remains until you delete it or clear browser
          storage. Public official records are cached in page memory for up to
          15 minutes. A dated public-source snapshot is part of the application
          files.
        </p>
        <h2>No political profiling</h2>
        <p>
          No ad trackers, party-affinity scores, hidden political profiling, or
          personalized voting recommendations. Reading preferences never feed a
          persuasion engine.
        </p>
        <div className="utility-row">
          <button
            className="button secondary"
            onClick={() => {
              const data: Record<string, unknown> = {};
              ["cg-values", "cg-saved", "cg-ballot", "cg-vote-guide"].forEach((k) => {
                data[k] = localStorage.getItem(k);
              });
              download("common-ground-device-data.json", data);
            }}
          >
            <Download size={16} /> Export all device data
          </button>
          <button
            className="button danger"
            onClick={() => {
              clearPrivate(localStorage);
              setDeleted(true);
              onClear();
            }}
          >
            <Trash2 size={16} /> Delete all device data
          </button>
        </div>
        {deleted && (
          <p role="status" className="success">
            All Common Ground device data has been deleted. Reflections in other
            open tabs may remain in memory until those tabs are closed.
          </p>
        )}
      </div>
    </>
  );
}
