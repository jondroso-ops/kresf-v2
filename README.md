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
| **Habitat Lab** | Interactive wildlife-crossing story. Press **Start Animation** and experiment with virtual warnings, lower speeds, exclusion fencing and a fauna underpass. Combining fencing and the underpass animates a modelled safe crossing, followed by a five-second celebration and reset. The risk numbers are illustrative, not measured results. |
| **Guardian Profile** | Local observation history, learning progress/XP and project QR links. |

### Classroom audio demonstration

The HUD simulation includes an **opt-in audio** demonstration, activated by the user. Its example zone has a 300 m radius:
- On simulated entry (distance **under 300 m**): “Be careful, koala zone ahead.”
- While inside: a brief beep every 10 seconds, subject to browser audio support.
- On simulated exit (distance beyond the zone): “Thank you, you have left koalas zone.”

These are **simulated** warning events for learning, not verified hazard alerts. Browser text-to-speech availability varies by phone and browser.

## Installation and use

Open the [mobile app](https://jondroso-ops.github.io/kresf-v2/app/) using your phone browser. If your browser supports installing PWAs, use its **Install app** or **Add to Home Screen** option. Real-device Android/iOS installation and GPS behaviour should be checked before the school demonstration.

The app's shell can be available offline after it is cached, but map tiles and externally loaded libraries may need internet access. All locally saved records and photos are subject to the phone browser's storage availability and may disappear if browser data is cleared or the app is uninstalled. Download important photos separately.

## Hosting and release

- Repository: [jondroso-ops/kresf-v2](https://github.com/jondroso-ops/kresf-v2) (public, GitHub Free).
- GitHub Pages serves the repository's **`main` branch**, directory **`/(root)`**.
- The companion website is at `/`; the mobile PWA is at `/app/`.
- New changes should be proposed on separate branches through pull requests. The active `main` ruleset requires one approving review, code-owner review, resolution of review discussions and successful `smoke` and `browser` checks. Repository administrators have a configured **pull-request bypass**, so this is not an absolute owner-only approval guarantee.
- The repository's [CODEOWNERS](.github/CODEOWNERS) designates `@jondroso-ops`. Review requests and notification delivery depend on GitHub account/repository settings.
- Automated GitHub Actions test the source and browser flows. They do not replace mobile-device acceptance tests or a professional security assessment.

## Privacy, safety and limitations

- **No central user accounts or sighting database.** Observations and progress use local browser storage; optional photos use IndexedDB. Data is not shared between phones.
- Optional geolocation requests browser permission. No location is intentionally transmitted to an app-owned server, but third-party mapping/CDN providers may receive network metadata.
- Wildlife-rescue contact information is informational only; verify current numbers before relying on them.
- The prototype is not a native app binary, an emergency service, a production navigation product or a safety-critical alert system.
- External Leaflet/Map tile/CDN resources mean offline operation is partial. No guaranteed offline maps, real-time animal tracking or automatic emergency reporting is provided.
- The repository is public. Website source code can be viewed and downloaded; do not commit secrets, personal information, student identifying details, private photographs or API keys.

## Security and responsible development

See [SECURITY.md](SECURITY.md) for vulnerability-reporting guidance and documented limitations.

The protected `main` branch, CODEOWNERS, CI checks and dependency updates reduce unauthorised or accidental modifications. They **do not** make public source confidential or prevent all security threats. Changes should be reviewed before deployment, including any third-party scripts and dependencies. No production security certification is claimed.

---
*KRESF is a research-and-development school prototype, not a live koala warning network.*
