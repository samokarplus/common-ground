import treasury from "../../data/fiscal/treasury.json";
import ukraine from "../../data/fiscal/ukraine-appropriations.json";
import abortion from "../../data/stats/abortion-cdc.json";
import { buildAbortionBriefing, buildMoneyBriefing, buildUkraineBriefing, type AbortionData, type TreasuryData, type UkraineData } from "@/lib/briefings";

export const BRIEFINGS = [
  buildMoneyBriefing(treasury as unknown as TreasuryData),
  buildUkraineBriefing(ukraine as unknown as UkraineData),
  buildAbortionBriefing(abortion as unknown as AbortionData),
];
export const briefingById = (id: string) => BRIEFINGS.find((b) => b.id === id);
