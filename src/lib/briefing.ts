/**
 * Briefings: a question, a short answer, evidence, context, recent changes, what happens next, what people
 * disagree about, original sources and limitations. Every factual claim is typed and tied to a source, and
 * every chart carries its source, unit, date range and definition. Nothing here is ever marked human-reviewed
 * except through the editorial review workflow.
 */
import { z } from "zod";

export const CLAIM_KINDS = ["fact", "estimate", "interpretation", "prediction", "opinion", "unknown"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];
export const CLAIM_KIND_LABEL: Record<ClaimKind, string> = {
  fact: "Verified fact",
  estimate: "Statistical estimate",
  interpretation: "Interpretation",
  prediction: "Prediction",
  opinion: "Opinion or value judgment",
  unknown: "Unknown",
};

const Https = z.string().url().startsWith("https://");
const Day = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/);

export const SourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  publisher: z.string().min(1),
  url: Https,
  retrievedOn: Day,
  /** "official" = a government record or agency publication; "research" = an official research arm such as CRS or CBO. */
  kind: z.enum(["official", "research"]),
});

const Claim = z.object({
  text: z.string().min(1),
  kind: z.enum(CLAIM_KINDS),
  sourceIds: z.array(z.string()).default([]),
});
export type Claim = z.infer<typeof Claim>;

export const VALUE_FORMATS = ["usd-trillions", "usd-billions", "count", "rate1", "percent1"] as const;
export type ValueFormat = (typeof VALUE_FORMATS)[number];

export const ChartSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  kind: z.enum(["line", "bar"]),
  format: z.enum(VALUE_FORMATS),
  xLabel: z.string().min(1),
  yLabel: z.string().min(1),
  /** Bars always start at zero. Lines start at zero unless "auto" is chosen, which the chart labels visibly. */
  baseline: z.enum(["zero", "auto"]).default("zero"),
  series: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        estimate: z.boolean().default(false),
        /** null means "not reported", never zero. */
        points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number().nullable() })).min(2),
      }),
    )
    .min(1),
  dateRange: z.string().min(1),
  definition: z.string().min(10),
  sourceIds: z.array(z.string()).min(1),
  note: z.string().optional(),
});
export type Chart = z.infer<typeof ChartSchema>;

const Block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stats"), items: z.array(z.object({ label: z.string(), value: z.string(), note: z.string().optional(), plain: z.string().optional(), kind: z.enum(CLAIM_KINDS), sourceIds: z.array(z.string()).min(1) })).min(1) }),
  z.object({ type: z.literal("chart"), chart: ChartSchema }),
  z.object({ type: z.literal("text"), heading: z.string().optional(), claims: z.array(Claim).min(1) }),
]);

export const BriefingSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    topic: z.string().min(1),
    /** Where it lives: shown in the Issues index or the Data hub as well. */
    sections: z.array(z.enum(["issues", "data", "government"])).min(1),
    question: z.string().min(1),
    shortAnswer: z.array(Claim).min(1),
    dataThrough: z.string().min(1),
    sourceCheckedOn: Day,
    evidence: z.array(Block).min(1),
    context: z.array(Claim).default([]),
    recent: z.array(z.object({ date: Day, text: z.string(), href: z.string().optional(), sourceIds: z.array(z.string()).default([]) })).default([]),
    next: z.array(z.object({ text: z.string(), kind: z.enum(["scheduled", "unknown"]), sourceIds: z.array(z.string()).default([]) })).default([]),
    disagreements: z.object({ factual: z.array(Claim).default([]), values: z.array(Claim).default([]) }),
    sources: z.array(SourceSchema).min(1),
    limitations: z.array(z.string()).min(1),
    related: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    /** "machine-checked" until the editorial workflow records a named human reviewer. */
    review: z.object({ status: z.enum(["machine-checked", "human-reviewed"]), note: z.string().optional(), reviewer: z.string().optional(), reviewedOn: Day.optional() }),
  })
  .superRefine((b, ctx) => {
    const ids = new Set(b.sources.map((s) => s.id));
    const check = (claims: Claim[], where: string) => {
      for (const c of claims) {
        for (const s of c.sourceIds) if (!ids.has(s)) ctx.addIssue({ code: "custom", message: `${where}: unknown source ${s}` });
        if ((c.kind === "fact" || c.kind === "estimate") && c.sourceIds.length === 0) ctx.addIssue({ code: "custom", message: `${where}: a ${c.kind} needs a source: "${c.text.slice(0, 50)}"` });
      }
    };
    check(b.shortAnswer, "shortAnswer");
    check(b.context, "context");
    check(b.disagreements.factual, "disagreements.factual");
    check(b.disagreements.values, "disagreements.values");
    for (const blk of b.evidence) {
      if (blk.type === "text") check(blk.claims, "evidence");
      if (blk.type === "stats") for (const i of blk.items) for (const s of i.sourceIds) if (!ids.has(s)) ctx.addIssue({ code: "custom", message: `stat ${i.label}: unknown source ${s}` });
      if (blk.type === "chart") {
        for (const s of blk.chart.sourceIds) if (!ids.has(s)) ctx.addIssue({ code: "custom", message: `chart ${blk.chart.id}: unknown source ${s}` });
        if (blk.chart.kind === "bar" && blk.chart.baseline !== "zero") ctx.addIssue({ code: "custom", message: `chart ${blk.chart.id}: bar charts must start at zero` });
      }
    }
    if (b.review.status === "human-reviewed" && !(b.review.reviewer && b.review.reviewedOn)) ctx.addIssue({ code: "custom", message: "a human-reviewed briefing needs a reviewer and date" });
    // The "values" side of a disagreement must be framed as values, not facts.
    for (const c of b.disagreements.values) if (c.kind === "fact") ctx.addIssue({ code: "custom", message: "a values disagreement cannot be typed as fact" });
  });
