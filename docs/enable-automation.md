# Turning on the scheduled refresh (owner action required)

Status on 2026-10-22: **not active.** The development machine's Git credentials lack GitHub's `workflow` scope, so a change to `.github/workflows/` was rejected. The updated workflow is ready at `docs/proposed-refresh-workflow.yml`. Nothing here can be done without your account.

## Exact steps (about two minutes)

1. Open https://github.com/samokarplus/common-ground/blob/main/docs/proposed-refresh-workflow.yml and copy the whole file.
2. Open https://github.com/samokarplus/common-ground/edit/main/.github/workflows/refresh-federal-register.yml, replace its contents with the copied text, and commit directly to `main`.
3. Check Settings → Actions → General → Workflow permissions is set to **Read and write permissions** (the job pushes data commits).
4. Open the Actions tab → "Refresh official research snapshots" → **Run workflow**. A green run that either commits "Refresh official research snapshots" or finds no change counts as working. Do not treat automation as verified until you see that run.
5. Confirm GitHub Pages rebuilds after a bot commit. If it does not, say so and the build step can be adjusted.

Alternative: create a fine-grained personal access token with **Workflows: read and write** for this repository only, give it to the Git client on the development machine, and the change can be pushed from there.

## What the workflow does
Runs daily at 13:17 UTC: refreshes the Federal Register and GovInfo Congress snapshots independently, runs tests, lint, health report, build and secret scan, then commits `data/` and `docs/` only if something changed. The job ends red if either source failed. Cost: $0 (standard runner, public repository, no artifacts or caches).
