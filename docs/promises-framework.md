# Promises, votes and outcomes: how to add a record

A record is a chain of seven stages (promise, proposal, bill introduced, vote, law enacted, implemented, outcome). It lives in `src/lib/chain.ts` and is validated by `ChainSchema`.

## Evidence standards
- **Promise:** a dated, direct quotation or official platform document, with a link to the primary source. Do not infer promises from party, endorsements or media summaries.
- **Proposal:** the specific text or plan, by named people in a named role.
- **Bill and vote:** official bill-status data (GovInfo BILLSTATUS or Congress.gov) and the House Clerk or Senate roll-call page. Quote the official action text; do not tally votes by party or add motives.
- **Law:** public law number and signing date from the official record.
- **Implementation:** Federal Register rules or agency program documents.
- **Outcome:** independent measurement (government statistics, audits, peer-reviewed studies), with the measurement period. State plainly that causes are shared and contested.

## Rules the code enforces
All seven stages appear once, in order. A documented stage needs at least one event with a date, an actor, an institutional role and an https source. An undocumented stage must say why. Text containing "score", "rating", "grade", "kept promise", "broken promise" or similar is rejected by tests, and the example must not assert a promise, implementation or outcome it has not documented.

## Current records
Only one worked example (H.R. 1 of the 119th Congress). It covers the legislative stages only. No promises have been recorded; adding the first requires a human to choose a promise and its primary source.
