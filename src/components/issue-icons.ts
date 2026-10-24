import { Baby, Globe, HeartPulse, Landmark, Leaf, Scale, Trees, Users, Wallet, type LucideIcon } from "lucide-react";

/** One icon per issue, used on the home page and the issues hub so an issue always looks the same. */
export const ISSUE_ICON: Record<string, LucideIcon> = {
  "cost-of-living": Wallet,
  "health-care": HeartPulse,
  immigration: Users,
  abortion: Baby,
  "climate-energy": Leaf,
  "spending-debt": Landmark,
  "corruption-ethics": Scale,
  "public-lands": Trees,
  "foreign-policy": Globe,
};
