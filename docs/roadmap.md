# Roadmap

Current evidence: [independent audit](independent-audit.md). Older milestones are preserved in development-progress.md and HANDOFF.md as history.

## Implemented and tested

- Static, keyless public site; hash routes; privacy controls; source citations and fallback feed.
- Colorado 2026 guide: 14 statewide measures plus district 7A, statewide offices/retention, 13 sourced profiles, comparisons and gaps, private notes/print/download.
- Selected 160-bill GovInfo tracker, official summaries, filters, action timelines and links.
- 86-idea Atlas, six debate maps, values tradeoffs, search, pathways and a promise-to-outcome example.
- Unit/data/build/secret checks and desktop/tablet/mobile Playwright + axe coverage.
- Audit branch adds reliable private-note deletion, editorial withdrawal, conservative bill parsing, full timelines, unknown-bill fallback and last-check health indicators.

## Next, in priority order

1. Review and merge the audit branch in coordination with concurrent development. Test default-branch refresh → bot commit → Pages → live data. Observe the daily schedule; a branch dispatch alone does not prove it.
2. Named human editorial review of 15 measure explanations and 13 candidate profiles. All remain unreviewed by humans. Version-bind future approvals to content hashes.
3. Primary-source candidate research with balanced coverage and official judicial evaluations.
4. Verified county/district data, with clear coverage limits and official personal-ballot handoff.
5. Richer structured congressional stage evidence, additional sourced explainers, broader federal coverage and more promise-to-outcome examples.

## Deliberate limits

No paid/metered AI or infrastructure. Debate is deterministic, not generative AI. No voter matching/scores, recommendations, political profiling, address collection, or account sync. Never solve missing coverage with a plausible-looking placeholder.
