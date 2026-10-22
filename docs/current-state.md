# Current state — Common Ground public edition

_Audit date: October 22, 2026. Updated as features ship. This file describes what was tested, not what the README claims._

## Baseline audit (before this round of work)

Checked from a fresh clone of `samokarplus/common-ground` at commit `7075786`:

| Check | Result |
| --- | --- |
| `npm test` (node test runner) | 17/17 pass |
| `npm run lint` | clean |
| `npm run build` | succeeds; rebuilt `/docs` was byte-identical to the committed build (reproducible) |
| `npm run scan` (secret/PII scan) | 0 findings |
| Live site | Not checked from the build environment: its network allowlist blocks `samokarplus.github.io`. Verify in a browser after each push. |

Stack: React 19 + TypeScript + Vite, static build committed to `/docs`, published by GitHub Pages from the `main` branch. Hash routing (`#/route`) so deep links survive refresh without a server. Content Security Policy limits network requests to the site itself and `www.federalregister.gov`.

A separate **private server beta** (Next.js, Cloudflare Workers, Drizzle database, `.env.example`, Wrangler state) exists on the maintainer's machine. It is **not** part of this repository, and nothing from it was copied or merged.

## What works

- **Federal Register feed (live, keyless):** newest documents, pagination (up to 50 pages), bounded retries with timeouts, 15-minute in-memory cache, type filters, keyword/agency/ID search. Records are schema-validated and source URLs are pinned to `www.federalregister.gov`.
- **Honest fallback:** if the API is unavailable, a dated real-source snapshot (`data/federal-register.json`) is shown with its retrieval time and a "not live news" label.
- **Document detail:** official metadata, agency abstract (labeled as the agency's), effective date kept separate from comment deadlines, timeline, traceable claims, official links.
- **Values Explorer, Debate Lab, Thought Atlas (19 nodes):** working, local-only, with export and delete. The Debate Lab is template-based and labeled "not generative AI."
- **Privacy controls:** export and delete all device data.

## Added in this round

- **Help Me Vote — Colorado 2026** (`#/vote`): landing page, Colorado overview with coverage labels and key dates, all 14 statewide measures plus district Issue 7A, statewide offices and judicial retention, a private research guide (memory by default, device storage on opt-in, print/PDF, download, delete), a ballot primer and glossary, and a clearly separated fictional demo. See `election-data-coverage.md`.
- **Homepage:** election banner, direct paths to every product area, and a "how government action actually happens" guide.
- **Document explainer:** type-specific "questions to ask," plain-English key terms, copy-citation, print.
- **Build:** `/docs` markdown documentation now survives builds (only build artifacts are cleaned).
- Federal Register error notices now appear only on pages that use the feed.

## What is mocked or demo

- `#/vote/demo` — a fictional "Example Town · Measure A," labeled on the page as not a real ballot item.
- Values scenarios use fictional places by design.

## Known problems and gaps

- **Plain-language measure explanations are drafted but hidden.** All 15 are marked `draft` and will not display until an editor reviews them (`editorial-review.md`). Until then, each measure page links to the exact Blue Book pages.
- **Candidate positions are not compiled.** Candidate pages show only official name, running mate, and listed affiliation, and say so.
- **Withdrawn candidates** could not be detected from the official list's strikethrough formatting; this is flagged on every contest page.
- **No Congress tracker yet.** Congress.gov requires an API key, which can't be shipped in a static site; a committed snapshot approach is planned (`roadmap.md`).
- **Thought Atlas** has 19 nodes; the target is 75–150 well-sourced nodes.
- **Accessibility:** several existing styles use very small text (8–11px tags and notices). New Help Me Vote styles use 12px or larger. A full audit is still to do.
- **Bundle size:** about 468 KB of JavaScript (132 KB gzipped) in a single chunk. Route-based splitting would help.
- No automated browser tests are committed yet. Rendering was checked manually with headless Chromium at 390px and 1360px (one H1 per page, no console errors, no horizontal scroll).

## Unverified

- Live GitHub Pages behavior after deployment (redirects, custom domain, 404s). Check in a browser.
- Exact Blue Book page numbers for Propositions 132–137 quick-reference entries (recorded as the guide's page range, 7–14).
