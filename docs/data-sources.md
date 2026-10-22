# Data sources

The full, generated list is in `source-registry.md` (from `src/lib/source-registry.ts`). In short:

| Source | Used for | How |
| --- | --- | --- |
| Federal Register API | Federal agency rules, proposed rules, notices, presidential documents | Visitor's browser fetches live (keyless, CORS-enabled); daily snapshot refresh as fallback |
| Colorado Secretary of State | Certified 2026 measures, candidate list, deadlines, county clerk directory | Manually transcribed and reviewed; linked |
| Colorado Legislative Council (Blue Book, fiscal impact statements) | Measure analysis and fiscal estimates | Page references and links; drafted summaries held for review |
| Colorado Office of Judicial Performance Evaluation | Judge evaluations | Link only; we don't summarize or rate judges |
| GoVoteColorado.gov | Registration, ballot tracking, personal ballot | Link only; we never handle voter data |
| Stanford Encyclopedia of Philosophy | Thought Atlas readings | Links |
| Congress.gov, GovInfo bulk data | Congress tracker | Planned (see `roadmap.md`) |

## Constraints we respect

- **No keys in browser code.** Congress.gov requires an API key, so it won't be called from the site. Any future integration runs as a maintainer script with the key kept in a local environment variable, never committed.
- **CORS and the Content Security Policy.** The site may only contact itself and `www.federalregister.gov`. Adding a source means updating the policy deliberately.
- **No scraping** of sites whose terms or robots rules disallow it, and no high-frequency polling.
- **Copyright.** Government works are used with attribution. We link rather than republish long texts.
