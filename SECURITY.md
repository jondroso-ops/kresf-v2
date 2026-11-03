# KRESF Security Policy

KRESF is an **educational prototype**, not a production wildlife-warning or emergency-dispatch system. Do not use it while driving.

## Supported release
Only the latest `main` GitHub Pages deployment receives fixes. Please do not share private contact details, passwords, GPS records or photographs in public issues.

## Vulnerability reporting
Do not publish exploit steps or personal data in a public issue. Use GitHub's **Report a vulnerability** / private vulnerability reporting if enabled. Otherwise contact the repository owner privately through an existing trusted channel. Do not submit any sensitive data in this repository.

## Security boundaries
- Website: static HTML/JS served through GitHub Pages; no server endpoints or accounts.
- Browser-local sighting records and XP are **not centrally stored**; avoid storing real personal data.
- Demo GPS coordinates are optional and must never be interpreted as verified wildlife-hazard signals.
- Remote libraries and OpenStreetMap tiles rely on third parties; these are not trusted sources of emergency advice.
- The public repository cannot prevent visitors from reading, cloning, downloading or forking published source code.
- Changes to `main` should be merged only after checks, source review and owner approval.

## Maintainer hardening checklist
1. Enable strong authentication/passkeys and 2FA.
2. Restrict repository collaborators and GitHub App permissions.
3. Protect `main` with a ruleset requiring PRs and the `smoke` and `browser` checks; prevent force pushes/deletion; apply to administrators if feasible.
4. Set GitHub Actions `GITHUB_TOKEN` default to read-only and require approvals for untrusted contributors.
5. Enable dependency alerts, secret scanning / push protection where available, and private vulnerability reporting.
6. Maintain offline backups of source and school deliverables and review repository audit/security notifications.
7. Do not put secrets, API keys, student identifying information, real sighting photos or home GPS coordinates into the public repository.

## Known limitations
A static PWA cannot guarantee offline map tiles, real animal detection, rescue dispatch, GPS integrity or information-security assurances against a compromised device or extension.
