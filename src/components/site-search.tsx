import { useMemo } from "react";
import { Search } from "lucide-react";
import Link from "./link";
import { election } from "./help-me-vote";
import { atlasNodes } from "@/lib/atlas";
import { DEBATES } from "@/lib/debates";
import { PATHWAYS } from "@/lib/pathways";
import { searchSite, orderGroups } from "@/lib/site-search";
import { routeSearch } from "./link";

import { ISSUES } from "@/lib/issues";
import { COMPARISONS } from "./compare-data";
const PAGES = [
  ...ISSUES.map((i) => ({ href: `/issues/${i.id}`, title: i.title, about: `${i.question} ${i.blurb}` })),
  ...COMPARISONS.map((c) => ({ href: `/compare/${c.id}`, title: `Compare ${c.people.map((p) => p.name).join(" and ")}`, about: `${c.title} candidate comparison, ${c.office}` })),
  { href: "/government/president", title: "Presidential actions, dated", about: "What the President has been doing: executive orders, proclamations, memoranda" },
  { href: "/vote", title: "Help Me Vote", about: "Understand your ballot, Colorado 2026" },
  { href: "/congress", title: "Congress tracker", about: "Follow federal bills and votes" },
  { href: "/legislation", title: "Federal Register", about: "Official federal rules and notices" },
  { href: "/policy", title: "Policy Explorer", about: "Explore policy questions" },
  { href: "/values", title: "My Values", about: "Explore your own values privately" },
  { href: "/debate", title: "Debate Lab", about: "Examine arguments fairly" },
  { href: "/atlas", title: "Thought Atlas", about: "Political and philosophical ideas" },
  { href: "/chain", title: "Promises, votes and outcomes", about: "Follow a decision from promise to outcome" },
  { href: "/paths", title: "Pathways", about: "Guided routes through the site" },
  { href: "/methodology", title: "Methodology", about: "How Common Ground works" },
  { href: "/privacy", title: "Privacy", about: "What stays on your device" },
  { href: "/corrections", title: "Report a correction", about: "Report an error" },
];

export default function SiteSearch() {
  const q = new URLSearchParams(routeSearch()).get("q") ?? "";
  const hits = useMemo(
    () =>
      searchSite(
        {
          measures: election.measures.map((m) => ({ id: m.id, designation: m.designation, shortTitle: m.shortTitle, topic: m.topic, summary: m.draft.summary })),
          contests: election.contests,
          atlas: atlasNodes,
          debates: DEBATES,
          pathways: PATHWAYS,
          pages: PAGES,
        },
        q,
      ),
    [q],
  );
  const groups = orderGroups([...new Set(hits.map((h) => h.group))]);
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">SEARCH</div>
        <h1>{q ? `Results for “${q}”` : "Search Common Ground"}</h1>
        <p>Searches ballot measures, offices and candidates, ideas, debate maps and pages on this site. It does not send your search anywhere.</p>
      </div>
      {!q && <p className="empty">Type a word in the search box above, such as “tax”, “mail ballot” or “federalism”.</p>}
      {q && hits.length === 0 && (
        <div className="empty" role="status">
          <Search />
          <h3>Nothing on this site matches “{q}”.</h3>
          <p>
            Try a simpler or shorter word. You can also <Link href={`/legislation?q=${encodeURIComponent(q)}`}>search the Federal Register</Link>{" "}
            for official federal documents.
          </p>
        </div>
      )}
      {groups.map((g) => (
        <section key={g} className="panel" aria-labelledby={`g-${g}`}>
          <h2 id={`g-${g}`}>{g}</h2>
          <ul className="source-list">
            {hits.filter((h) => h.group === g).map((h) => (
              <li key={h.href + h.title}>
                <Link href={h.href}>{h.title}</Link>
                <span>{h.snippet}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {q && hits.length > 0 && (
        <p>
          Looking for official federal documents? <Link href={`/legislation?q=${encodeURIComponent(q)}`}>Search the Federal Register</Link>.
        </p>
      )}
    </>
  );
}
