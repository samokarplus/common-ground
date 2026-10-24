/** Search across Common Ground's own content (not the Federal Register). Pure and dependency-free. */
export type Hit = { group: string; title: string; href: string; snippet: string };
export type SearchIndex = {
  measures: { id: string; designation: string; shortTitle: string; topic: string; summary?: string }[];
  contests: { id: string; office: string; candidates: { name: string }[] }[];
  atlas: { id: string; name: string; description: string }[];
  debates: { id: string; question: string }[];
  pathways: { id: string; title: string; intro: string }[];
  pages: { href: string; title: string; about: string }[];
};

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Every term must appear somewhere in the text; a hit in the title ranks higher. */
function score(title: string, body: string, terms: string[]) {
  const t = norm(title);
  const all = `${t} ${norm(body)}`;
  if (!terms.every((x) => all.includes(x))) return 0;
  return 1 + terms.filter((x) => t.includes(x)).length;
}

export function searchSite(index: SearchIndex, query: string, limitPerGroup = 8): Hit[] {
  const terms = norm(query).split(/\s+/).filter((x) => x.length > 1);
  if (terms.length === 0) return [];
  const out: { s: number; hit: Hit }[] = [];
  const push = (s: number, hit: Hit) => s > 0 && out.push({ s, hit });
  for (const m of index.measures)
    push(score(`${m.designation} ${m.shortTitle}`, `${m.topic} ${m.summary ?? ""}`, terms), {
      group: "Ballot measures",
      title: `${m.designation}: ${m.shortTitle}`,
      href: `/vote/colorado/measure/${m.id}`,
      snippet: m.topic,
    });
  for (const c of index.contests) {
    push(score(c.office, c.candidates.map((x) => x.name).join(" "), terms), {
      group: "Offices and judges",
      title: c.office,
      href: `/vote/colorado/contest/${c.id}`,
      snippet: `${c.candidates.length} on the ballot`,
    });
  }
  for (const a of index.atlas) push(score(a.name, a.description, terms), { group: "Ideas (Thought Atlas)", title: a.name, href: `/atlas?node=${a.id}`, snippet: a.description });
  for (const d of index.debates) push(score(d.question, "", terms), { group: "Debate maps", title: d.question, href: `/debate/maps/${d.id}`, snippet: "Arguments side by side" });
  for (const p of index.pathways) push(score(p.title, p.intro, terms), { group: "Pathways", title: p.title, href: "/paths", snippet: p.intro });
  for (const p of index.pages) push(score(p.title, p.about, terms), { group: /^\/issues\/[a-z-]+$/.test(p.href) ? "Issues" : p.href.startsWith("/compare/") ? "Candidate comparisons" : "Pages", title: p.title, href: p.href, snippet: p.about });
  const counts = new Map<string, number>();
  return out
    .sort((a, b) => b.s - a.s)
    .filter(({ hit }) => {
      const n = (counts.get(hit.group) ?? 0) + 1;
      counts.set(hit.group, n);
      return n <= limitPerGroup;
    })
    .map((x) => x.hit);
}

/** Groups shown first, in this order; everything else follows in the order its best hit ranks. */
export const GROUP_ORDER = ["Issues", "Candidate comparisons", "Pages"];
export const orderGroups = (groups: string[]) => [...groups].sort((a, b) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99));
