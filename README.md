# KRESF — Koala Road Eye Safety Feature

**Year 9 STEM Research and Development project** exploring koala road safety, habitat connectivity and educational design.

KRESF comprises a companion website and an installable Progressive Web App (PWA), hosted publicly with GitHub Pages.

**Live links**
- [KRESF companion website](https://jondroso-ops.github.io/kresf-v2/)
- [Open the KRESF mobile app](https://jondroso-ops.github.io/kresf-v2/app/)

> **Educational demonstration only.** KRESF does not detect or track live koalas, validate road hazards, provide emergency dispatch or supply reliable driving instructions. Do not operate it while driving.

## Four interactive modules

| Module | What it demonstrates |
| --- | --- |
| **Co-Pilot HUD Map** | Example koala habitat corridors, map markers, optional browser GPS permission and a classroom-only driving simulation. |
| **Spot & Save** | Create a local observation record, optionally attach a photo, and access the saved record from the Guardian Profile. Photos are stored privately in the browser (IndexedDB). Users may choose **Save photo to phone** to download a separate copy, or delete the locally stored photo. No observations or photos are uploaded to a KRESF server. |
| **Habitat Lab** | Interactive **real WebGL 3D** wildlife-crossing scene with 3D terrain, elevated road, animated vehicles, mother koala and joey, wildlife fencing and fauna underpass. Rotate the camera by dragging and zoom with buttons, with a 2D SVG fallback when WebGL is unavailable. Press **Start Animation** to explore virtual warnings, speed reduction, exclusion fencing and an underpass. Initially the road sits at habitat grade without a portal; selecting fencing adds exclusion barriers, and selecting the underpass constructs a short raised crossing with sloped approaches and opens protected fence entrances. Combining both triggers a modelled crossing and five-second celebration/reset. Risk percentages are illustrative, not measured or predictive. |
| **Guardian Profile** | On-device observation history and photos, learning progress/XP, individual observation/photo deletion, delete-all controls and project QR links. |

### Classroom audio demonstration

The HUD simulation includes an **opt-in audio** demonstration, activated by the user. Its example zone has a 300 m radius:
- On simulated entry (distance **300 m or closer**): “Be careful, koala zone ahead.”
- While inside: a brief beep every 10 seconds, subject to browser audio support.
- On simulated exit (distance beyond the zone): “Thank you, you have left koalas zone.”

These are **simulated** warning events for learning, not verified hazard alerts. Browser text-to-speech availability varies by phone and browser.

## Installation and use

Open the [mobile app](https://jondroso-ops.github.io/kresf-v2/app/) using your phone browser. If your browser supports installing PWAs, use its **Install app** or **Add to Home Screen** option. Real-device Android/iOS installation and GPS behaviour should be checked before the school demonstration.

The app's shell, compiled Tailwind styles, QR generator and self-hosted WebGL renderer can work offline after caching. Map tiles remain online-only and external Leaflet resources may need connectivity on first installation. Cached navigation can fall back during network failures and temporary server errors, but offline operation is not guaranteed on every device. All locally saved records and photos are subject to the phone browser's storage availability and may disappear if browser data is cleared or the app is uninstalled. Download important photos separately.

## Hosting and release

- Repository: [jondroso-ops/kresf-v2](https://github.com/jondroso-ops/kresf-v2) (public, GitHub Free).
- GitHub Pages serves the repository's **`main` branch**, directory **`/(root)`**.
- The companion website is at `/`; the mobile PWA is at `/app/`.
- New changes should be proposed on separate branches through pull requests. The active `main` ruleset requires one approving review, code-owner review, resolution of review discussions and successful `smoke` and `browser` checks. Repository administrators have a configured **pull-request bypass**, so this is not an absolute owner-only approval guarantee.
- The repository's [CODEOWNERS](.github/CODEOWNERS) designates `@jondroso-ops`. Review requests and notification delivery depend on GitHub account/repository settings.
- Automated GitHub Actions test the source and browser flows. They do not replace mobile-device acceptance tests or a professional security assessment.

## Privacy, safety and limitations

- **No central user accounts or sighting database.** Observations, attached photos and progress use local IndexedDB; the app migrates older browser-local records where available. Data is not shared between phones.
- New photos are decoded and re-encoded to PNG before storage to strip original camera metadata. Browsers unable to decode a photo reject it instead of storing original metadata. **Previously saved photos are not automatically sanitised**; download or delete these manually as needed.
- The Guardian Profile permits individual observation/photo deletion and a delete-all control. Deleting browser-local data cannot remove downloaded copies or copies outside the device. GitHub Pages shares an origin with other pages under the same account; browser origin storage is not path-isolated.
- Optional geolocation requests browser permission. No location is intentionally transmitted to an app-owned server, but third-party mapping/CDN providers may receive network metadata.
- Wildlife-rescue contact information is informational only; verify current numbers before relying on them.
- The prototype is not a native app binary, an emergency service, a production navigation product, a safety-critical alert system or a physically validated 3D traffic simulator.
- External Leaflet and OpenStreetMap tile resources mean offline operation is partial. No guaranteed offline maps, real-time animal tracking or automatic emergency reporting is provided.
- The repository is public. Website source code can be viewed and downloaded; do not commit secrets, personal information, student identifying details, private photographs or API keys.

## Release verification and remaining acceptance work

Automated checks cover local and GitHub Pages subpath flows, save-failure recovery, data migration, camera metadata stripping, offline shell operation, the Habitat Lab and simulated audio. The live-site workflow performs a **health check on pull requests** and compares deployed website/app/worker/CSS/manifest bytes against the checked-out release on `main`; this reduces the risk of passing deployment checks against older published content.

**Outstanding:** Real Android/iOS installation, camera/gallery behaviour, GPS accuracy, audio playback, Safari and Firefox compatibility, old-photo metadata clean-up, and strict CSP (inline script/event-handler support remains necessary). These are not certified by Chromium CI.

## Security and responsible development

See [SECURITY.md](SECURITY.md) for vulnerability-reporting guidance and documented limitations.

The protected `main` branch, CODEOWNERS, CI checks and dependency updates reduce unauthorised or accidental modifications. They **do not** make public source confidential or prevent all security threats. Changes should be reviewed before deployment, including any third-party scripts and dependencies. No production security certification is claimed.

---
*KRESF is a research-and-development school prototype, not a live koala warning network.*
