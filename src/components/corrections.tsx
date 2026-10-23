import { CorrectionSchema, CORRECTION_LABEL, CORRECTION_TYPES, reportUrl } from "@/lib/corrections";
import raw from "../../data/corrections.json";
import { z } from "zod";
import { ExternalLink } from "lucide-react";

const log = z.array(CorrectionSchema).parse(raw);

export default function Corrections() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">CORRECTIONS</div>
        <h1>Found a mistake? Tell us.</h1>
        <p>
          Every civic claim here should be traceable to a source. When one is wrong, outdated, unsourced, or misleading, we fix it and
          record the change below instead of editing it silently.
        </p>
      </div>
      <article className="panel longform">
        <h2>Report a problem</h2>
        <p>
          Each link opens a public GitHub issue pre-filled with the page you came from and the type of problem. Nothing from your
          research guide or notes is included. A GitHub account is required to post, and issues are public.
        </p>
        <ul>
          {CORRECTION_TYPES.map((t) => (
            <li key={t}>
              <a href={reportUrl(window.location.hash.slice(1), t)} target="_blank" rel="noreferrer">
                {CORRECTION_LABEL[t]} <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
        <h2>Corrections history</h2>
        {log.length === 0 ? (
          <p>No corrections have been recorded yet. This list will show what changed, when, and why.</p>
        ) : (
          <ul>
            {log.map((c, i) => (
              <li key={i}>
                <strong>{c.date}</strong> · {c.page} · {CORRECTION_LABEL[c.type]}: was “{c.was}”, now “{c.now}”.{" "}
                {c.sourceUrl && (
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                    Source
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