export type Briefing = z.infer<typeof BriefingSchema>;
export type Source = z.infer<typeof SourceSchema>;

export function formatValue(v: number, f: ValueFormat): string {
  switch (f) {
    case "usd-trillions":
      return `$${(v / 1e12).toFixed(2)} trillion`;
    case "usd-billions":
      return `$${(v / 1e9).toFixed(1)} billion`;
    case "count":
      return Math.round(v).toLocaleString("en-US");
    case "rate1":
      return v.toFixed(1);
    case "percent1":
      return `${v.toFixed(1)}%`;
  }
}

/** Compact axis tick label. */
export function formatTick(v: number, f: ValueFormat): string {
  switch (f) {
    case "usd-trillions":
      return `$${(v / 1e12).toFixed(v % 1e12 === 0 ? 0 : 1)}T`;
    case "usd-billions":
      return `$${(v / 1e9).toFixed(0)}B`;
    case "count":
      return v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
    default:
      return String(Math.round(v * 10) / 10);
  }
}

/** Plain-language description of a chart for assistive technology, computed from the data itself. */
export function describeChart(c: Chart): string {
  const parts = c.series.map((s) => {
    const pts = s.points.filter((p): p is { x: string | number; y: number } => p.y !== null);
    if (pts.length === 0) return `${s.label}: no reported values`;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const hi = pts.reduce((a, b) => (b.y > a.y ? b : a));
    const lo = pts.reduce((a, b) => (b.y < a.y ? b : a));
    return `${s.label}: ${formatValue(first.y, c.format)} in ${first.x}, ${formatValue(last.y, c.format)} in ${last.x}; highest ${formatValue(hi.y, c.format)} in ${hi.x}, lowest ${formatValue(lo.y, c.format)} in ${lo.x}`;
  });
  return `${c.kind === "bar" ? "Bar" : "Line"} chart, ${c.dateRange}. ${parts.join(". ")}.`;
}

/** A "nice" step (1, 2, 2.5 or 5 times a power of ten) giving about five gridlines. */
export function niceStep(range: number, target = 5): number {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

/** Axis range with round tick values. Bars and default lines include zero; "auto" lines pad around the data and are labeled by the renderer. */
export function axisRange(c: Chart): { min: number; max: number; truncated: boolean; ticks: number[] } {
  const vals = c.series.flatMap((s) => s.points.map((p) => p.y)).filter((y): y is number => y !== null);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const truncated = c.baseline === "auto" && c.kind !== "bar";
  const pad = truncated ? (hi - lo) * 0.15 || 1 : 0;
  const lowBound = truncated ? Math.max(0, lo - pad) : Math.min(0, lo);
  const highBound = truncated ? hi + pad : hi;
  const step = niceStep(highBound - lowBound || 1);
  const min = truncated ? Math.floor(lowBound / step) * step : lowBound < 0 ? Math.floor(lowBound / step) * step : 0;
  const max = Math.ceil(highBound / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 1e6; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { min, max, truncated, ticks };
}
