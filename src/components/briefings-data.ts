import treasury from "../../data/fiscal/treasury.json";
import ukraine from "../../data/fiscal/ukraine-appropriations.json";
import cpi from "../../data/stats/cpi-bls.json";
import abortion from "../../data/stats/abortion-cdc.json";
import { buildAbortionBriefing, buildPricesBriefing, buildMoneyBriefing, buildUkraineBriefing, type AbortionData, type CpiData, type TreasuryData, type UkraineData } from "@/lib/briefings";

export const BRIEFINGS = [
  buildPricesBriefing(cpi as unknown as CpiData),
  buildMoneyBriefing(treasury as unknown as TreasuryData),
  buildUkraineBriefing(ukraine as unknown as UkraineData),
  buildAbortionBriefing(abortion as unknown as AbortionData),
];
export const briefingById = (id: string) => BRIEFINGS.find((b) => b.id === id);
