import { ArrowRight } from "lucide-react";
import Link from "./link";
import { PATHWAYS } from "@/lib/pathways";

export default function Pathways() {
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">PATHWAYS</div>
        <h1>Connect laws, elections, policy and ideas.</h1>
        <p>
          Each pathway takes one real question and walks through the parts of Common Ground that explain it, from the official record to
          the arguments to the philosophy underneath. Follow the steps in order or jump in anywhere.
        </p>
      </div>
      {PATHWAYS.map((p) => (
        <section key={p.id} className="panel" aria-labelledby={p.id}>
          <h2 id={p.id}>{p.title}</h2>
          <p>{p.intro}</p>
          <ol className="process-steps">
            {p.steps.map((s) => (
              <li key={s.href}>
                <h3>
                  <Link href={s.href}>
                    {s.label} <ArrowRight size={14} />
                  </Link>
                </h3>
                <p>{s.why}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
