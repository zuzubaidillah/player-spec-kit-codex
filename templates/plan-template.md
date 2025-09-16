# Implementation Plan: WebOS Signage Player (React/Vite)

Spec: `templates/spec-template.md`

## Summary

Player signage berbasis React 19 + Vite dengan dukungan fokus D‑pad (Enact Spotlight), pemutaran gambar dan video, fallback HLS via hls.js, logging ke localStorage, dan packaging `.ipk` untuk webOS.

## Architecture

- Runtime: React + Vite (plugin-legacy → target ES2019)
- Focus navigation: `@enact/spotlight`
- Video: `<video>` + hook `useVideoPlayer` (observabilitas + kontrol)
- Slideshow: `Slideshow.jsx` (auto-advance gambar; video advance via ended + watchdog)
- Logging: `src/lib/logStore.js` + `LogViewer.jsx`
- Packaging: `scripts/prepare-webos.mjs` + `ares-package` → `.ipk`

## Phases

1) Setup & Build
   - Vite + React + plugin-legacy; ESLint/Prettier; Vitest.
   - `appinfo.json` di root, ikon `icon-192.png` dan `icon-512.png`.
   - PWA manifest di `public/manifest.json`.

2) Playlist & Assets
   - Default: `DEFAULT_PLAYLIST` di `src/App.jsx` menunjuk aset `slide-00X.*` di root project.
   - `scripts/prepare-webos.mjs` menyalin `appinfo.json`, ikon, dan `slide-00X.*` ke `dist/` setelah build.
   - Opsi lanjutan: loader `public/playlist.json` atau sumber remote.

3) Komponen & Hooks
   - `Slideshow.jsx`:
     - Auto-advance gambar berdasarkan `duration` (detik) atau `defaultDuration`.
     - Advance video pada `ended`; watchdog stall (>8s tanpa progress) + maksimum 10 menit.
     - Kontrol D‑pad/keyboard: Left/Right, Space, Back/Escape.
     - Kiosk overlay minimal (judul + posisi).
   - `VideoPlayer.jsx`:
     - Autoplay: coba dengan suara → fallback muted jika diblokir; overlay unmute.
     - Integrasi `useVideoPlayer` untuk log/state (waiting, stalled, error, duration, time).
     - HLS fallback via `hls.js` (inject CDN jika browser tidak native HLS).
     - `object-fit` adaptif berdasar videoWidth/Height.
   - `LogViewer.jsx` + `logStore.js`: tampilkan/bersihkan log `playerLogs`.
   - `NavBar.jsx`: header opsional (kiosk menyembunyikan header).

4) Observability & Perf
   - Catat event transisi view (`perf`) dan semua event media penting.

5) Packaging & Delivery
   - Build: `npm run build:webos` (Vite build + post-process + copy aset).
   - Package: `npm run package:webos` → `.ipk` di `out/`.
   - Install/Launch: `npm run install:webos`, `npm run launch:webos` (id: `com.lg.app.signage`).

## Open Items / Next

- Text slide (HTML) aman dengan sanitasi (belum aktif di UI saat ini).
- Playlist eksternal via URL + fallback lokal saat offline.
- Bundling lokal `hls.js` (hindari CDN) untuk lingkungan tanpa internet.
- Test komprehensif untuk `Slideshow` dan `useVideoPlayer` (vitest + testing-library).

## Risks & Mitigations

- Autoplay bersuara diblokir: overlay unmute + set sistem audio via `luna://com.webos.audio` jika tersedia.
- HLS tidak native: fallback `hls.js` (cek `Hls.isSupported()`).
- Engine lama: plugin legacy + target `es2019` + polyfills (`whatwg-fetch`, `core-js`).

