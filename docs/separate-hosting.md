# Hosting Common Ground separately from samo.karplus.org

Recommended path (chosen by the maintainers' assistant as the best fit): **move the repository into its own free GitHub organization.** Organization project sites are served at `https://<organization>.github.io/common-ground/`, with no inherited custom domain, no domain purchase, and no change to what `samo.karplus.org` serves.

## Steps (account-level, done by the owner in a browser)
1. GitHub → your profile menu → **Your organizations** → **New organization** → Free plan. Pick a name such as `common-ground-civic` (the name becomes part of the address).
2. In the repository: **Settings → General → Danger Zone → Transfer ownership** → choose the new organization. Issues, pull requests (including #1 and #2), history and stars move with it, and GitHub redirects the old repository address.
3. In the transferred repository: **Settings → Pages** → Source: **Deploy from a branch**, branch `main`, folder `/docs`. Leave "Custom domain" empty.
4. Wait a few minutes, then open `https://<organization>.github.io/common-ground/`. Run the live checks with `E2E_BASE_URL=https://<organization>.github.io/common-ground/ npm run e2e`.
5. Tell a development session the new address. It will update the repository links (`src/lib/corrections.ts`, scripts' user-agent strings, docs). Old links keep working through GitHub's redirect in the meantime.

## Why this is safe for the site
The build uses relative asset paths and hash routes, so it works at any address. Nothing in the repository sets or depends on a domain.

## Alternatives
- Remove the custom domain from the `samokarplus.github.io` user site (also removes `samo.karplus.org` from everything else it serves).
- Give Common Ground its own domain with a `CNAME` file in `docs/` (needs a domain you own).
