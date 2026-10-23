import { z } from "zod";

export const CORRECTION_TYPES = ["incorrect", "outdated", "missing-source", "misleading", "broken-link"] as const;
export const CORRECTION_LABEL: Record<(typeof CORRECTION_TYPES)[number], string> = {
  incorrect: "Incorrect information",
  outdated: "Outdated information",
  "missing-source": "Missing source",
  misleading: "Misleading description",
  "broken-link": "Broken link",
};

export const CorrectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  page: z.string().min(1),
  type: z.enum(CORRECTION_TYPES),
  was: z.string().min(1),
  now: z.string().min(1),
  sourceUrl: z.string().url().startsWith("https://").optional(),
});
export type Correction = z.infer<typeof CorrectionSchema>;

const REPO = "https://github.com/samokarplus/common-ground";

/**
 * Link that opens a pre-filled GitHub issue. It carries only the page route and the chosen
 * problem type, never any research notes, saved guide entries or personal data.
 */
export function reportUrl(route: string, type: (typeof CORRECTION_TYPES)[number]): string {
  const page = route.split("?")[0].slice(0, 200);
  const title = `Correction: ${CORRECTION_LABEL[type]} on ${page || "/"}`;
  const body = `Page: ${page || "/"}\nType: ${CORRECTION_LABEL[type]}\n\nWhat is wrong:\n\nWhat the correct information is, with an official source link if you have one:\n`;
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
