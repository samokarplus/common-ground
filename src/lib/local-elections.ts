/**
 * Reusable structures for county, municipal and special-district elections.
 * A jurisdiction is any government with its own ballot items. A local dataset records which
 * jurisdictions exist, who runs their elections, what we cover, and each item with its source.
 * Nothing here assigns a voter to a jurisdiction: that needs an official address lookup.
 */
import { z } from "zod";

const Https = z.string().url().startsWith("https://");
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const JURISDICTION_LEVELS = ["county", "municipality", "school-district", "special-district"] as const;

export const JurisdictionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  level: z.enum(JURISDICTION_LEVELS),
  state: z.string().length(2),
  /** Counties belong to a state; other levels may sit inside a county (parent id) or span several (omit). */
  parentId: z.string().optional(),
  electionOffice: z.object({ name: z.string().min(1), url: Https }).optional(),
  /** What we cover for this jurisdiction. "listed" means named, with official links only. */
  coverage: z.enum(["verified-items", "listed"]),
  note: z.string().optional(),
});

export const LocalItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  jurisdictionId: z.string(),
  kind: z.enum(["measure", "office", "retention"]),
  title: z.string().min(1),
  /** Link to the official text or notice. */
  officialUrl: Https,
  sourceTitle: z.string().min(1),
  retrievedOn: Day,
  /** If this item is also a full record in the statewide dataset, its id there. */
  measureId: z.string().optional(),
});

export const LocalDatasetSchema = z
  .object({
    state: z.string().length(2),
    electionDate: Day,
    jurisdictions: z.array(JurisdictionSchema),
    items: z.array(LocalItemSchema),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>();
    for (const j of d.jurisdictions) {
      if (ids.has(j.id)) ctx.addIssue({ code: "custom", message: `duplicate jurisdiction ${j.id}` });
      ids.add(j.id);
      if (j.state !== d.state) ctx.addIssue({ code: "custom", message: `${j.id}: state mismatch` });
    }
    for (const j of d.jurisdictions) if (j.parentId && !ids.has(j.parentId)) ctx.addIssue({ code: "custom", message: `${j.id}: unknown parent ${j.parentId}` });
    const seen = new Set<string>();
    for (const it of d.items) {
      if (!ids.has(it.jurisdictionId)) ctx.addIssue({ code: "custom", message: `${it.id}: unknown jurisdiction ${it.jurisdictionId}` });
      if (seen.has(it.id)) ctx.addIssue({ code: "custom", message: `duplicate item ${it.id}` });
      seen.add(it.id);
    }
    for (const j of d.jurisdictions)
      if (j.coverage === "verified-items" && !d.items.some((i) => i.jurisdictionId === j.id))
        ctx.addIssue({ code: "custom", message: `${j.id} claims verified items but has none` });
  });
export type LocalDataset = z.infer<typeof LocalDatasetSchema>;
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

/** Items for a jurisdiction and everything beneath it. Never infers which jurisdictions a person lives in. */
export function itemsFor(d: LocalDataset, jurisdictionId: string) {
  const within = new Set([jurisdictionId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const j of d.jurisdictions) {
      if (j.parentId && within.has(j.parentId) && !within.has(j.id)) {
        within.add(j.id);
        grew = true;
      }
    }
  }
  return d.items.filter((i) => within.has(i.jurisdictionId));
}
