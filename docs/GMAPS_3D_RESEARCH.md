# Google Maps Platform — Photorealistic 3D (`gmp-map-3d`) Research

## Key validity

Live test:

```
curl -sS "https://maps.googleapis.com/maps/api/js?key=$GOOGLE_MAPS_KEY&v=alpha&libraries=maps3d&loading=async"
```

Result: **HTTP 200**, response is valid JavaScript that bootstraps the loader and includes the key echoed inside the Load payload. No `InvalidKeyMapError` and no `RefererNotAllowedMapError`. The response references `"maps3d"` in the library list and schedules `common.js`, `maps3d.js`, `util.js`, `main.js` from `/maps-api-v3/api/js/64/9c-alpha/`.

Verdict: **Key is valid** for unreferred server-side fetches. However this does not guarantee browser-side rendering works — the Maps JS SDK enforces HTTP-referrer restrictions at runtime based on the key's configuration in Google Cloud Console. We cannot test browser referrer behaviour from curl.

## Required Google Cloud APIs/capabilities

For `<gmp-map-3d>` (the photorealistic 3D web component) to load, the Cloud project that owns this key must have the following APIs **enabled**:

1. **Maps JavaScript API** — baseline SDK.
2. **Map Tiles API** — the 3D tiles source that feeds `gmp-map-3d`.
3. **Places API (New)** — required if you use places-driven camera moves (e.g. `gmp-place-picker`, `searchByText`).
4. (Optional) **Geocoding API** — only if you resolve facility addresses to lat/lng.

Plus, for quota/billing:
- **Billing must be enabled** on the project. Photorealistic 3D is a billable product. Without billing, the Map Tiles API returns `REQUEST_DENIED`.

Key configuration in Cloud Console → APIs & Services → Credentials:
- **Application restrictions:** "HTTP referrers (web sites)". Add `http://localhost:*/*`, `http://localhost:8888/*`, and the Netlify production domain(s), e.g. `https://*.netlify.app/*` and any custom domain.
- **API restrictions:** restrict to the four APIs listed above — tighter keys are safer, especially since this is a hackathon repo.

## Recommended loader config

Using the official `@googlemaps/js-api-loader`:

```ts
import { Loader } from "@googlemaps/js-api-loader";

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  version: "alpha",          // 3D is alpha as of 2026-04
  libraries: ["maps3d", "places"],
});
await loader.importLibrary("maps3d");
```

Then in JSX:

```tsx
<gmp-map-3d
  center="29.7604,-95.3698,150"   // lat,lng,altitude (meters)
  tilt="67.5"
  heading="0"
  range="800"
  roll="0"
  default-ui-disabled
/>
```

Attributes (per the Maps 3D alpha docs):
- `center` — `"lat,lng,altitude"` string.
- `tilt` — 0 (top-down) to ~90° (horizon).
- `heading` — 0–360, clockwise from north.
- `range` — camera distance in meters.
- `roll` — rotation of the camera around its forward axis.
- `default-ui-disabled` — hides default controls.
- Listen for `gmp-click`, `gmp-centerchange`, `gmp-steadychange` events.
- For animated fly-to: call `map3d.flyCameraTo({ endCamera, durationMillis })` on the element reference.

**Register the custom elements** only once per app — calling `importLibrary("maps3d")` triggers registration. React does not treat `gmp-*` as native components, so in TS augment JSX:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmp-map-3d": any;
    }
  }
}
```

## Browser support caveats

- Requires **WebGL 2** and sufficient GPU. On low-end hardware Google serves a fallback raster map with no tilt.
- **Safari**: limited support for the 3D tiles format as of 2026-Q1. Works on Safari 17.4+ but camera transitions can stutter.
- **Firefox**: works with hardware acceleration; software rendering disables 3D.
- **iOS**: performance is uneven on older devices; recommend a 2D fallback.
- Requires a **secure context** (HTTPS, or `localhost`). Non-HTTPS embedding will silently fail.

## Runtime availability check

Before rendering `<gmp-map-3d>`, detect:

```ts
async function has3DSupport(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    await loader.importLibrary("maps3d");
    // If the custom element is registered, it's supported.
    return Boolean(customElements.get("gmp-map-3d"));
  } catch {
    return false;
  }
}
```

Also probe WebGL:

```ts
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2");
if (!gl) fallbackToStatic();
```

## Quotas / billing

- Photorealistic 3D Maps billing is per session (as of 2026). A "session" is a map load; moving the camera does not incur additional charges within the session.
- Free tier: first ~$200/month of Maps Platform usage is free. A hackathon demo is not a concern but do restrict the key.
- If billing is not enabled, the tiles simply do not load and the map renders a blank sky with no terrain.

## Fallback UX validation

The repo has not implemented the 3D inspection component yet (task #7 pending), but the plan is to:
1. Attempt `importLibrary("maps3d")`.
2. On failure (no WebGL2, library error, or `InvalidKeyMapError` in console), render a static satellite image from the Maps Static API (also gated on the same key) **or** a simple Leaflet/Mapbox 2D tile layer of the facility.
3. Show a subtle badge "2D fallback — 3D unavailable" so the demo viewer understands why they aren't seeing photorealistic terrain.

This is the right UX. Recommendation: make the fallback the *default render* when `prefers-reduced-motion: reduce` is set or when `navigator.hardwareConcurrency <= 4` — that way the demo never stutters on reviewer laptops.

## Action items for the frontend engineer

1. Confirm in Cloud Console that **Maps JavaScript API + Map Tiles API + Places API (New)** are enabled on the project that owns the key.
2. Add the demo domain(s) to the key's HTTP-referrer allowlist.
3. Load the SDK once via `js-api-loader` with `version: "alpha"`, `libraries: ["maps3d"]`, `loading: "async"`.
4. Gate the 3D component behind `has3DSupport()` and provide a `<StaticFallback />` sibling.
5. Do not commit the key into the built bundle in plaintext. Use `VITE_GOOGLE_MAPS_API_KEY` and restrict the key by referrer so that even if it's exposed client-side (which it must be), it's only usable from the allowed origins.
