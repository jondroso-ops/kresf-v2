# KRESF v3 — Rectification and Acceptance

Educational Year 9 Research & Development prototype. **Not for use while driving, emergency dispatch, or real wildlife safety decisions.**

## Architecture
- `/` — public companion website (educational landing page and rescue contacts)
- `/app/` — standalone mobile PWA with separate manifest and service-worker scope
- `icon-192.png` and `icon-512.png` — shared original icons
- Published through GitHub Pages from `main` after review and approval

## Changes staged on development branch
- Retains the four original PWA modules; separates companion website and mobile experience.
- Labels proximity radius and Habitat Lab calculations as demonstrations, not verified hazard intelligence.
- Removes live GPS audio warnings and misleading safe-zone language.
- Restores the last GPS position after leaving drive simulation, and requests ongoing GPS permission only after the user taps GPS.
- Adds a local photo preview and clear control; photos are **not stored or transmitted**.
- Adds opt-in real-GPS or default GPS-free classroom demonstration recording; demonstration records contain no location.
- Adds three local XP achievement badges (not community rankings).
- Adds a simple animated koala crossing illustration with reduced-motion support.
- Adds separate website/app QR targets.
- Creates a dedicated PWA manifest and app-scoped offline shell cache.
- Retires the old root-site service-worker cache.

## Automated source checks
- Added `tests/smoke.test.mjs` and GitHub Actions workflow `.github/workflows/kresf-smoke.yml`.
- Source parsing and route/privacy assertions passed in the connected GitHub review session; the workflow run itself still requires GitHub status confirmation.
- These checks do not simulate an actual browser or guarantee offline resource availability.

## Mandatory tests before merging
- [ ] Desktop browser: companion website navigation, responsive layout and app button.
- [ ] Desktop/mobile: app map, four modules, corridor selector and simulator start/stop.
- [ ] Check the companion QR resolves to `/app/`, and the PWA's two QR codes resolve to `/` and `/app/`.
- [ ] Test GPS permission allow/deny and simulated-versus-real-position switch.
- [ ] Test photo preview, clear, and verify nothing is uploaded or saved.
- [ ] Test GPS-free classroom demonstration reporting, then GPS-backed recording with permission.
- [ ] Test local sighting persistence, XP and badges; test browser storage disabled.
- [ ] Install the PWA from Android Chrome where supported and open from home screen.
- [ ] Install from iPhone Safari using Share > Add to Home Screen and reopen.
- [ ] Open offline after online installation: cached shell should load; **The service worker attempts to cache external scripts and CSS; first-load failures or browser cache restrictions can still prevent full offline operation**.
- [ ] Confirm the old root app's service worker no longer serves stale content.
- [ ] Check external QR script failure fallback and external map/CDN service failures.
- [ ] Check reduced-motion, zoom, contrast and touch-target usability.
- [ ] Verify official WIRES/RSPCA information again before printing a permanent poster.

## Known limitations / deferred work
1. **Offline feature parity not verified**: Leaflet, Tailwind and QR JavaScript load from external CDNs. The app service worker attempts dependency caching, but a successful offline installation and launch have not been browser-tested; map tiles remain network-only.
2. No real wildlife detection, verified hotspots, official road speeds or safety clearance.
3. Sighting logs and XP are browser-local; no sending to authorities, real leaderboard or cross-device synchronization.
4. QR scanning, iOS/Android installation, GPS accuracy, visual layout and native device behaviour have not yet been device-tested.
5. The new site design is newly authored, rather than pixel-for-pixel reproduction of the original Netlify site.
6. No RSPCA emergency telephone number is claimed until independently validated.

## Release procedure
1. Run all relevant tests and capture dated screenshots.
2. Review and approve the draft pull request.
3. Merge into `main`, confirm GitHub Pages deployment and check both URLs.
4. Update the laminated poster with distinct verified QR codes; physically test before print.

## Evidence
Original school concept, NotebookLM planning history, research report, poster and GitHub v2 app were reviewed before changes. Research claims and simulator percentages are not represented as measured scientific results.
