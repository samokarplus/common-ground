/**
 * Race types that depend on a voter's address and are NOT covered by Common Ground's statewide data.
 * Descriptions are general civic background written by Common Ground. The authoritative answer for
 * any individual is the official sample ballot from the voter's county election office.
 */
export type LocalRaceType = {
  id: string;
  name: string;
  level: "federal" | "state" | "county" | "city-or-district";
  what: string;
  dependsOn: string;
};

export const LOCAL_RACE_TYPES: LocalRaceType[] = [
  { id: "us-house", name: "U.S. House of Representatives", level: "federal", what: "One representative per congressional district in Congress.", dependsOn: "Your congressional district." },
  { id: "state-legislature", name: "State Senate and State House", level: "state", what: "Members of the Colorado General Assembly, who write state law and the state budget.", dependsOn: "Your state Senate and state House districts." },
  { id: "state-board-of-education", name: "State Board of Education", level: "state", what: "Elected members who help set statewide public school policy.", dependsOn: "Your congressional district." },
  { id: "cu-regents", name: "CU Regents", level: "state", what: "Elected governing board of the University of Colorado system.", dependsOn: "Your congressional district, plus any at-large seat." },
  { id: "district-attorney", name: "District Attorney", level: "state", what: "The elected prosecutor for a judicial district.", dependsOn: "Your judicial district." },
  { id: "county-offices", name: "County offices", level: "county", what: "Elected county officials, which typically include commissioners, sheriff, clerk and recorder, treasurer, assessor and coroner.", dependsOn: "Your county, and sometimes your commissioner district." },
  { id: "local-judges", name: "District and county judge retention", level: "county", what: "Yes-or-no retention questions for trial-court judges in your area. See the judicial retention guide for how to read them.", dependsOn: "Your judicial district and county." },
  { id: "municipal", name: "City and town offices and measures", level: "city-or-district", what: "Mayors, councils and local ballot questions if your city or town holds an election this year.", dependsOn: "Your municipality, which may differ from your mailing address's city name." },
  { id: "school-and-special-districts", name: "School boards and special districts", level: "city-or-district", what: "School board seats and measures, plus fire, water, library, park and other special districts.", dependsOn: "The exact districts your address falls inside. Boundaries often do not match city or county lines." },
];

/** The statewide data never personalizes a ballot. Flip only when district eligibility is verified per voter. */
export const BALLOT_PERSONALIZATION = "none" as const;
