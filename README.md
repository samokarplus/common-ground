# Common Ground — The World, Explained.

Free, noncommercial civic education. Understand official government documents, explore your values, and examine ideas without voting recommendations or political profiling.

## Zero-spending edition

This is a static React + TypeScript app built locally with Vite and published from `/docs` through GitHub Pages in a **public** repository. No cloud server, cloud database, purchased domain, paid AI, trials, subscriptions, payment method, metered service, or custom CI runner is needed. No deployment credentials or API keys belong in this repository. No automatic paid upgrades or overage service is configured.

GitHub documents Pages availability for public repositories on GitHub Free and soft limits that may restrict service rather than automatically purchase capacity:
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The site is a free educational project, not a commercial SaaS or transaction service. If hosting eligibility changes, stop publishing and verify the new terms before selecting any replacement. Do not add paid fallbacks.

## Run and check

Requires Node 22.13+ and npm.

```sh
npm ci --ignore-scripts
npm run dev
npm test
npm run lint
npm run build
npm run scan
npm run preview
```

Development: http://127.0.0.1:3020. Built preview: http://127.0.0.1:3021. Navigation uses hash routes so every page works under a GitHub Pages project subdirectory and survives refresh without a backend. The built `/docs` directory is committed for branch-based Pages publication; `.nojekyll` disables Jekyll transformations. No custom Actions workflows or stored Actions artifacts are used.

## Working features

- Live official Federal Register feed with pagination, schema validation, bounded retries, timeouts, action-type filters, keyword/agency/ID search, canonical citations, source passages, timelines and reading list.
- Direct browser requests only to the keyless public Federal Register API; its CORS response permits public-browser access. A dated real-source snapshot is clearly labeled when live data is unavailable. It is not fictional news and is not represented as current when offline.
- Values scenarios with uncertainty, reasoning, certainty, change-of-mind evidence, tensions, editable journal, explicit device saving, export, and deletion.
- Five debate modes running entirely locally. Transparent topical templates provide questions, supporting and challenging frames, and revision history. **This is not generative AI** and no AI API can be called by this app.
- Interactive 19-node Thought Atlas with scholarly references, thematic relationships, search, filters, pan/zoom, list alternative and reading-path export.
- Clearly fictional ballot learning demo, official state-election links, and a local private worksheet. No real local ballots or candidates are invented.
- Methodology, source status, corrections information, privacy controls, responsive layout, keyboard focus and reduced-motion support. Fonts are self-hosted open-source assets with licenses included.

## Privacy

No accounts, analytics, advertising, hidden profiling, or cloud reflection storage. Values and ballot notes are in memory unless device saving is explicitly enabled. Debate input never leaves the browser. Reading-list IDs use browser storage. Export/delete controls are available. Public-source requests reveal normal network request information to FederalRegister.gov; GitHub serves the static site and applies its hosting privacy policies.

## Limits and next work

No Congress.gov bill ingestion, state ballot feeds, reviewed full-text explainers, full-text version archive, or scheduled backend ingestion. There is no shared database; live metadata and a dated snapshot replace server persistence. The local coach is a reasoning aid with conceptual frames, not an evidence-reviewed assessment. No public-beta security/accessibility certification or trademark clearance is claimed. Only the new sanitized static project is public; the original server project and unrelated private files are excluded.

Next priorities: richer free curated learning guides, keyless official-source coverage, accessibility audit, browser regression coverage, and reviewed evidence/corrections workflows that preserve the zero-spending restriction.
