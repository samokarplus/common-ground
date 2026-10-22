# Research pipeline

Common Ground keeps official information fresh without a server, a database, or paid services.

## Federal Register (automated)

```
fetch (keyless API, bounded retries, 20 s timeout, honors Retry-After)
  → validate (zod schema; reject bad dates, unknown types, non-federalregister.gov URLs)
  → normalize (keep only fields we use, stable key order)
  → dedupe (by document number)
  → hash and diff against the committed snapshot
  → if unchanged: write nothing and exit (idempotent)
  → if changed: write data/federal-register.json, append data/changelog/federal-register.jsonl
  → tests, lint, health report, build, secret scan
  → commit and push (the GitHub Pages site then serves the new snapshot)
```

Code: `src/lib/pipeline.ts` (pure, tested in `tests/pipeline.test.mts`) and `scripts/refresh-federal-register.mts` (network and files).

**What "changed" means.** A record is *added* when a new document number appears and *changed* when an official field differs; the changelog names the fields. Records that roll out of the newest-40 window are listed as `leftWindow`, not as deletions, because they still exist at the source. Invalid records are listed under `rejected` with a reason, never silently corrected.

**Failures.** If the API is unreachable or returns nothing valid, the snapshot is left unchanged, the script exits with an error (so the workflow run shows red), and `data/source-status.json` records the failure. A repeated identical failure doesn't rewrite the file.

**Live site behavior.** Visitors' browsers still request the newest records directly from the Federal Register. The committed snapshot is the fallback, shown with its retrieval time and a "not live news" label.

### Running it

| How | Command | Notes |
| --- | --- | --- |
| Scheduled | `.github/workflows/refresh-federal-register.yml` | Daily at 13:17 UTC. Free: standard runner in a public repository, no artifacts or caches. Best-effort: GitHub can delay or skip scheduled runs and may pause schedules in inactive repositories. |
| On demand | GitHub → Actions → "Refresh Federal Register snapshot" → Run workflow | |
| Locally | `npm run refresh:fr` (or `-- --dry-run`) then `npm run health && npm run build` | Needs network access to www.federalregister.gov |

**Status:** the workflow was committed on Oct. 22, 2026. Its first scheduled run has not been observed yet. Don't treat automation as live until a run appears in the Actions tab and, if data changed, a commit by `common-ground-research-bot`. If the run fails at "Commit and push," check Settings → Actions → General → Workflow permissions (it needs "Read and write"). That's a repository setting only the owner should change.

**Rollback.** Every refresh is an ordinary commit. To undo one: `git revert <commit>` and push, or restore an earlier snapshot with `git checkout <commit> -- data/federal-register.json`, rebuild, and commit.

## Colorado election data (manual, reviewed)

Colorado publishes ballot content as web pages, PDFs, and an XLSX file, not as an API, so automated scraping would be fragile and risky for election information. Updates are done by a maintainer: see `election-data-coverage.md`. The schema and tests catch structural mistakes, and drafted explanations stay hidden until reviewed (`editorial-review.md`).

## Health report

`npm run health` writes `docs/research-health.md` and `data/research-health.json`. They cover source freshness, the latest change, the review queue, upcoming deadlines, unresolved discrepancies, and known gaps. The scheduled workflow regenerates it whenever data changes.
