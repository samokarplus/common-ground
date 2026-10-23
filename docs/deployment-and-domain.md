# Deployment and domain notes

Checked 2026-10-22 with `curl` and `dig`.

## What happens when someone opens the site
1. `https://samokarplus.github.io/common-ground/` answers **301 → `http://samo.karplus.org/common-ground/`**.
2. That `http://` URL answers **301 → `https://samo.karplus.org/common-ground/`**.
3. The `https://` URL answers **200** and serves the site. DNS: `samo.karplus.org` is a CNAME to `samokarplus.github.io`, which resolves to GitHub Pages IPs.

So visitors end on HTTPS. The redirect is not configured in this repository: there is no `CNAME` file here. It comes from a custom domain set on the account's user site (`samokarplus.github.io` repository). The project site inherits that domain.

## What is not ideal
- Hop 1 sends visitors to an `http://` URL before hop 2 upgrades them. GitHub controls that behavior. A network attacker on that first hop could interfere with the first request only. Linking to `https://samo.karplus.org/common-ground/` directly avoids it.
- No `Strict-Transport-Security` header is sent by GitHub Pages for this domain, and the repository cannot add response headers.

## Repository-controlled safeguards (already in place)
- Content Security Policy in `index.html` limits network connections to the site itself and `https://www.federalregister.gov`.
- `e2e/privacy.spec.ts` verifies in a real browser that a full voter journey makes only GET requests to those two origins, never puts notes in a URL or request body, sets no cookies, and stores nothing until the user opts in.

## Needs the owner (not changed by development sessions)
1. In the **user-site** repository (`samokarplus/samokarplus.github.io`): Settings → Pages → confirm the custom domain is `samo.karplus.org` and **Enforce HTTPS** is ticked.
2. Share and bookmark the `https://samo.karplus.org/common-ground/` URL, and use it as `E2E_BASE_URL` when testing the live site (`E2E_BASE_URL=https://samo.karplus.org/common-ground/ npm run e2e`).
3. Decide whether to add a `<link rel="canonical">` for the custom domain. It was not added, because it hard-codes a domain decision.

## Keeping Common Ground separate from `samo.karplus.org` (owner decision)
Nothing in this repository puts Common Ground on `samo.karplus.org`: there is no `CNAME` file. GitHub serves every project site of an account under that account's user-site custom domain, so `samokarplus.github.io/common-ground/` is forwarded to `samo.karplus.org/common-ground/` automatically. To make it fully separate, one of these account-level changes is needed (development sessions do not make them):
1. **Remove the custom domain from the user site** (`samokarplus/samokarplus.github.io` → Settings → Pages). Common Ground then lives at `https://samokarplus.github.io/common-ground/` again. This also stops `samo.karplus.org` from serving it, but affects anything else that domain serves.
2. **Give Common Ground its own domain**: add a `CNAME` file containing that domain to `docs/` in this repository, set the domain in this repository's Settings → Pages, and point its DNS at GitHub Pages. A project site with its own custom domain is no longer served under the user-site domain. A domain you own is required.
3. **Move the repository** to a different GitHub account or organization that has no custom domain (for example an organization created for Common Ground), then enable Pages there.
Tell a development session which option you choose so docs, links and the live-test URL can be updated. Until then, `E2E_BASE_URL=https://samo.karplus.org/common-ground/` is only the address the site currently resolves to.
