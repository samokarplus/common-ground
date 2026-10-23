import { useMemo } from "react";
import { ArrowRight, ExternalLink, Vote } from "lucide-react";
import Link from "./link";
import { allActions } from "./government";
import { BRIEFINGS } from "./briefings-data";
import { ISSUES } from "@/lib/issues";
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
  const [spending, prices, abortion, ukraine] = [pick("federal-spending"), pick("consumer-prices"), pick("abortion-statistics"), pick("ukraine-assistance")];
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
          {ISSUES.map((i) => (
            <li key={i.id}><Link href={`/issues/${i.id}`}><strong>{i.title}</strong><span>{i.blurb}</span></Link></li>
          ))}
        </ul>
        <p>
          <Link className="button secondary" href={`/compare/${COMPARISONS[0].id}`}>
            Compare candidates: {COMPARISONS[0].people.map((p) => p.name).join(" and ")} <ArrowRight size={15} aria-hidden="true" />
          </Link>{" "}
          <Link className="button secondary" href="/government/president">What has the President been doing? <ArrowRight size={15} aria-hidden="true" /></Link>
        </p>
      </section>

      <section className="section-space" aria-labelledby="happening">
        <div className="section-intro">
          <div className="eyebrow">WHAT IS HAPPENING</div>
          <h2 id="happening">A few recent developments, straight from the official record.</h2>
          <p>Chosen by simple, stated rules, not by editors or an algorithm tuned for attention. Each links to the original document and, where we have one, a briefing that explains it.</p>
        </div>
        <ul className="dev-list">
          {dev.map((d) => (
            <li key={d.id} className="dev">
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
            </li>
          ))}
        </ul>
        <p>
          <Link className="button secondary" href="/government">
            See more of what the government is doing <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      </section>

      <section className="section-space" aria-labelledby="briefings">
        <div className="section-intro">
          <div className="eyebrow">BRIEFINGS</div>
          <h2 id="briefings">Big questions, answered with the evidence in view.</h2>
        </div>
        <div className="featured-briefings">
          {[prices, spending, abortion].map((b, i) => (
            <Link key={b.id} href={`/issues/${b.id}`} className={"briefing-card" + (i === 0 ? " lead" : "")}>
              <span className="eyebrow">{b.topic.toUpperCase()}</span>
              <h3>{b.question}</h3>
              <p>{b.shortAnswer[0].text}</p>
              <span className="muted">Data through: {b.dataThrough}</span>
              <span className="card-link">Read the briefing →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-space" aria-labelledby="numbers">
        <div className="section-intro">
          <div className="eyebrow">BY THE NUMBERS</div>
          <h2 id="numbers">Four numbers, with their limits attached.</h2>
        </div>
        <div className="stat-row big">
          {[spending, ukraine, abortion].flatMap((b) => b.evidence.flatMap((e) => (e.type === "stats" ? e.items.slice(0, b.id === "federal-spending" ? 2 : 1).map((s) => ({ ...s, brief: b.id })) : []))).map((s) => (
            <Link key={s.label} href={`/issues/${s.brief}`} className="stat">
              <span className="stat-label">{s.label}</span>
              <strong>{s.value}</strong>
              {s.note && <span className="stat-note">{s.note}</span>}
            </Link>
          ))}
        </div>
        <p>
          <Link className="button secondary" href="/data">
            Explore the data <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </p>
      </section>

      <section className="section-space" aria-labelledby="explore-more">
        <div className="section-intro">
          <div className="eyebrow">GO DEEPER</div>
          <h2 id="explore-more">When you want to think it through.</h2>
        </div>
        <div className="deeper">
          <Link href="/debate/maps" className="deeper-tile">
            <img src={IMG + "market-sm.jpg"} alt="" loading="lazy" />
            <h3>Compare the strongest arguments</h3>
            <p>Debate maps keep facts, predictions and values apart.</p>
          </Link>
          <Link href="/atlas" className="deeper-tile">
            <img src={IMG + "reading-room-sm.jpg"} alt="" loading="lazy" />
            <h3>Follow an idea</h3>
            <p>Eighty-six political and philosophical concepts, connected.</p>
          </Link>
          <Link href="/values" className="deeper-tile">
            <img src={IMG + "open-book-sm.jpg"} alt="" loading="lazy" />
            <h3>Reflect, privately</h3>
            <p>Your notes stay on your device. Nothing is scored.</p>
          </Link>
        </div>
      </section>

      <div className="section-space">
        <SourceFreshness />
      </div>
    </div>
  );
}
