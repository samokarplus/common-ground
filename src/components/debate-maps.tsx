import { useState } from "react";
import { ArrowRight, ChevronLeft, ExternalLink, Info } from "lucide-react";
import Link from "./link";
import { CLAIM_TYPES, CLAIM_TYPE_LABEL, DEBATES, debateById, type Debate } from "@/lib/debates";

function List() {
  return (
    <>
      <Link href="/debate" className="back-link">
        <ChevronLeft size={15} /> Debate Lab
      </Link>
      <div className="page-title">
        <div className="eyebrow">DEBATE LAB · DEBATE MAPS</div>
        <h1>See the strongest arguments side by side.</h1>
        <p>
          Each map separates facts you can check, predictions, definitions and value judgments, shows where both sides agree, and says
          what is still unknown. Facts come from the official Colorado Blue Book. Arguments are attributed to the people who make them.
        </p>
      </div>
      <div className="measure-grid">
        {DEBATES.map((d) => (
          <Link key={d.id} href={`/debate/maps/${d.id}`} className="measure-card">
            <div className="card-meta">
              <span className="tag">Colorado 2026 ballot</span>
            </div>
            <h3>{d.question}</h3>
            <span className="card-link">
              Open the map <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function Steelman({ d }: { d: Debate }) {
  const [text, setText] = useState<Record<number, string>>({});
  const [shown, setShown] = useState(false);
  return (
    <section className="panel">
      <h2>Steelman check</h2>
      <p>
        Before reading the arguments, write each side's best case in your own words. What you type stays on this page: it is not saved
        or sent anywhere.
      </p>
      {d.sides.map((s, i) => (
        <label key={s.label} className="field-label">
          {s.label}: the strongest version of their case
          <textarea value={text[i] ?? ""} onChange={(e) => setText({ ...text, [i]: e.target.value })} maxLength={2000} />
        </label>
      ))}
      <button className="button secondary" onClick={() => setShown(!shown)} aria-expanded={shown}>
        {shown ? "Hide the prompts" : "Now compare with the map"}
      </button>
      {shown && (
        <ul>
          <li>Did you include a value judgment, not only facts? Mark which of your points are checkable and which are not.</li>
          <li>Would someone on that side recognize your version as fair, or would they say you weakened it?</li>
          <li>Did you leave out an argument below? If so, why?</li>
        </ul>
      )}
    </section>
  );
}

function Map({ d }: { d: Debate }) {
  const [only, setOnly] = useState<string>("all");
  return (
    <>
      <Link href="/debate/maps" className="back-link">
        <ChevronLeft size={15} /> All debate maps
      </Link>
      <div className="page-title">
        <div className="eyebrow">DEBATE MAP · COLORADO 2026</div>
        <h1>{d.question}</h1>
        <p>{d.framing}</p>
      </div>
      <div className="notice">
        <Info size={18} /> Common Ground takes no side. Arguments are summarized from the official Blue Book's "Arguments For and Against"
        and are claims, not findings. This map is source-checked against the Blue Book by an AI-assisted process and has not been reviewed
        by a human editor.
      </div>
      <section className="panel">
        <h2>Facts both sides can start from</h2>
        <ul>
          {d.facts.map((f) => (
            <li key={f.text}>
              {f.text}{" "}
              <a href={f.sourceUrl} target="_blank" rel="noreferrer">
                {f.sourceLabel} <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      </section>
      <Steelman d={d} />
      <div className="filter-row" role="group" aria-label="Show claim types">
        <button className={only === "all" ? "selected" : ""} aria-pressed={only === "all"} onClick={() => setOnly("all")}>
          All claims
        </button>
        {CLAIM_TYPES.map((t) => (
          <button key={t} className={only === t ? "selected" : ""} aria-pressed={only === t} onClick={() => setOnly(t)}>
            {CLAIM_TYPE_LABEL[t].split(" (")[0]}
          </button>
        ))}
      </div>
      <div className="yes-no">
        {d.sides.map((s) => (
          <div key={s.label}>
            <h2>{s.label}</h2>
            <ul>
              {s.arguments
                .filter((a) => only === "all" || a.type === only)
                .map((a) => (
                  <li key={a.text}>
                    <span className="tag">{CLAIM_TYPE_LABEL[a.type].split(" (")[0]}</span> {a.text}
                    <p className="muted">What would inform this: {a.evidenceNote}</p>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2>Where both sides agree</h2>
        <ul>{d.agreements.map((a) => <li key={a}>{a}</li>)}</ul>
        <h2>What is still uncertain</h2>
        <ul>{d.uncertainties.map((a) => <li key={a}>{a}</li>)}</ul>
        <h2>Common misconceptions</h2>
        {d.misconceptions.map((m) => (
          <details key={m.myth}>
            <summary>{m.myth}</summary>
            <p>{m.correction}</p>
          </details>
        ))}
        <h2>Questions to ask yourself</h2>
        <ul>{d.reflection.map((a) => <li key={a}>{a}</li>)}</ul>
        <p>
          <Link className="button secondary" href={`/vote/colorado/measure/${d.relatedMeasureId}`}>
            Read the full measure explanation <ArrowRight size={14} />
          </Link>
        </p>
      </section>
    </>
  );
}

export default function DebateMaps({ id }: { id?: string }) {
  const d = id ? debateById(id) : undefined;
  if (id && !d) return <p className="empty">That debate map does not exist.</p>;
  return d ? <Map d={d} /> : <List />;
}
