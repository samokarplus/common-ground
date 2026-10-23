"use client";
// External URL and local-storage state is hydrated after SSR; these effects intentionally initialize client state.
/* eslint-disable react-hooks/set-state-in-effect */
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import Link, { routeSearch } from "./link";
import { getFeed, getDocument } from "@/lib/free-source";
import { localDebate } from "@/lib/local-debate";
import HelpMeVote, { election, clearResearchGuide } from "./help-me-vote";
const Congress = lazy(() => import("./congress"));
const DebateMaps = lazy(() => import("./debate-maps"));
import Corrections from "./corrections";
import HealthPanel from "./health-panel";
const ChainPage = lazy(() => import("./chain"));
const Pathways = lazy(() => import("./pathways"));
const SiteSearch = lazy(() => import("./site-search"));
const Review = lazy(() => import("./review"));
const Credits = lazy(() => import("./credits"));
import { BrandMark, BookStack, Speech, Sprig, Scroll } from "./art";
const IMG = import.meta.env.BASE_URL + "images/";
// CSS custom properties resolve url() against the stylesheet, so the page-header photo needs an absolute address.
const IMG_ABS = new URL(IMG, document.baseURI).href;

/** Which photograph backs a page header. */
function roomFor(section: string, parts: string[]): string | undefined {
  if (section === "vote" || section === "ballot") return ["contest", "judges", "compare"].includes(parts[1] ?? "") ? "colorado-dome" : "aspens";
  if (section === "congress" || section === "legislation" || section === "action" || section === "saved") return "us-capitol";
  if (section === "policy" || section === "paths" || section === "chain") return "writing";
  if (section === "values") return "open-book";
  if (section === "debate") return "market";
  if (section === "atlas") return "reading-room";
  if (["methodology", "privacy", "status", "review", "corrections", "search", "credits"].includes(section)) return "meadow";
  return undefined;
}
import { agencyOptions, applyFeedFilters } from "@/lib/feed-filter";
import { TENSIONS } from "@/lib/values-tradeoffs";
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
  Scale,
  Info,
} from "lucide-react";
import type { Action } from "@/lib/domain";
import { clearPrivate, metadataClaims } from "@/lib/domain";
import { topics, scenarios } from "@/lib/content";
import { atlasNodes, atlasEdges } from "@/lib/atlas";
import { ATLAS_BALLOT_LINKS } from "@/lib/crosslinks";
import type { Feed } from "@/lib/free-source";
const nav = [
  ["today", "Today", Sun],
  ["vote", "Help Me Vote", Vote],
  ["congress", "Congress", Landmark],
  ["legislation", "Federal Register", Landmark],
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
    [openOnly, setOpenOnly] = useState(false),
    [sinceDays, setSinceDays] = useState(0),
    [agency, setAgency] = useState(""),
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
  const filtered = applyFeedFilters(actions, { query, status: filter, openForComment: openOnly, sinceDays, agency }, new Date());
  const agencies = agencyOptions(actions);
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
  useEffect(() => {
    document.title = section === "today" ? "Common Ground" : `${current} · Common Ground`;
  }, [section, current]);
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
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" aria-label="Common Ground home">
            <BrandMark className="brand-mark" />
            <span>
              common ground<span className="brand-period">.</span>
            </span>
          </Link>
          <nav id="site-nav" className={"site-nav " + (mobile ? "open" : "")} aria-label="Main navigation">
            {nav.map(([id, label, Icon]) => (
              <Link
                href={id === "today" ? "/" : "/" + id}
                key={id}
                onClick={() => setMobile(false)}
                className={"nav-link " + (section === id ? "active" : "") + (id === "saved" ? " nav-saved" : "")}
                aria-current={section === id ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === "saved" && saved.length > 0 && <span className="count">{saved.length}</span>}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            <form
              className="global-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.hash = "/search?q=" + encodeURIComponent(query);
              }}
            >
              <Search size={16} />
              <input
                aria-label="Search Common Ground"
                name="q"
                placeholder="Search…"
                defaultValue={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
            <Link href="/saved" className="top-bookmark" aria-label="Reading list">
              <Bookmark size={19} />
            </Link>
            <button
              className="menu-toggle"
              aria-label="Toggle navigation"
              aria-expanded={mobile}
              aria-controls="site-nav"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <div className="page-shell">
        <main
          id="main"
          tabIndex={-1}
          className={"main-content " + (section === "today" ? "home" : "")}
          data-room={roomFor(section, parts.slice(1)) ? section : undefined}
          style={roomFor(section, parts.slice(1)) ? ({ "--room-img": `url(${IMG_ABS}${roomFor(section, parts.slice(1))}.jpg)` } as React.CSSProperties) : undefined}
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
              <section className="hero" aria-labelledby="hero-title">
                <img
                  src={IMG + "reading-room.jpg"}
                  srcSet={`${IMG}reading-room-sm.jpg 720w, ${IMG}reading-room.jpg 1400w`}
                  sizes="100vw"
                  alt=""
                  fetchPriority="high"
                />
                <div className="hero-inner">
                  <div className="eyebrow">A WARM PLACE TO UNDERSTAND THE WORLD</div>
                  <h1 id="hero-title">
                    Make sense of the world. <em>Make up your own mind.</em>
                  </h1>
                  <p>
                    Pull up a chair. Read the sources behind the headlines, weigh the best arguments on every side, and decide for yourself, in
                    private and at your own pace.
                  </p>
                  <div className="hero-actions">
                    <Link className="button primary" href="/vote">
                      Understand my ballot <ArrowRight size={16} />
                    </Link>
                    <Link className="button light" href="/atlas">
                      Wander the library
                    </Link>
                  </div>
                  <div className="hero-meta">
                    <span>
                      {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" })}
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
                </div>
              </section>

              <div className="home-wrap">
                <HomeVoteBanner />

                <section className="section-space" aria-labelledby="rooms-title">
                  <div className="section-intro">
                    <div className="eyebrow">THE ROOMS OF THE LIBRARY</div>
                    <h2 id="rooms-title">Wander in. Stay as long as you like.</h2>
                    <p>Each room explains something differently. None of them tells you what to think.</p>
                  </div>
                  <nav className="rooms" aria-label="Start exploring">
                    <Link href="/debate" className="room a">
                      <img src={IMG + "market-sm.jpg"} srcSet={`${IMG}market-sm.jpg 720w, ${IMG}market.jpg 1400w`} sizes="(max-width: 820px) 100vw, 58vw" alt="" loading="lazy" />
                      <h3>Debate Lab</h3>
                      <p>Hear the strongest case for each side, then test your own reasoning. Facts, predictions and values, kept apart.</p>
                      <span className="go">Enter the Debate Lab →</span>
                    </Link>
                    <Link href="/values" className="room b">
                      <img src={IMG + "open-book-sm.jpg"} srcSet={`${IMG}open-book-sm.jpg 720w, ${IMG}open-book.jpg 1400w`} sizes="(max-width: 820px) 100vw, 42vw" alt="" loading="lazy" />
                      <h3>My Values</h3>
                      <p>A private place to think about what matters to you. Reflection, not a quiz score.</p>
                      <span className="go">Begin reflecting →</span>
                    </Link>
                    <Link href="/congress" className="room c">
                      <img src={IMG + "us-capitol-sm.jpg"} srcSet={`${IMG}us-capitol-sm.jpg 720w, ${IMG}us-capitol.jpg 1400w`} sizes="(max-width: 820px) 100vw, 33vw" alt="" loading="lazy" />
                      <h3>Congress</h3>
                      <p>Real bills, real votes, and how a bill becomes law.</p>
                      <span className="go">Follow a bill →</span>
                    </Link>
                    <Link href="/atlas" className="room d paper">
                      <BookStack className="art" />
                      <div>
                        <h3>Thought Atlas</h3>
                        <p>Eighty-six ideas, from liberalism to the social contract, and how they connect.</p>
                        <span className="go">Browse the ideas →</span>
                      </div>
                    </Link>
                    <Link href="/policy" className="room e clay">
                      <Scroll className="art" />
                      <div>
                        <h3>Policy Explorer</h3>
                        <p>The questions underneath public choices: goals, mechanisms and tradeoffs.</p>
                        <span className="go">Explore a question →</span>
                      </div>
                    </Link>
                  </nav>
                </section>

                <section className="section-space" aria-labelledby="latest-title">
                  <div className="section-intro">
                    <div className="eyebrow">FROM THE FEDERAL REGISTER</div>
                    <h2 id="latest-title">The latest, in context.</h2>
                    <p>Official government documents, explained plainly, with the original always one click away.</p>
                  </div>
                  <div className="topic-tabs" role="group" aria-label="Filter federal feed">
                    {["All actions", "Final rule", "Proposed rule", "Presidential document", "Agency notice"].map((t) => (
                      <button key={t} className={filter === t ? "selected" : ""} aria-pressed={filter === t} onClick={() => setFilter(t)}>
                        {t === "All actions" ? "All actions" : t === "Final rule" ? "Final rules" : t === "Proposed rule" ? "Proposals" : t === "Agency notice" ? "Notices" : "Presidential actions"}
                      </button>
                    ))}
                  </div>
                  <div className="latest">
                    {busy && !lead ? (
                      <div className="skeleton lead-skeleton" />
                    ) : (
                      lead && (
                        <article className="lead-card">
                          <Link href={"/action/" + lead.document_number} className="lead-visual" aria-hidden="true" tabIndex={-1}>
                            <img src={IMG + "us-capitol-sm.jpg"} alt="" loading="lazy" />
                            <span className="visual-caption">WASHINGTON, D.C. · FEDERAL ACTIONS</span>
                          </Link>
                          <div className="lead-content">
                            <div className="card-meta">
                              <span className="tag">{lead.status}</span>
                              <span>{fmt(lead.publication_date)}</span>
                              <button
                                className={"icon-button " + (saved.includes(lead.document_number) ? "is-saved" : "")}
                                aria-label="Save featured action"
                                onClick={() => save(lead.document_number)}
                              >
                                <Bookmark size={17} fill={saved.includes(lead.document_number) ? "currentColor" : "none"} />
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
                        .filter((a) => a.document_number !== lead?.document_number)
                        .slice(0, 3)
                        .map((a) => (
                          <ActionRow key={a.document_number} action={a} saved={saved.includes(a.document_number)} onSave={() => save(a.document_number)} />
                        ))}
                      {filtered.length === 0 && !busy && <p className="empty">No records match this filter.</p>}
                      <Link href="/legislation" className="button secondary">
                        All federal actions <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>

              <section className="quote-band" aria-label="A question to take with you">
                <img src={IMG + "meadow-sm.jpg"} srcSet={`${IMG}meadow-sm.jpg 720w, ${IMG}meadow.jpg 1400w`} sizes="100vw" alt="" loading="lazy" />
                <blockquote>
                  <p>“What would change your mind?”</p>
                  <cite>A good question is often more useful than a quick answer.</cite>
                  <div>
                    <Link href="/debate" className="button light">
                      Take it to the Debate Lab <ArrowRight size={15} />
                    </Link>
                  </div>
                </blockquote>
              </section>

              <div className="home-wrap">
                <section className="section-space" aria-labelledby="promise-title">
                  <div className="section-intro">
                    <div className="eyebrow">WHY COMMON GROUND</div>
                    <h2 id="promise-title">A few promises we keep.</h2>
                  </div>
                  <div className="promise">
                    <div>
                      <Sprig className="art" />
                      <h3>Start from the source.</h3>
                      <p>Official documents first. When something is uncertain, we say so, and we label what a machine checked and what a person did.</p>
                    </div>
                    <div>
                      <Speech className="art" />
                      <h3>Every side, fairly put.</h3>
                      <p>Strong arguments from different perspectives, with facts, predictions and values kept apart. No scores, no hidden agenda.</p>
                    </div>
                    <div>
                      <ShieldCheck size={44} strokeWidth={1.6} />
                      <h3>Your thinking is yours.</h3>
                      <p>No accounts, no tracking. Your notes stay on your device unless you choose otherwise, and you can delete them any time.</p>
                    </div>
                  </div>
                </section>

                <section className="section-space" aria-labelledby="gov-guide">
                  <div className="section-intro">
                    <div className="eyebrow">START HERE IN THREE MINUTES</div>
                    <h2 id="gov-guide">How government action actually happens.</h2>
                    <p>Headlines blur these steps. Each means something different, and only some of them change the law.</p>
                  </div>
                  <ol className="journey">
                    {[
                      ["Bills", "Proposed laws. Most never pass. A bill becomes law only after both chambers pass the same text and the executive signs it, or a veto is overridden."],
                      ["Laws", "Enacted statutes. They set the rules and often direct agencies to fill in the details."],
                      ["Rulemaking", "Agencies propose rules, take public comment, then publish final rules. A proposed rule is not in force."],
                      ["Executive orders", "Presidential directives to the executive branch. They can't override statutes and a later president can revoke them."],
                      ["Courts", "Judges decide whether laws and rules are lawful. A ruling can pause or block an action."],
                      ["Implementation", "What agencies and officials actually do. Effective dates, funding and enforcement can lag well behind an announcement."],
                      ["Ballot measures", "In states like Colorado, voters can change the constitution or state law directly."],
                    ].map(([t, d]) => (
                      <li key={t}>
                        <h3>{t}</h3>
                        <p>{d}</p>
                      </li>
                    ))}
                  </ol>
                </section>

                <div className="home-end">
                  <p>Understand the world. Understand yourself. Decide for yourself.</p>
                  <span>No ads. No outrage. No agenda.</span>
                </div>
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
                openOnly={openOnly}
                setOpenOnly={setOpenOnly}
                sinceDays={sinceDays}
                setSinceDays={setSinceDays}
                agency={agency}
                setAgency={setAgency}
                agencies={agencies}
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
          {section === "debate" &&
            (parts[1] === "maps" ? (
              <Suspense fallback={<p className="empty">Loading…</p>}>
                <DebateMaps id={parts[2]} />
              </Suspense>
            ) : (
              <DebateLab actions={actions} />
            ))}
          {section === "atlas" && <Atlas />}
          {(section === "vote" || section === "ballot") && (
            <HelpMeVote parts={section === "vote" ? parts.slice(1) : []} />
          )}
          {section === "congress" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <Congress parts={parts.slice(1)} />
            </Suspense>
          )}
          {section === "credits" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <Credits />
            </Suspense>
          )}
          {section === "review" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <Review />
            </Suspense>
          )}
          {section === "search" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <SiteSearch />
            </Suspense>
          )}
          {section === "paths" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <Pathways />
            </Suspense>
          )}
          {section === "chain" && (
            <Suspense fallback={<p className="empty">Loading…</p>}>
              <ChainPage />
            </Suspense>
          )}
          {section === "corrections" && <Corrections />}
          {section === "methodology" && <Methodology />}
          {section === "privacy" && <Privacy onClear={() => { setSaved([]); clearResearchGuide(); }} />}
          {section === "status" && (
            <>
              <PageTitle
                eyebrow="TRANSPARENCY, BUILT IN"
                title="A clear view of our sources."
                text="Source health, retrieval times, and what is—and isn’t—connected."
              />
              <HealthPanel />
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
            "congress",
            "corrections",
            "chain",
            "paths",
            "search",
            "review",
            "credits",
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

        </main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div>
              <h2>Common Ground</h2>
              <p>
                An independent place to understand laws, elections and ideas, and to decide for yourself. No ads, no accounts, no tracking, no
                agenda.
              </p>
            </div>
            <div>
              <h3>Explore</h3>
              <ul>
                <li><Link href="/vote">Help Me Vote</Link></li>
                <li><Link href="/congress">Congress</Link></li>
                <li><Link href="/debate/maps">Debate maps</Link></li>
                <li><Link href="/atlas">Thought Atlas</Link></li>
                <li><Link href="/paths">Pathways</Link></li>
              </ul>
            </div>
            <div>
              <h3>Trust</h3>
              <ul>
                <li><Link href="/methodology">How we work</Link></li>
                <li><Link href="/privacy">Privacy and your data</Link></li>
                <li><Link href="/status">Source status</Link></li>
                <li><Link href="/review">Editorial review</Link></li>
                <li><Link href="/corrections">Report a correction</Link></li>
                <li><Link href="/credits">Photo credits</Link></li>
              </ul>
            </div>
            <p className="fine">Free public beta. Machine-checked content is labeled as not human-reviewed wherever it appears.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
function HomeVoteBanner() {
  const phase = electionPhase(election, new Date());
  if (phase.phase === "after") return null;
  const statewide = election.measures.filter((m) => m.scope === "statewide").length;
  return (
    <section className="section-space" aria-labelledby="vote-feature">
      <div className="election-feature">
        <figure className="arch-photo">
          <img src={IMG + "aspens-sm.jpg"} srcSet={`${IMG}aspens-sm.jpg 720w, ${IMG}aspens.jpg 1400w`} sizes="(max-width: 820px) 90vw, 46vw" alt="Golden aspen trees below red mountain peaks in Colorado" loading="lazy" />
        </figure>
        <div>
          <span className="countdown">
            <Vote size={18} />
            {phase.phase === "election-day"
              ? "It's Election Day. Ballots are due by 7 p.m."
              : `Colorado votes November 3 · ${phase.days} ${phase.days === 1 ? "day" : "days"} to go`}
          </span>
          <h2 id="vote-feature">Your ballot, explained like a friend would.</h2>
          <p className="lede">
            Every statewide measure and race, with the official numbers, the strongest arguments on each side, and a private notebook for your own
            thinking. We never tell you how to vote.
          </p>
          <div className="fact-trio">
            <div>
              <strong>{statewide}</strong>
              <span>statewide measures explained</span>
            </div>
            <div>
              <strong>13</strong>
              <span>candidate profiles, each sourced</span>
            </div>
            <div>
              <strong>0</strong>
              <span>addresses collected</span>
            </div>
          </div>
          <Link className="button primary" href="/vote">
            Start with my ballot <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
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
  openOnly,
  setOpenOnly,
  sinceDays,
  setSinceDays,
  agency,
  setAgency,
  agencies,
}: {
  query: string;
  setQuery: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  openOnly: boolean;
  setOpenOnly: (b: boolean) => void;
  sinceDays: number;
  setSinceDays: (n: number) => void;
  agency: string;
  setAgency: (s: string) => void;
  agencies: string[];
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
      <select aria-label="Agency" value={agency} onChange={(e) => setAgency(e.target.value)}>
        <option value="">Any agency in this feed</option>
        {agencies.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select aria-label="Published within" value={sinceDays} onChange={(e) => setSinceDays(Number(e.target.value))}>
        <option value={0}>Any date in this feed</option>
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
      </select>
      <label className="check-label">
        <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open for public comment
      </label>
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
      <>
        <Link href="/legislation" className="back-link">
          <ChevronLeft size={15} /> Federal actions
        </Link>
        <PageTitle
          eyebrow="FEDERAL DOCUMENT"
          title={busy ? "Retrieving the official document…" : "This document is unavailable."}
          text={
            busy
              ? "Fetching the record from the Federal Register."
              : "The Federal Register could not be reached or has no document with this ID. Search the feed by document ID, or try again later."
          }
        />
      </>
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
function TradeoffsPanel({
  choices,
  setChoices,
}: {
  choices: Record<string, string>;
  setChoices: (c: Record<string, string>) => void;
}) {
  return (
    <div className="panel">
      <div className="eyebrow">VALUES MEET REAL CHOICES</div>
      <h2>The same values pull in different directions.</h2>
      <p>
        These are tensions that show up in Colorado's 2026 ballot measures, described with the official Blue Book's arguments. They do not
        say which way your values should lead, and different people resolve each tension differently for good reasons. Common Ground does
        not score you or map these to any party or identity.
      </p>
      {TENSIONS.map((t) => (
        <section key={t.id} className="journal-entry">
          <h3>
            {t.values[0]} <span aria-hidden="true">↔</span>
            <span className="sr-only"> versus </span> {t.values[1]}
          </h3>
          <p>{t.question}</p>
          <div className="filter-row" role="group" aria-label={`Your thinking on ${t.values[0]} versus ${t.values[1]}`}>
            {[
              [`${t.values[0]} weighs more for me here`, "a"],
              [`${t.values[1]} weighs more for me here`, "b"],
              ["It depends", "depends"],
              ["I'm unsure", "unsure"],
            ].map(([label, key]) => (
              <button
                key={key}
                className={choices[t.id] === key ? "selected" : ""}
                aria-pressed={choices[t.id] === key}
                onClick={() => setChoices({ ...choices, [t.id]: choices[t.id] === key ? "" : key })}
              >
                {label}
              </button>
            ))}
          </div>
          <ul>
            {t.measures.map((m) => {
              const measure = election.measures.find((x) => x.id === m.id);
              return (
                <li key={m.id}>
                  <Link href={`/vote/colorado/measure/${m.id}`}>{measure?.designation}: {measure?.shortTitle}</Link> — {m.how}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="muted">
        Your selections stay on this page for this visit, are never scored or sent anywhere, and are included only if you download your
        reflections. They are not saved unless you add them to your own notes.
      </p>
      <p>
        Want to test your reasoning on one of these? Open a <Link href="/debate/maps">debate map</Link>.
      </p>
    </div>
  );
}
function ValuesExplorer() {
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState<Record<number, Reflection>>({}),
    [persist, setPersist] = useState(false),
    [journal, setJournal] = useState(false),
    [tradeoffs, setTradeoffs] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [choices, setChoices] = useState<Record<string, string>>({}),
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
        <button
          className="button secondary"
          onClick={() => {
            const blob = new Blob(
              [JSON.stringify({ exportedFrom: "Common Ground Values Explorer", note: "Your own reflections only. No scores or labels.", reflections: answers, tradeoffThinking: choices }, null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const el = document.createElement("a");
            el.href = url;
            el.download = "my-values-reflections.json";
            el.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={14} /> Download my reflections
        </button>
        {!confirmDelete ? (
          <button className="button danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Delete all
          </button>
        ) : (
          <span className="confirm-row" role="group" aria-label="Confirm deletion">
            Delete every reflection?{" "}
            <button
              className="button danger"
              onClick={() => {
                setAnswers({});
                setChoices({});
                setPersist(false);
                try {
                  localStorage.removeItem("cg-values");
                } catch {}
                setConfirmDelete(false);
              }}
            >
              Yes, delete
            </button>{" "}
            <button className="button secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </span>
        )}
      </div>
      <div className="values-layout">
        <aside className="steps">
          <div className="eyebrow">YOUR EXPLORATION</div>
          {scenarios.map((s, i) => (
            <button
              key={s.title}
              className={step === i && !journal && !tradeoffs ? "selected" : ""}
              onClick={() => {
                setStep(i);
                setJournal(false);
                setTradeoffs(false);
              }}
            >
              <span>{answers[i]?.choice ? <Check size={14} /> : i + 1}</span>
              {s.dimension.split(" · ")[0]}
            </button>
          ))}
          <button
            className={tradeoffs ? "selected" : ""}
            onClick={() => {
              setTradeoffs(true);
              setJournal(false);
            }}
          >
            <span>
              <Scale size={14} />
            </span>
            Real tradeoffs on the ballot
          </button>
          <button
            className={journal && !tradeoffs ? "selected" : ""}
            onClick={() => {
              setJournal(true);
              setTradeoffs(false);
            }}
          >
            <span>
              <BookOpen size={14} />
            </span>
            Your reflection journal
          </button>
        </aside>
        <div>
          {tradeoffs ? (
            <TradeoffsPanel choices={choices} setChoices={setChoices} />
          ) : journal ? (
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
      <div className="notice">
        <Info size={18} />{" "}
        <span>
          New: <Link href="/debate/maps">Debate maps</Link> lay out the strongest arguments on real Colorado ballot questions, separating
          facts, predictions, definitions and values.
        </span>
      </div>
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
    [selected, setSelected] = useState(() => {
      const n = new URLSearchParams(routeSearch()).get("node");
      return n && atlasNodes.some((x) => x.id === n) ? n : "justice";
    }),
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
  const neighborIds = atlasEdges
    .filter(([a, b]) => a === selected || b === selected)
    .map(([a, b]) => (a === selected ? b : a));
  const graphNodes = atlasNodes.filter((n) => n.id === selected || neighborIds.includes(n.id));
  const positions: Record<string, { x: number; y: number }> = {
    [selected]: { x: 400, y: 255 },
  };
  neighborIds.forEach((id, i) => {
    const angle = (i / Math.max(neighborIds.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[id] = { x: 400 + Math.cos(angle) * 270, y: 255 + Math.sin(angle) * 175 };
  });
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
            "Tradition",
            "Institution",
            "Ethics",
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
              role="group"
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
                      graphNodes.some((n) => n.id === a) &&
                      graphNodes.some((n) => n.id === b),
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
                {graphNodes.map((n) => (
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
                      r={n.period !== "Thinker" && !["Classical","South Asian","Early modern","Modern","Contemporary"].includes(n.period) ? 27 : 21}
                      fill={
                        selected === n.id
                          ? "#245c50"
                          : n.period !== "Thinker" && !["Classical","South Asian","Early modern","Modern","Contemporary"].includes(n.period)
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
                      {n.period !== "Thinker" && !["Classical","South Asian","Early modern","Modern","Contemporary"].includes(n.period) ? "◇" : "✦"}
                    </text>
                    <text
                      textAnchor="middle"
                      y={n.period !== "Thinker" && !["Classical","South Asian","Early modern","Modern","Contemporary"].includes(n.period) ? 45 : 39}
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
            <span>Showing {node.name} and its {neighborIds.length} linked ideas. Use the list to browse all {atlasNodes.length}.</span>
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
          {ATLAS_BALLOT_LINKS[node.id] && (
            <>
              <h3>Where this shows up on Colorado's ballot</h3>
              <ul>
                {ATLAS_BALLOT_LINKS[node.id].map((m) => (
                  <li key={m}>
                    <Link href={`/vote/colorado/measure/${m}`}>{election.measures.find((x) => x.id === m)?.designation}: {election.measures.find((x) => x.id === m)?.shortTitle}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {node.context && (
            <>
              <h3>Historical context</h3>
              <p>{node.context}</p>
            </>
          )}
          {node.reading && (
            <>
              <h3>Further reading</h3>
              <ul>
                {node.reading.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
          {node.thinkers && (
            <>
              <h3>Key thinkers</h3>
              <p>{node.thinkers.join(" · ")}</p>
            </>
          )}
          {node.contested && (
            <>
              <h3>Where people disagree</h3>
              <p>{node.contested}</p>
            </>
          )}
          {node.example && (
            <>
              <h3>Example</h3>
              <p>{node.example}</p>
            </>
          )}
          <p className="muted">
            Editorial draft by Common Ground, not peer reviewed; the linked encyclopedia entry is the better authority.
          </p>
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
