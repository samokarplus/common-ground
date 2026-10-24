import { useMemo } from "react";
import { ArrowRight, ExternalLink, Landmark, Vote } from "lucide-react";
import { ISSUE_ICON } from "./issue-icons";
import Link from "./link";
import { allActions } from "./government";
import { BRIEFINGS } from "./briefings-data";
import { BRIEFING_FOR_ISSUE, ISSUES } from "@/lib/issues";
import { COMPARISONS } from "./compare-data";
import { SourceFreshness } from "./hubs";
import election from "../../data/elections/colorado-2026.json";
import treasury from "../../data/fiscal/treasury.json";
import { selectDevelopments } from "@/lib/developments";
import { electionPhase, parseElection } from "@/lib/election";
import type { TreasuryData } from "@/lib/briefings";

const IMG = import.meta.env.BASE_URL + "images/";
const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function HomeBody() {
  const today = new Date().toISOString().slice(0, 10);
  const dev = useMemo(() => selectDevelopments(allActions(today), treasury as unknown as TreasuryData, today), [today]);
  const phase = electionPhase(parseElection(election), new Date());
  const pick = (id: string) => BRIEFINGS.find((b) => b.id === id)!;
  const [spending, prices, abortion] = [pick("federal-spending"), pick("consumer-prices"), pick("abortion-statistics")];
  return (
    <div className="home-wrap">
      {phase.phase !== "after" && (
        <Link href="/vote" className="vote-banner">
          <Vote size={20} aria-hidden="true" />
          <span>
            <strong>Colorado votes November 3{phase.phase === "before" ? ` · ${phase.days} ${phase.days === 1 ? "day" : "days"} to go` : ""}.</strong> Understand every statewide measure and race, with sources and no recommendations.
          </span>
          <span className="go">Help Me Vote <ArrowRight size={15} aria-hidden="true" /></span>
        </Link>
      )}

      <section className="section-space" aria-labelledby="start-issue">
        <div className="section-intro">
          <div className="eyebrow">START WITH WHAT YOU CARE ABOUT</div>
          <h2 id="start-issue">Pick an issue. See the evidence, the arguments and what government is doing.</h2>
        </div>
        <ul className="issue-pills">
          {ISSUES.map((i) => {
            const Icon = ISSUE_ICON[i.id] ?? Landmark;
            const has = (BRIEFING_FOR_ISSUE[i.id] ?? []).length > 0;
            return (
              <li key={i.id}>
                <Link href={`/issues/${i.id}`}>
                  <span className="pill-icon" aria-hidden="true"><Icon size={22} /></span>
                  <span className="pill-text">
                    <strong>{i.title}</strong>
                    <span>{i.blurb}</span>
                    <span className={"status-chip " + (has ? "ok" : "unknown")}>{has ? "Evidence briefing" : "Briefing in progress"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section-space" aria-labelledby="happening">
        <div className="section-intro">
          <div className="eyebrow">WHAT IS HAPPENING</div>
          <h2 id="happening">Recent developments, straight from the official record.</h2>
        </div>
        <div className="dev-grid">
          {dev.map((d, i) => (
            <article key={d.id} className={"dev" + (i === 0 ? " dev-lead" : "")}>
              <div className="card-meta">
                <span className="tag">{d.kind}</span>
                <span>{fmt(d.date)}</span>
              </div>
              <h3>{d.headline}</h3>
              <p>{d.fact}</p>
              <p className="dev-links">
                <Link href={d.understand.href}>{d.understand.label} <ArrowRight size={14} aria-hidden="true" /></Link>
                <a href={d.original.url} target="_blank" rel="noreferrer">
                  {d.original.label} <ExternalLink size={12} aria-hidden="true" />
                </a>
              </p>
              <p className="muted dev-rule">Why this one: {d.rule}</p>
            </article>
          ))}
        </div>
        <p className="cta-row">
          <Link className="button secondary" href="/government">All government actions <ArrowRight size={15} aria-hidden="true" /></Link>
          <Link className="button secondary" href="/government/president">What has the President been doing? <ArrowRight size={15} aria-hidden="true" /></Link>
        </p>
      </section>

      <section className="section-space" aria-labelledby="numbers">
        <div className="section-intro">
          <div className="eyebrow">THE NUMBERS, IN PLAIN ENGLISH</div>
          <h2 id="numbers">Big questions, with the evidence in view.</h2>
        </div>
        <div className="number-grid">
          {[prices, spending, abortion].map((b) => {
            const st = b.evidence.flatMap((e) => (e.type === "stats" ? e.items : []))[0];
            return (
              <Link key={b.id} href={`/issues/${b.id}`} className="briefing-card number-card">
                <span className="eyebrow">{b.topic.toUpperCase()}</span>
                <h3>{b.question}</h3>
                <span className="stat-value">{st.value}</span>
                <span className="stat-label">{st.label}</span>
                <p className="stat-plain">{st.plain}</p>
                <span className="muted">Data through {b.dataThrough.split(" (")[0]}</span>
                <span className="card-link">Read the briefing <ArrowRight size={14} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="feature-band" aria-labelledby="compare-band" style={{ "--band-img": `url(${IMG}us-capitol-sm.jpg)` } as React.CSSProperties}>
        <div className="feature-band-inner">
          <div className="eyebrow">CANDIDATES</div>
          <h2 id="compare-band">Compare candidates, side by side.</h2>
          <p>What each person has said, what their record shows, and what is not documented, with a source behind every line. No scores, rankings or recommendations.</p>
          <p className="cta-row">
            <Link className="button" href={`/compare/${COMPARISONS[0].id}`}>
              {COMPARISONS[0].people.map((p) => p.name).join(" and ")} <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link className="button secondary on-dark" href="/compare">All comparisons</Link>
          </p>
        </div>
      </section>

      <section className="section-space" aria-labelledby="explore-more">
        <div className="section-intro">
          <div className="eyebrow">THINK IT THROUGH</div>
          <h2 id="explore-more">Tools for reasoning, not for telling you what to think.</h2>
        </div>
        <div className="deeper">
          <Link href="/debate/maps" className="deeper-tile">
            <img src={IMG + "market-sm.jpg"} alt="" width="640" height="420" loading="lazy" />
            <h3>Compare the strongest arguments</h3>
            <p>Debate maps keep facts, predictions and values apart.</p>
          </Link>
          <Link href="/atlas" className="deeper-tile">
            <img src={IMG + "reading-room-sm.jpg"} alt="" width="640" height="420" loading="lazy" />
            <h3>Follow an idea</h3>
            <p>Eighty-six political and philosophical concepts, connected.</p>
          </Link>
          <Link href="/values" className="deeper-tile">
            <img src={IMG + "writing-sm.jpg"} alt="" width="640" height="420" loading="lazy" />
            <h3>Reflect, privately</h3>
            <p>Your notes stay on your device. Nothing is scored.</p>
          </Link>
        </div>
      </section>

      <details className="disclosure" id="freshness">
        <summary>Where the numbers come from, and how fresh they are</summary>
        <SourceFreshness />
      </details>
    </div>
  );
}
