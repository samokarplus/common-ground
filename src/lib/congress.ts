/**
 * Congress tracker data layer. Parses GovInfo BILLSTATUS XML (keyless bulk data)
 * into a small, validated record. Pure functions only; network lives in scripts/.
 */
import { z } from "zod";

type XNode = { tag: string; text: string; children: XNode[] };

/** Minimal XML reader sufficient for BILLSTATUS (no attributes needed, CDATA supported). */
export function parseXml(xml: string): XNode {
  const root: XNode = { tag: "#root", text: "", children: [] };
  const stack = [root];
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/([\w:.-]+)\s*>|<([\w:.-]+)[^>]*?(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) {
      if (stack.length > 1) stack.pop();
    } else if (m[3]) {
      const node: XNode = { tag: m[3], text: "", children: [] };
      top.children.push(node);
      if (!m[4]) stack.push(node);
    } else if (m[5] !== undefined) top.text += decode(m[5]);
  }
  return root;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

const kid = (n: XNode | undefined, tag: string) => n?.children.find((c) => c.tag === tag);
const txt = (n: XNode | undefined, tag: string) => kid(n, tag)?.text.trim() || undefined;
const items = (n: XNode | undefined, tag: string) => kid(n, tag)?.children ?? [];

/** Reduce CRS HTML summaries to plain text. Never render source HTML. */
export function stripHtml(html: string): string {
  return decode(html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")).replace(/\s+/g, " ").trim();
}

export const BILL_STATUSES = [
  "introduced",
  "in-committee",
  "passed-one-chamber",
  "passed-both-chambers",
  "to-president",
  "vetoed",
  "enacted",
] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const STATUS_LABEL: Record<BillStatus, string> = {
  introduced: "Introduced",
  "in-committee": "In committee",
  "passed-one-chamber": "Passed one chamber",
  "passed-both-chambers": "Passed both chambers",
  "to-president": "Sent to the President",
  vetoed: "Vetoed",
  enacted: "Became law",
};

export const BillSchema = z.object({
  id: z.string().regex(/^\d+-[a-z]+-\d+$/),
  congress: z.number().int().positive(),
  type: z.string(),
  number: z.number().int().positive(),
  title: z.string().min(1),
  originChamber: z.enum(["House", "Senate"]),
  introducedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updateDate: z.string(),
  status: z.enum(BILL_STATUSES),
  publicLaw: z.string().optional(),
  policyArea: z.string().optional(),
  sponsor: z.object({ name: z.string(), party: z.string().optional(), state: z.string().optional() }).optional(),
  cosponsorCount: z.number().int().nonnegative(),
  committees: z.array(z.string()),
  latestAction: z.object({ date: z.string(), text: z.string() }).optional(),
  actions: z.array(z.object({ date: z.string(), text: z.string(), type: z.string().optional() })),
  votes: z.array(z.object({ chamber: z.string(), date: z.string(), url: z.string().url() })),
  crsSummary: z.string().optional(),
  url: z.string().url(),
});
export type Bill = z.infer<typeof BillSchema>;

/** Conservative status mapping from the action log (newest evidence wins). */
export function mapStatus(actions: { text: string; type?: string }[], hasLaw: boolean): BillStatus {
  if (hasLaw || actions.some((a) => a.type === "BecameLaw")) return "enacted";
  const all = actions.map((a) => a.text);
  if (all.some((t) => /^vetoed by president/i.test(t) || /pocket veto/i.test(t))) return "vetoed";
  if (all.some((t) => /presented to president/i.test(t))) return "to-president";
  const passed = new Set<string>();
  for (const t of all) {
    if (/^passed (house|senate)|^on passage passed|^passed\/agreed to in (house|senate)/i.test(t)) {
      if (/house/i.test(t)) passed.add("House");
      if (/senate/i.test(t)) passed.add("Senate");
    }
  }
  if (passed.size >= 2) return "passed-both-chambers";
  if (passed.size === 1) return "passed-one-chamber";
  if (actions.some((a) => a.type === "Committee" || /referred to/i.test(a.text))) return "in-committee";
  return "introduced";
}

export function parseBillStatus(xml: string): Bill {
  const bill = kid(parseXml(xml).children.find((c) => c.tag === "billStatus"), "bill");
  if (!bill) throw new Error("Not a BILLSTATUS document: missing <bill>");
  const type = txt(bill, "type")!.toLowerCase();
  const number = Number(txt(bill, "number"));
  const congress = Number(txt(bill, "congress"));
  const actions = items(bill, "actions")
    .map((a) => ({ date: txt(a, "actionDate") ?? "", text: txt(a, "text") ?? "", type: txt(a, "type") }))
    .filter((a) => a.date && a.text)
    .sort((a, b) => b.date.localeCompare(a.date));
  const law = items(bill, "laws").map((l) => txt(l, "number")).find(Boolean);
  const sp = items(bill, "sponsors")[0];
  const la = kid(bill, "latestAction");
  const summary = items(bill, "summaries").map((s) => ({ d: txt(s, "updateDate") ?? "", t: txt(s, "text") ?? "" })).sort((a, b) => b.d.localeCompare(a.d))[0];
  const chamber = txt(bill, "originChamber");
  return BillSchema.parse({
    id: `${congress}-${type}-${number}`,
    congress,
    type,
    number,
    title: txt(bill, "title"),
    originChamber: chamber,
    introducedDate: txt(bill, "introducedDate"),
    updateDate: txt(bill, "updateDate"),
    status: mapStatus(actions, Boolean(law)),
    publicLaw: law,
    policyArea: txt(kid(bill, "policyArea"), "name"),
    sponsor: sp ? { name: txt(sp, "fullName"), party: txt(sp, "party"), state: txt(sp, "state") } : undefined,
    cosponsorCount: Number(txt(kid(bill, "cosponsors"), "count") ?? 0),
    committees: items(bill, "committees").map((c) => txt(c, "name")).filter(Boolean),
    latestAction: la ? { date: txt(la, "actionDate"), text: txt(la, "text") } : undefined,
    actions,
    votes: items(bill, "recordedVotes").map((v) => ({ chamber: txt(v, "chamber"), date: txt(v, "date"), url: txt(v, "url") })),
    crsSummary: summary?.t ? stripHtml(summary.t).slice(0, 1500) : undefined,
    url: txt(bill, "legislationUrl"),
  });
}

export type BillChange = { id: string; kind: "new" | "status" | "action"; from?: string; to: string };

/** Meaningful differences between two snapshots: new bills, status changes, new latest actions. */
export function diffBills(prev: Bill[], next: Bill[]): BillChange[] {
  const before = new Map(prev.map((b) => [b.id, b]));
  const out: BillChange[] = [];
  for (const b of next) {
    const p = before.get(b.id);
    if (!p) out.push({ id: b.id, kind: "new", to: b.status });
    else if (p.status !== b.status) out.push({ id: b.id, kind: "status", from: p.status, to: b.status });
    else if (p.latestAction?.text !== b.latestAction?.text || p.latestAction?.date !== b.latestAction?.date)
      out.push({ id: b.id, kind: "action", from: p.latestAction?.text, to: b.latestAction?.text ?? "" });
  }
  return out;
}
