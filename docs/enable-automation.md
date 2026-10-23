# Research automation — verified branch test, production pending

The updated workflow is already committed on `codex/independent-audit`; copying it manually is unnecessary if the PR is merged. The existing Git token lacks workflow scope, but the signed-in GitHub editor saved the same YAML successfully. No token or account-wide workflow permissions were changed.

[Run 39893778468](https://github.com/samokarplus/common-ground/actions/runs/39893778468) succeeded: Federal Register and GovInfo checks, verification, build, scan and audit-branch bot commit. Production Pages was correctly skipped. This proves branch execution, not daily scheduling or production publication.

## After coordinated PR review and merge

1. Confirm `.github/workflows/refresh-federal-register.yml` matches `docs/proposed-refresh-workflow.yml` on main.
2. Open the repository Actions tab → refresh workflow → **Run workflow**. Explicitly select **main** for this production test.
3. Confirm both source steps succeed. If either fails, the other still runs; a validated update/health report can be committed and the final run remains red. Never mistake a red source check for fresh data.
4. Confirm a bot commit on main records source checks and updates `/docs` as needed. Concurrent changes cause a normal push rejection rather than a force push; re-run after reviewing the newer branch.
5. Confirm **Request default-branch Pages rebuild** succeeds, then inspect the Pages build/deployment run. GitHub documents that a GITHUB_TOKEN push does not start Pages by itself: https://docs.github.com/en/actions/concepts/security/github_token
6. Open the live Source Status page and compare its check times/content against the bot commit. Do not declare publication verified based only on a green refresh job.
7. Observe a daily scheduled run (13:17 UTC). Scheduling is best-effort and can be delayed/disabled by GitHub; retain manual commands as fallback.

If the workflow remains unmerged, choose **codex/independent-audit** to repeat its non-production test; it cannot request Pages. The default-branch workflow is still the older Federal Register-only version.

## If permissions block publication

Read the exact failed step. The workflow itself declares only `contents: write` and `pages: write`. Do not broadly enable all workflow permissions or create a new personal token as a routine fix. An owner can review repository policy and grant only the required permission if necessary. If billing or payment is requested, stop.

## Free operation

Public repository, standard Ubuntu runner, no caches/artifacts/larger runners or paid integrations. Official keyless APIs only. GitHub free-use reference: https://docs.github.com/en/billing/concepts/product-billing/github-actions

Local fallback: `npm run refresh:fr`, `npm run refresh:congress`, `npm run health`, then `npm run verify`. Commit and review the resulting data/build changes. Never mark an unsuccessful source check as successful.
