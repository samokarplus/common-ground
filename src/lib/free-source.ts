import snapshot from "../../data/federal-register.json";
import { normalize, type Action } from "./domain";
export type Feed = {
  actions: Action[];
  mode: "live" | "cache" | "snapshot";
  retrievedAt: string;
  persisted: false;
  error?: string;
  nextPage?: number;
};
const cache = new Map<number, Feed>();
let pending: Promise<Feed> | undefined;
export const SOURCE_ORIGIN = "https://www.federalregister.gov";
async function officialJSON(path: string) {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(SOURCE_ORIGIN + path, {
        signal: AbortSignal.timeout(8000),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new Error("Official source unavailable");
      return await response.json();
    } catch (e) {
      last = e;
      if (attempt < 2)
        await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  throw last;
}
export function snapshotFeed(
  message = "Showing a dated official-source snapshot.",
): Feed {
  return {
    actions: snapshot.results.map((r) => normalize(r, snapshot.retrievedAt)),
    mode: "snapshot",
    retrievedAt: snapshot.retrievedAt,
    persisted: false,
    error: message,
  };
}
export async function getFeed(page = 1, refresh = false): Promise<Feed> {
  if (!Number.isInteger(page) || page < 1 || page > 50)
    throw new Error("Invalid page");
  const saved = cache.get(page);
  if (!refresh && saved && Date.now() - Date.parse(saved.retrievedAt) < 900000)
    return { ...saved, mode: "cache" };
  if (page === 1 && pending) return pending;
  const work = load(page);
  if (page === 1) pending = work;
  try {
    return await work;
  } finally {
    if (page === 1) pending = undefined;
  }
}
async function load(page: number): Promise<Feed> {
  try {
    const raw = (await officialJSON(
      `/api/v1/documents.json?per_page=40&order=newest&page=${page}`,
    )) as { results: unknown[]; total_pages: number };
    const retrievedAt = new Date().toISOString();
    const actions = raw.results.flatMap((r) => {
      try {
        return [normalize(r, retrievedAt)];
      } catch {
        return [];
      }
    });
    if (!actions.length) throw new Error("No valid documents");
    const feed: Feed = {
      actions,
      mode: "live",
      retrievedAt,
      persisted: false,
      nextPage: page < Math.min(raw.total_pages, 50) ? page + 1 : undefined,
    };
    cache.set(page, feed);
    return feed;
  } catch {
    const saved = cache.get(page);
    if (saved)
      return {
        ...saved,
        mode: "cache",
        error:
          "Official API unavailable. Showing records retrieved earlier this session.",
      };
    if (page > 1)
      throw new Error(
        "Unable to load the next page. Your current records are still available.",
      );
    return snapshotFeed(
      "Official API unavailable. Showing a dated real-source snapshot, not live news.",
    );
  }
}
export async function getDocument(
  id: string,
): Promise<{ action: Action | null }> {
  if (!/^\d{4}-\d{4,6}$/.test(id)) throw new Error("Invalid document ID");
  try {
    const raw = await officialJSON(`/api/v1/documents/${id}.json`);
    return { action: normalize(raw, new Date().toISOString()) };
  } catch {
    for (const feed of cache.values()) {
      const action = feed.actions.find((a) => a.document_number === id);
      if (action) return { action };
    }
    return {
      action:
        snapshotFeed().actions.find((a) => a.document_number === id) || null,
    };
  }
}
