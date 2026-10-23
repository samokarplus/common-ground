import { useMemo, useState } from "react";
import { Download, ExternalLink, Info } from "lucide-react";
import Link from "./link";
import { election } from "./help-me-vote";
import rawProfiles from "../../data/elections/colorado-2026-profiles.json";
import rawLog from "../../data/review/decisions.json";
import { validateProfiles } from "@/lib/candidate";
import { DEBATES } from "@/lib/debates";
import { atlasNodes } from "@/lib/atlas";
import { buildQueue, type Decision, type ItemKind, type ItemState } from "@/lib/review";

const STATE_LABEL: Record<ItemState, string> = {
  "draft-hidden": "Draft, hidden",
  "machine-checked": "Machine-checked, not human-reviewed",
  "human-reviewed": "Human-reviewed",
  "changes-requested": "Changes requested",
  rejected: "Rejected, hidden or flagged",
};
const KIND_LABEL: Record<ItemKind, string> = {
  measure: "Ballot measure explanations",
  profile: "Candidate profiles",
  debate: "Debate maps",
  atlas: "Thought Atlas",
  values: "Values Explorer",
  guide: "Guides",
  record: "Promises, votes and outcomes",
  pathways: "Pathways",
  explainer: "Explainers",
};
type Choice = "" | Decision["decision"];

export default function Review() {
  const items = useMemo(
    () =>
      buildQueue({
        election,
        profiles: validateProfiles(rawProfiles, election.contests),
        debates: DEBATES,
        atlasCount: atlasNodes.length,
        log: rawLog as Decision[],
        builtOn: election.dataVerifiedAt.slice(0, 10),
      }),
    [],
  );
  const [reviewer, setReviewer] = useState("");
  const [choice, setChoice] = useState<Record<string, Choice>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<string>("all");
  const kinds = [...new Set(items.map((i) => i.kind))];
  const shown = items.filter((i) => kind === "all" || i.kind === kind);
  const pending = items.filter((i) => i.state !== "human-reviewed");
  const decided = items.filter((i) => choice[i.id]);
  const problems = decided.filter((i) => choice[i.id] !== "approve" && !(note[i.id] ?? "").trim());
  const ready = reviewer.trim().length >= 2 && decided.length > 0 && problems.length === 0;

  function download() {
    const today = new Date().toISOString().slice(0, 10);
    const file: Decision[] = decided.map((i) => ({
      itemId: i.id,
      decision: choice[i.id] as Decision["decision"],
      reviewer: reviewer.trim(),
      on: today,
      ...((note[i.id] ?? "").trim() ? { note: note[i.id].trim() } : {}),
    }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-decisions-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-title">
        <div className="eyebrow">EDITORIAL REVIEW</div>
        <h1>Everything that still needs a human reviewer.</h1>
        <p>
          {pending.length} of {items.length} items are not yet human-reviewed. Each row shows its sources, when it was last checked, and the open
          questions a reviewer should resolve.
        </p>
      </div>
      <div className="notice">
        <Info size={18} />
        <span>
          <strong>Editor tools.</strong> Anyone can read this page. Choices you make here stay in your browser and change nothing on the site.
          Download a decisions file and the maintainer applies it with <code>npm run review:apply</code>; that is the only way content becomes
          “human-reviewed”, and the site never marks anything reviewed on its own. See <Link href="/methodology">methodology</Link>.
        </span>
      </div>
      <section className="panel">
        <label className="field-label" htmlFor="reviewer">
          Your name (recorded with every decision you download)
        </label>
        <input id="reviewer" value={reviewer} onChange={(e) => setReviewer(e.target.value)} autoComplete="off" />
        <div className="filter-row" role="group" aria-label="Filter by kind">
          <button className={kind === "all" ? "selected" : ""} aria-pressed={kind === "all"} onClick={() => setKind("all")}>
            All ({items.length})
          </button>
          {kinds.map((k) => (
            <button key={k} className={kind === k ? "selected" : ""} aria-pressed={kind === k} onClick={() => setKind(k)}>
              {KIND_LABEL[k]} ({items.filter((i) => i.kind === k).length})
            </button>
          ))}
        </div>
        <p aria-live="polite">
          {decided.length} decision{decided.length === 1 ? "" : "s"} recorded in this browser.
          {problems.length > 0 && ` ${problems.length} need a note (required for requested changes and rejections).`}
        </p>
        <button className="button primary" disabled={!ready} onClick={download}>
          <Download size={14} /> Download decisions file
        </button>
        {!ready && decided.length > 0 && reviewer.trim().length < 2 && <p className="muted">Enter your name to enable the download.</p>}
      </section>
      {shown.map((i) => (
        <section key={i.id} className="panel" aria-labelledby={`r-${i.id}`}>
          <div className="card-meta">
            <span className="tag">{KIND_LABEL[i.kind]}</span>
            <span className="tag">{STATE_LABEL[i.state]}</span>
            {i.verifiedOn && <span className="muted">Last checked {i.verifiedOn}</span>}
          </div>
          <h2 id={`r-${i.id}`}>
            <Link href={i.href}>{i.title}</Link>
          </h2>
          <h3>Sources</h3>
          {i.sources.length ? (
            <ul className="source-list">
              {i.sources.slice(0, 6).map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label} <ExternalLink size={12} />
                  </a>
                </li>
              ))}
              {i.sources.length > 6 && <li className="muted">and {i.sources.length - 6} more</li>}
            </ul>
          ) : (
            <p className="muted">No external sources: this item is Common Ground's own explanation.</p>
          )}
          <h3>Outstanding questions</h3>
          <ul>{i.outstanding.map((o) => <li key={o}>{o}</li>)}</ul>
          <fieldset className="filter-row">
            <legend className="sr-only">Decision for {i.title}</legend>
            {(
              [
                ["approve", "Approve"],
                ["request-changes", "Request corrections"],
                ["reject", "Reject"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={choice[i.id] === v ? "selected" : ""}
                aria-pressed={choice[i.id] === v}
                onClick={() => setChoice({ ...choice, [i.id]: choice[i.id] === v ? "" : v })}
              >
                {label}
              </button>
            ))}
          </fieldset>
          {choice[i.id] && choice[i.id] !== "approve" && (
            <label className="field-label">
              What needs to change? (required)
              <textarea value={note[i.id] ?? ""} onChange={(e) => setNote({ ...note, [i.id]: e.target.value })} maxLength={1000} />
            </label>
          )}
        </section>
      ))}
    </>
  );
}
