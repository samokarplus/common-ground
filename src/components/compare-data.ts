import raw from "../../data/compare/texas-senate-2026.json";
import { parseComparison } from "@/lib/compare";

/** All published comparisons. Each is validated when the app loads. */
export const COMPARISONS = [parseComparison(raw)];
export const comparisonById = (id: string) => COMPARISONS.find((c) => c.id === id);
