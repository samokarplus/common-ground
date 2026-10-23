import type { Action } from "./domain";

export type FeedFilters = {
  query: string;
  status: string;
  /** Only documents whose official comment deadline has not passed. */
  openForComment: boolean;
  /** Only documents published within this many days (0 = any time). */
  sinceDays: number;
  /** Exact agency name from agencyOptions(), or "" for any. */
  agency?: string;
};

/** Agencies named in the loaded records, most frequent first, then alphabetical. */
export function agencyOptions(actions: Pick<Action, "agencies">[]): string[] {
  const n = new Map<string, number>();
  for (const a of actions) for (const x of a.agencies) if (x.name) n.set(x.name, (n.get(x.name) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
}

const day = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");

type Filterable = Pick<Action, "title" | "document_number" | "agencies" | "status" | "publication_date" | "comments_close_on">;

export function applyFeedFilters<T extends Filterable>(
  actions: T[],
  f: FeedFilters,
  now: Date,
) {
  const today = day(now.toISOString());
  const q = f.query.toLowerCase();
  return actions.filter((a) => {
    if (f.status !== "All actions" && a.status !== f.status) return false;
    if (q && !`${a.title} ${a.document_number} ${a.agencies.map((x) => x.name).join(" ")}`.toLowerCase().includes(q)) return false;
    if (f.agency && !a.agencies.some((x) => x.name === f.agency)) return false;
    if (f.openForComment && !(a.comments_close_on && day(a.comments_close_on) >= today)) return false;
    if (f.sinceDays > 0 && !(a.publication_date && today - day(a.publication_date) <= f.sinceDays * 86400000)) return false;
    return true;
  });
}
