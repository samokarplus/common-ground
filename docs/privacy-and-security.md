# Privacy and security

## What stays on your device

| Data | Default | With opt-in |
| --- | --- | --- |
| Help Me Vote research guide (marks and notes) | Page memory only; gone on reload | Browser storage (`cg-vote-guide`) until you delete it |
| Values reflections | Page memory | Browser storage (`cg-values`) |
| Debate text | Page memory | — |
| Reading list (document IDs) | Browser storage (`cg-saved`) | — |

Everything can be exported or deleted from the Privacy page; the research guide also has its own print, download, and delete controls. Nothing syncs across devices.

## What we never collect

- No address, ZIP code, precinct, or location. We don't use IP or device location to guess where you vote.
- No accounts, analytics, ads, tracking pixels, or third-party fonts.
- No political profiling. Notes and reflections never leave your browser, and nothing appears in shareable URLs.

## Network requests

The Content Security Policy allows connections only to the site itself and `www.federalregister.gov`. GitHub Pages serves the site and may keep standard request logs under GitHub's policies. Links to official election sites open those sites directly.

## Security practices

- External data is validated with schemas before use; source URLs are pinned to expected official hosts.
- React escapes all text; no raw HTML from external data is rendered.
- `npm run scan` checks source and the published build for keys, tokens, private paths, and personal email addresses, and fails the build pipeline on findings.
- No secrets exist in this repository. The scheduled workflow uses only GitHub's built-in token, scoped to this repository.
- The private server beta is a separate project and is never merged here.
