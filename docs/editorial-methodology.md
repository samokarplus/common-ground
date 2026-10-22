# Editorial methodology

## Every claim has a category

| Category | Example | How it's shown |
| --- | --- | --- |
| Official primary | Measure designation, candidate names, document type, dates | Shown with source link and the date we checked it |
| Official analysis | Blue Book summaries, fiscal impact statements | Attributed ("Blue Book," "fiscal impact statement") with page references |
| Authored explanation | Office descriptions, glossary, primer, "questions to ask" | Labeled as written by Common Ground |
| Example | Fictional practice measure | Labeled "fictional demonstration" on the page |

## What we won't do

- Publish an unreviewed AI-drafted explanation of a ballot measure or policy. Drafts are stored with `review.status: "draft"` and the site refuses to display them (enforced in code and tests).
- Infer a candidate's positions from party affiliation, or fill a missing fact with a guess. Missing information is labeled missing.
- Rank, score, endorse, or match candidates or measures to a user's values.
- Treat a press release, proposal, or announcement as enacted law.
- Present a statewide list as anyone's complete personal ballot.

## Review

Explanations become visible only after a named reviewer checks them against the cited sources and records a review date (`editorial-review.md`). If an official change affects a reviewed explanation, it's set to `needs-re-review` and hidden until re-checked. We don't silently rewrite: changes go through version control, and the commit history is the record.

## Neutral tone isn't the same as neutral facts

Where evidence clearly supports one factual claim, we don't manufacture balance. Where people disagree about values, we describe the disagreement rather than resolve it. Fiscal figures are estimates, and we say so.

## Corrections

Report errors through the repository's GitHub Issues. Corrections to published explanations are made in a commit that names what changed, and the page shows the new review date.
