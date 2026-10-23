# Address-based ballot lookup: privacy-first design

Status: **design only. Nothing here collects or transmits an address.** The Help Me Vote overview sends voters to the official sample-ballot tool and says plainly that Common Ground is not personalized.

## Principles
1. **No address collection by default.** Precise addresses are sensitive. The site has no server; the browser must never send an address to Common Ground or to any third party.
2. **Official tools do the matching.** District assignment depends on exact address and on boundaries that differ by layer (congressional, legislative, judicial, county commissioner, school, special districts). Only the state or county election office can determine it.
3. **Never infer districts from a city or ZIP code.** Boundaries do not follow those lines.
4. **Say what we verified.** A page may say "your ballot" only after district eligibility is verified for that voter. Until then it says "statewide items" and "may appear on your ballot".

## Phase A (live now)
Link to GoVoteColorado and the county election office directory. Describe address-dependent race types in general terms (`src/lib/local-races.ts`). `BALLOT_PERSONALIZATION` is `"none"`, and a test fails if the UI claims otherwise.

## Phase B (design, needs an official data source)
Let the voter paste or type nothing. Instead:
- The voter opens their official sample ballot on the election office's site.
- They copy the **list of contest names** (not the address) into an optional "match my sample ballot" box that runs entirely in the browser and highlights which printed items Common Ground covers, with links to those pages and an explicit "not covered" list for the rest.
- Nothing is sent or stored unless the voter chooses the existing opt-in storage.

## Phase C (only with an official, keyless, CORS-enabled geocoder and boundary service)
A one-off browser-side lookup could return district identifiers without sending the address to Common Ground. It would need: a documented official or nonprofit service with a privacy policy that allows this use; an update to the Content Security Policy, which currently allows connections only to this site and www.federalregister.gov; a user-visible prompt saying exactly where the address goes; and no storage of the address. If no suitable service exists, Phase C does not ship.

## Data needed per jurisdiction
For each state: the election office URL, sample-ballot tool URL, county directory URL, and the layers of districts used. These live beside the state's dataset and must cite official sources like every other record (see `docs/election-architecture.md`).
