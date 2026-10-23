# Common Ground — The World, Explained.

Free, noncommercial, nonpartisan civic education. Understand official government documents and your ballot, explore your values, and examine ideas — without voting recommendations or political profiling.

## Zero-spending edition

A static React + TypeScript app built with Vite and published from `/docs` by GitHub Pages in a **public** repository. No cloud server, database, purchased domain, paid AI, trials, subscriptions, payment method, or metered service. No API keys or deployment credentials belong in this repository.

GitHub documents Pages availability for public repositories on GitHub Free and soft limits that restrict service rather than purchase capacity:
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The scheduled data refresh uses GitHub Actions on a standard runner, which is free for public repositories (larger runners are billed and are not used): https://docs.github.com/en/billing/concepts/product-billing/github-actions. If hosting or Actions eligibility changes, stop and verify terms; don't add paid fallbacks.

## Run and check

Requires Node 22.13+ and npm.

```sh
npm ci --ignore-scripts
npm run dev          # http://127.0.0.1:3020
npm test             # unit tests (node test runner)
npm run lint
npm run build        # typecheck + build into /docs (keeps docs/*.md)
npm run scan         # secret / personal-data scan of source and build
npm run preview      # http://127.0.0.1:3021
npm run refresh:fr   # refresh the Federal Register snapshot (needs network)
npm run health       # regenerate docs/research-health.md and docs/source-registry.md
npm run refresh:congress # selected GovInfo bill snapshot (keyless)
npm run verify       # lint, types, units, election validation, build and scan
npm run e2e          # desktop/tablet/mobile browser and axe checks (build first)
```

Navigation uses hash routes (`#/vote/colorado`) so every page works under a GitHub Pages project path and survives refresh.

## Features

- **Help Me Vote — Colorado 2026** (`#/vote`). All 14 certified statewide measures plus district Issue 7A, statewide offices, and judicial retention, from official Secretary of State and Legislative Council sources. Every item is labeled with its coverage status; Mountain Time deadlines; stale-data warnings; links to the official personal ballot. A private research guide (memory by default, opt-in device storage, print/PDF, download, delete). A ballot primer and glossary. All 15 explanations are source-checked and visible with an explicit **not human-reviewed** label; rejected or changes-requested explanations are hidden. Each measure links to its Blue Book sources.
- **Federal Register.** Live official feed with validation, bounded retries, filters, and search. The document explainer separates the agency's abstract from analysis and shows the comment deadline and effective date from official metadata, plus questions to ask, key terms, and citation copy. A dated snapshot is the fallback. An idempotent refresh script exists; scheduled operation and publication must be verified separately in GitHub Actions.
- **Congress Tracker.** Search and filter a dated selection of 160 GovInfo bills, read official summaries and complete action timelines, and open original records. Separate passage votes do not imply identical text or enactment.
- **Candidate research.** 13 attributed profiles, comparison pages and explicit coverage gaps; 34 statewide candidate/retention entries and seven running mates checked against the official workbook.
- **Values Explorer, Debate Lab, Thought Atlas (86 ideas).** Local-only reflection tools. The Debate Lab is template-based and **not generative AI**.
- **Methodology, source status, privacy controls**, responsive layout, keyboard focus, reduced-motion support.

## Documentation

`docs/current-state.md` (what's tested and what isn't) · `docs/roadmap.md` · `docs/election-data-coverage.md` · `docs/editorial-review.md` (review queue) · `docs/editorial-methodology.md` · `docs/data-sources.md` · `docs/source-registry.md` · `docs/research-pipeline.md` · `docs/research-health.md` · `docs/privacy-and-security.md`

## Privacy

No accounts, analytics, advertising, location detection, or address collection. Research notes and reflections stay in the browser unless you opt in to device storage, and can be exported or deleted. See `docs/privacy-and-security.md`.

## Limits

Congress covers selected bills, not all legislation. Candidate research is uneven and has not had human editorial review. District and local races aren't covered — the site sends voters to their official sample ballot. Other states aren't covered. No accessibility certification is claimed. Only this sanitized static project is public; a separate private server beta is excluded.


## Independent verification

See [`docs/independent-audit.md`](docs/independent-audit.md) for source checks, defects, test results, automation evidence and remaining limits. Changes on `codex/independent-audit` are not live until reviewed and merged.

## Maintainer notes

- What needs the owner: [`docs/OWNER-ACTIONS.md`](docs/OWNER-ACTIONS.md)
- Editorial review workflow: [`docs/editorial-workflow.md`](docs/editorial-workflow.md)
- Before pushing, run `npm run verify`.
