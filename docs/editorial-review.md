# Editorial review

High-stakes explanatory text is never published automatically. Anything marked `draft` in a data file stays hidden on the site. Content marked `source-checked` (added 2026-10-22 at the owner's direction) is shown with a visible "source-checked, not human-reviewed" label; only `reviewed` content, with a named reviewer and date, is shown without it. Nothing here has been human-reviewed yet.

## How to review a Help Me Vote measure

1. Open the measure's Blue Book pages (linked below) and the fiscal impact statement.
2. Compare the draft summary, YES/NO meaning, fiscal notes, and "what's unclear" against those sources. Fix anything that is wrong, overstated, or missing.
3. In `data/elections/colorado-2026.json`, set that measure's `draft.review` to:
   ```json
   { "status": "reviewed", "preparedBy": "…", "preparedOn": "2026-10-22", "reviewer": "Your name", "reviewedOn": "YYYY-MM-DD" }
   ```
4. Run `npm test && npm run build`, commit, and push. The explanation then appears on the site with the reviewer's name and date.

If a later official change (a court ruling, a corrected title, a new fiscal estimate) affects a reviewed explanation, set its status to `needs-re-review`. That hides it again until it's re-checked.

## Current queue — Colorado 2026 measures

Drafts were prepared on Oct. 22, 2026, with AI assistance, from the official 2026 Blue Book and the Legislative Council fiscal impact statements. Treat every sentence as unverified until checked.

Blue Book: https://content.leg.colorado.gov/sites/default/files/2026-blue-book-en-accessible.pdf  
Fiscal impact statements: https://content.leg.colorado.gov/sites/default/files/2026-fiscal-impact-statements-english-accessible.pdf

### Amendment 81: Law Enforcement Reporting Requirements to Federal Authorities — status: `draft`

Blue Book: quickReference p. 7–8, analysis p. 15–19, titleAndText p. 69. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/95Final.pdf

**Summary draft:** Would require certain law enforcement, corrections, and district attorney personnel to notify the U.S. Department of Homeland Security within 72 hours after formally charging someone with a crime of violence, or charging anyone who has a prior felony conviction, when that person is not confirmed to be lawfully present or their status cannot be determined. The duty begins at charging, not arrest.

**YES draft:** Law enforcement would be required to notify federal immigration authorities after filing certain criminal charges against people not confirmed to be lawfully present.  
**NO draft:** Current law continues: cooperation with federal immigration authorities is allowed in some criminal matters, while state and local involvement in civil immigration enforcement stays limited.

**Fiscal draft:**
- State: workload and spending increase in FY 2026-27, including $50,000 for the Department of Revenue and $10,000 for the Department of Natural Resources; no funding source is specified (Blue Book).
- Local: workload increases, mainly for district attorney offices; no dollar amount is stated (Blue Book).

**Unclear draft:**
- Workload and cost for local agencies are not estimated in dollars.

- [ ] Reviewed against sources

### Amendment 82: Right to Natural Gas — status: `draft`

Blue Book: quickReference p. 7–8, analysis p. 19–21, titleAndText p. 69. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/177Final.pdf

**Summary draft:** Would create a constitutional right for consumers to buy natural gas for cooking or heating in homes and businesses, and for distributors and utilities to sell it to them. The Blue Book says this may limit state and local governments' ability to enforce existing or future natural gas regulations.

**YES draft:** Creates a state constitutional right to buy and sell natural gas for use in homes and businesses.  
**NO draft:** Current laws and regulations on buying and selling natural gas stay in place.

**Fiscal draft:**
- State: may minimally increase spending (for example, Department of Local Affairs building-code guidance) and may increase legal costs for agencies that regulate gas utilities; no dollar amount is stated (Blue Book).
- Local: governments whose building codes restrict natural gas may face legal costs and costs to change codes and permitting; no dollar amount is stated (Blue Book).

**Unclear draft:**
- How courts would apply the new right to existing local building codes is uncertain.

- [ ] Reviewed against sources

### Amendment 83: Constitutional Right to Hunt and Fish — status: `draft`

Blue Book: quickReference p. 8–9, analysis p. 21–24, titleAndText p. 70. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/302Final.pdf

**Summary draft:** Would create a constitutional right to hunt and fish certain wildlife using traditional methods and make hunting and fishing the preferred way to manage those populations. Nongame species, endangered species, and species illegal to hunt under federal law are excluded. The state could still regulate for sound science, public safety, or preserving future opportunities. The Blue Book says it makes no immediate change to existing law or regulations.

**YES draft:** Creates a state constitutional right to hunt and fish.  
**NO draft:** Hunting and fishing continue as allowed under existing state and federal law.

**Fiscal draft:**
- State: no significant near-term change expected; legal and workload costs for Colorado Parks and Wildlife could rise if rules are challenged, but the amount cannot be estimated (Blue Book).

**Unclear draft:**
- Future litigation over wildlife rules and its cost cannot be estimated.

- [ ] Reviewed against sources

### Amendment 84: Mail Ballot Voter Identification — status: `draft`

Blue Book: quickReference p. 8–9, analysis p. 24–27, titleAndText p. 70. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/362Final.pdf

**Summary draft:** For federal and statewide elections, voters would have to write the last four digits of their Social Security number, or of their Colorado driver's license or ID card number, on their mail ballot in addition to signing it. If the information is missing or doesn't match, voters could fix it within eight days after Election Day, including with other forms of ID; otherwise the ballot would not be counted.

**YES draft:** Voters must provide identification information with their mail ballot, in addition to their signature.  
**NO draft:** The current signature-only verification system for mail ballots continues.

**Fiscal draft:**
- State and local spending increases by up to $2.7 million in FY 2026-27 and about $1.2 million a year after that, shared between state and counties (Blue Book).
- The state would reimburse counties up to $1.1 million in FY 2026-27 and up to $500,000 in later years; business filing fees may rise to cover state costs (Blue Book).

**Unclear draft:**
- How many ballots would need correction, and how many would go uncorrected, is not estimated.

- [ ] Reviewed against sources

### Amendment 85: Plain Language Ballot Questions — status: `draft`

Blue Book: quickReference p. 9, analysis p. 27–29, titleAndText p. 71. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/234Final.pdf

**Summary draft:** Would require all state and local ballot titles to be written in plain language at no more than an eighth-grade reading level, and bar laws from requiring wording in citizen-initiative titles that conflicts with that standard. The Blue Book notes the measure does not define plain language or say who decides whether a title meets it.

**YES draft:** Ballot titles must be in plain language at an eighth-grade level, and no law may interfere with that requirement.  
**NO draft:** Current law continues: ballot titles must be plain language, with no specific grade-level standard.

**Fiscal draft:**
- State: may minimally increase Title Board workload; no dollar amount is stated (Blue Book).

**Unclear draft:**
- Who decides whether a title meets the eighth-grade standard is not specified in the measure.

- [ ] Reviewed against sources

### Amendment 86: Congressional Redistricting — status: `draft`

Blue Book: quickReference p. 10, analysis p. 30–32, titleAndText p. 71. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/256Final.pdf

**Summary draft:** Would require the Independent Congressional Redistricting Commission and the Colorado Supreme Court to review and approve any change to congressional districts made outside a scheduled redistricting year. The commission would have to hold at least three public hearings first, and off-cycle changes could not intentionally favor a political party or unnecessarily split communities of interest.

**YES draft:** The commission must approve any new congressional districts proposed outside a scheduled redistricting year.  
**NO draft:** Current requirements, which provide for redrawing congressional districts every ten years, stay in place.

**Fiscal draft:**
- State: about $370,000 in Legislative Department costs in any year the commission convenes for an off-cycle review, plus a small Judicial Department workload increase (Blue Book).

**Unclear draft:**
- Whether and when an off-cycle redistricting would be proposed is unknown.

- [ ] Reviewed against sources

### Amendment 87: Graduated Income Tax — status: `draft`

Blue Book: quickReference p. 10, analysis p. 33–41, titleAndText p. 79. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/195Final.pdf

**Summary draft:** Would replace Colorado's flat income tax with a graduated (tiered) income tax: lower rates on taxable income below $500,000 and higher rates above it. The added revenue would have to be spent on K-12 education, health care, and early childhood care and education, would be exempt from the TABOR revenue limit, and would be reported in an audited annual report.

**YES draft:** Creates a graduated state income tax that raises revenue for K-12 education, health care, and early childhood programs, exempt from the TABOR limit.  
**NO draft:** The current constitutional requirement for a single flat income tax rate stays in place.

**Fiscal draft:**
- State revenue increase estimated at $958.4 million in budget year 2026-27 (a half year) and $1.972 billion in 2027-28 (Blue Book).
- Taxpayers: taxes fall for Colorado taxable income below $510,834 and rise at $510,834 and above, according to the Blue Book's estimates.

**Unclear draft:**
- Revenue estimates depend on economic conditions and taxpayer behavior; how the legislature allocates the new revenue among the required purposes is not fixed.

- [ ] Reviewed against sources

### Proposition NN: State Public K-12 Education Funding — status: `draft`

Blue Book: quickReference p. 11, analysis p. 41–46, titleAndText p. 84. Official text: https://leg.colorado.gov/bill_files/116503/download

**Summary draft:** Would let the state keep and spend revenue that TABOR would otherwise require it to refund, up to a new limit tied to state spending on public education. For the first ten years, the retained money must go to K-12 education and programs that support children; after that, to K-12 education and other purposes the legislature sets. The state auditor and school districts would report on spending.

**YES draft:** The state may keep some or all revenue that TABOR would otherwise refund, and must spend it on K-12 education, children's programs, and other purposes.  
**NO draft:** Current TABOR refunds and current funding levels for K-12 education, children's programs, and other purposes continue.

**Fiscal draft:**
- The Blue Book estimates the state would actually keep about $500 million in the first year (the new limit would allow up to $4.6 billion above the current limit).
- The fiscal impact statement estimates TABOR refunds would decrease by $329.9 million in FY 2026-27 and $521.0 million in FY 2027-28.

**Unclear draft:**
- Future amounts depend on how much revenue exceeds the current TABOR limit, which depends on the economy.

- [ ] Reviewed against sources

### Proposition 132: Penalties for Fentanyl Crimes — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 48, titleAndText p. 88. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/85Final.pdf

**Summary draft:** Would increase penalties for crimes involving the sale and possession of synthetic opiates such as fentanyl and carfentanil.

**YES draft:** Possession of any amount of fentanyl becomes a felony, any fentanyl distribution carries a mandatory minimum 8-year prison sentence, and options to reduce certain penalties are removed (Blue Book quick reference).  
**NO draft:** Possession of small amounts of fentanyl stays a misdemeanor, distribution penalties stay tiered by quantity, and options to reduce certain penalties remain (Blue Book quick reference).

**Fiscal draft:**
- State spending is estimated at $876,488 in FY 2026-27, $8.9 million in FY 2027-28, and $24.8 million in FY 2028-29 (fiscal impact statement).
- Local: county jail costs may decrease by an unknown amount (fiscal impact statement).

**Unclear draft:**
- Long-term prison population and cost effects grow over several years and depend on charging and sentencing patterns.

- [ ] Reviewed against sources

### Proposition 133: Penalties for Human Trafficking of a Minor — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 52, titleAndText p. 92. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/108Final.pdf

**Summary draft:** Would make human trafficking of a minor for sexual servitude a class 1 felony instead of a class 2 felony.

**YES draft:** The penalty for child sex trafficking becomes life in prison without parole, and buying sexual activity with a minor is added to the offense (Blue Book quick reference).  
**NO draft:** Existing felony penalties for child sex trafficking continue: 8 to 48 years in prison plus mandatory parole (Blue Book quick reference).

**Fiscal draft:**
- State spending: $0 in the near term; costs begin far in the future, estimated at $180,000 in FY 2041-42 and $360,000 in FY 2042-43 as longer sentences take effect (fiscal impact statement).
- Local: district attorney workload increases minimally (fiscal impact statement).

**Unclear draft:**
- Long-range cost estimates depend on future conviction numbers.

- [ ] Reviewed against sources

### Proposition 134: Male and Female Participation in School Sports — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 55–58, titleAndText p. 92. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/109Final.pdf

**Summary draft:** Would require school and collegiate sports teams to be designated male, female, or coeducational, and limit participation based on biological sex.

**YES draft:** Every school-based team or sport must be designated male, female, or mixed, and schools and districts must adopt sex-eligibility policies for sports (Blue Book quick reference).  
**NO draft:** Schools, districts, and athletic associations continue to set their own eligibility policies, consistent with current state and federal law (Blue Book quick reference).

**Fiscal draft:**
- State: no change in revenue or spending (fiscal impact statement).
- Local: school district costs to update policies are expected to be minimal (fiscal impact statement).

**Unclear draft:**
- Interaction with current state and federal law may be subject to legal challenge.

- [ ] Reviewed against sources

### Proposition 135: Prohibit Certain Surgeries on Minors — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 59–61, titleAndText p. 94. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/110Final.pdf

**Summary draft:** Would prohibit surgeries on minors that alter biological sex characteristics in response to the minor's perception of sex or gender, with exceptions, and bar government funds and health insurance from paying for them.

**YES draft:** These surgeries on minors are prohibited, and government funds and health insurance may not pay for them (Blue Book quick reference).  
**NO draft:** Current Colorado law, which protects access to these surgeries and allows public and private insurance to cover them, continues (Blue Book quick reference).

**Fiscal draft:**
- State: no change in revenue or spending; savings to Medicaid and state employee insurance are described as minimal (fiscal impact statement).

**Unclear draft:**
- The scope of the measure's exceptions and how it would be enforced may be clarified only in practice or in court.

**Discrepancy to resolve:**
- The Secretary of State's measures page lists the short title as "Prohibit Certain Surgeries on Minors"; the Sept. 4 certification press release says "Prohibit Certain Surgeries for Minors." Your official ballot governs.

- [ ] Reviewed against sources

### Proposition 136: Income Tax Rate Cap — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 62–63, titleAndText p. 95. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/232FinalCorrected.pdf

**Summary draft:** Would set the current 4.40 percent state income tax rate as the maximum rate in state law, starting in tax year 2027.

**YES draft:** The current 4.4 percent state income tax rate becomes the maximum rate in statute.  
**NO draft:** The rate stays at 4.4 percent for now, without a new limit in statute.

**Fiscal draft:**
- No change to state or local revenue or spending (fiscal impact statement).

**Unclear draft:**
- Interaction with Amendment 87, which would create a graduated income tax, is not described here; read the Blue Book analysis of both.

- [ ] Reviewed against sources

### Proposition 137: Designate Sporting Goods Sales Tax Revenue for Conservation — status: `draft`

Blue Book: quickReference p. 7–14, analysis p. 64–67, titleAndText p. 95. Official text: https://www.coloradosos.gov/pubs/elections/Initiatives/titleBoard/filings/2025-2026/308Final.pdf

**Summary draft:** Would direct existing state sales tax revenue from sporting goods to conservation, wildfire risk mitigation, and outdoor recreation programs, and exempt that revenue from state revenue limits. It does not create a new tax.

**YES draft:** Existing sporting goods sales tax revenue goes to the listed conservation and wildfire purposes and is exempt from state revenue limits.  
**NO draft:** That revenue stays in the general budget, subject to the state revenue limit, where it is spent on legislative priorities or refunded when required.

**Fiscal draft:**
- Transfers from the General Fund are estimated at $175.0 million in FY 2027-28 and $180.2 million in FY 2028-29 (fiscal impact statement).
- TABOR refunds are estimated to decrease by $175.0 million in FY 2027-28 (fiscal impact statement).

**Unclear draft:**
- Because the money is redirected from the general budget, the effect on other programs depends on future budget decisions.

- [ ] Reviewed against sources

### Ballot Issue 7A: Front Range Passenger Rail District — status: `draft`

Blue Book: notice p. 100. Official text: https://leg.colorado.gov/bills/SB26-172

**Summary draft:** Referred by the Front Range Passenger Rail District's board; concerns funding for Front Range passenger rail (called the Colorado Connector). It appears only on ballots of voters who live inside the district.


**Unclear draft:**
- The district's own notice in the Blue Book (p. 100) has not yet been reviewed for this guide.

- [ ] Reviewed against sources

## Other items needing a human check

- **Candidate names** were transcribed from the Secretary of State's official list (last updated Sept. 15, 2026). Spot-check against the official XLSX: https://www.coloradosos.gov/pubs/elections/vote/files/2026/2026GeneralCandidateListOfficial.xlsx — especially for withdrawn candidates, which the official list marks with strikethrough.
- **Office descriptions and term lengths** in `contests[].role` were written by Common Ground as general background.
- **Glossary and primer** text in `src/components/help-me-vote.tsx` was written by Common Ground.


## Source check, 2026-10-22 (AI-assisted, not a human review)

All 14 statewide measures and Ballot Issue 7A were compared with the text of the English 2026 Blue Book (extracted locally from the official PDF): what each measure does, YES/NO meaning, fiscal items, and the Blue Book's arguments for and against (summarized in `draft.arguments`). Corrections made: Amendment 85 (scope wording and referred-measure exception), Proposition 132 fiscal figures (replaced two figures not found in the Blue Book), Propositions 134 and 135 fiscal notes (previously said no state spending change; the Blue Book describes indeterminate or minimal costs), Amendment 87 and Proposition 136 (maximum-revenue figure, inflation indexing, and the unresolved outcome if both pass). Ballot Issue 7A's summary was written from the district's printed ballot title and fiscal information on Blue Book p. 100.

Not done: the separate fiscal impact statements PDF was not read; Spanish edition not checked; statements about what the measures' legal text would do beyond the Blue Book's analysis were not checked against the full measure text. Each measure's `review.checkNotes` lists what changed. A human reviewer should still confirm these and set `status: reviewed` with their name and date.
