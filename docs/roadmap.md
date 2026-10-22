# Roadmap

Milestones are ordered by value and dependency. Each has a test you can run to know it's done. Status: **SHIPPED**, **IN PROGRESS**, **NEXT**, **LATER**, **BLOCKED**.

## Phase A — Audit and foundation · SHIPPED
- Baseline test, lint, build, and secret scan. Done: see `current-state.md`.
- Keep `/docs` markdown through builds. Done: `scripts/clean-build.mjs`.
- **Done when:** `npm test && npm run lint && npm run build && npm run scan` all pass on a fresh clone.

## Phase E (prioritized) — Help Me Vote, Colorado 2026 · SHIPPED (explanations awaiting review)
Election Day is November 3, 2026, so this came first.
- Typed, validated dataset: `data/elections/colorado-2026.json`, `src/lib/election.ts`. Done.
- Routes `#/vote`, `#/vote/colorado`, `/measures`, `/measure/:id`, `/contests`, `/contest/:id`, `#/vote/my-guide`, `#/vote/how-to-read`, `#/vote/demo`. Done.
- Private research guide with opt-in storage, print, download, and delete. Done.
- **Editorial review of the 15 drafted explanations.** Waiting on a human reviewer (`editorial-review.md`). This is the highest-impact remaining task before Election Day.
- Sourced candidate information (dated statements, official records). LATER: needs careful, attributed research per candidate.
- **Done when:** `tests/election.test.mts` passes, and each measure shows either a reviewed explanation or exact Blue Book page references.

## Phase B — Flagship explainer and home · IN PROGRESS
- Homepage paths, election banner, government guide. Done.
- Explainer: questions to ask, key terms, copy citation, print. Done.
- NEXT: parse comment deadlines from official `dates` text into the timeline (deterministic, with tests); show "comments close in N days."
- NEXT: 3–5 human-reviewed explainers for real Federal Register documents, with reviewer, date, and sources.

## Phase F — Continuous research pipeline · IN PROGRESS
- Source registry, idempotent Federal Register refresh with diff and changelog, research-health report. See `research-pipeline.md`.
- Scheduled refresh via GitHub Actions: only after confirming it's free for this public repository. Manual command is the fallback.
- **Done when:** running the refresh twice produces no second change, and a changed official record appears in the changelog.

## Phase C — Congress tracker · NEXT
- Congress.gov API requires a key, which must never ship in browser code. Plan: a maintainer-run script (key in a local environment variable, never committed) that writes a dated, committed snapshot of selected bills. Status classification (introduced → committee → passed one chamber → passed both → presented → enacted / vetoed / failed) with regression tests.
- Alternative without a key: GovInfo bulk data (BILLSTATUS XML) is free. Investigate first.

## Phase D — Deepen learning · LATER
- Thought Atlas: 19 → 75+ nodes with typed, justified edges and validation tests.
- Values Explorer: more scenarios; "what would change my mind" prompts.
- Debate Lab: richer topical question banks; normative versus empirical distinction.

## Phase G — Release validation · each release
- Automated checks, secret scan, built-artifact inspection, push, then a live-site browser check.

## Not planned
- Generative AI for visitors (no $0 option without visitor keys or local models).
- Address lookup (can't guarantee no retention on a static site). We link to official lookups instead.
- Candidate matching, scores, or vote recommendations.
