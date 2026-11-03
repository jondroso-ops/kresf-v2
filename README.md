# KRESF v2 — Koala Road Eye Safety Feature

Year 9 STEM educational demonstration and installable Progressive Web App (PWA).

## Deploy with GitHub Pages

1. Create a new **public** GitHub repository called `kresf-v2` under `jondroso-ops`. Public is necessary for GitHub Pages on the Free plan; do not upload sensitive information.
2. Upload the files in this archive into the **repository root** (not inside a subfolder). Commit to `main`.
3. Open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, **main**, **/(root)**, and **Save**.
4. After GitHub reports successful deployment, open `https://jondroso-ops.github.io/kresf-v2/` and test the four navigation views, QR codes, optional GPS permission, map, and install option on mobile.

## Product status and limitations

- Educational prototype: example habitat corridor markers and illustrative risk scores are **not** real-time wildlife hazard intelligence or verified speed-limit guidance.
- Map requires external Leaflet JavaScript/CSS and OpenStreetMap tile services. Styling and QR code script also load externally. Offline operation is therefore partial.
- Sightings and progress are saved **locally in the browser**; no central database, account service, or public cross-user reporting is provided.
- GPS permission is optional and browser-controlled. No location is intentionally sent to an app-owned server; map tile requests and third-party CDNs may receive network metadata.
- This is not a native Android/iOS binary, emergency service, navigation product, or safety-critical alert system. Do not operate or interact with it while driving.
- No custom domain, monitoring, analytics, server backend or paid service is configured.

## Security

Review content before publishing to a public repository. Do not add secrets, personal data or API keys. Use HTTPS and keep third-party dependencies updated. No production security audit has been completed.
