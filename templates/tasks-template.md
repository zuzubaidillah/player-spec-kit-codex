# Tasks: WebOS Signage Player (React/Vite)

Input: `templates/plan-template.md`
Prerequisites: Spec & Plan disepakati

Format: `[ID] [P?] Deskripsi` — [P] = paralel (file berbeda, minim dependensi)

## A — Alignment & Setup

- [ ] T001 [P] Pastikan Vite + React + plugin-legacy terkonfigurasi (target `es2019`).
- [ ] T002 [P] ESLint/Prettier konsisten; Vitest + Testing Library siap.
- [ ] T003 [P] Validasi `appinfo.json` (id: `com.lg.app.signage`), ikon `icon-192.png`/`icon-512.png`.
- [ ] T004 [P] Verifikasi skrip `scripts/prepare-webos.mjs` menyalin `slide-00X.*` ke `dist/`.

## B — Core Player

- [ ] T010 Slideshow: auto-advance gambar (durasi per item), prev/next/pause/back via D‑pad.
- [ ] T011 VideoPlayer: autoplay with sound → fallback muted + overlay unmute; set volume webOS (opsional).
- [ ] T012 HLS fallback: injeksi `hls.js` hanya jika tidak native; bersihkan saat unmount.
- [ ] T013 Watchdog: skip video jika stall >8s; hard cap 10 menit per item.

## C — Observability & UX

- [ ] T020 [P] Logging: event media (loadedmetadata/waiting/stalled/error) dan `perf` transition ke localStorage.
- [ ] T021 [P] LogViewer: UI untuk lihat/clear log (`playerLogs`).
- [ ] T022 [P] Kiosk overlay: tampilkan judul + posisi item; sembunyikan header di kiosk mode.

## D — Playlist & Content

- [ ] T030 [P] Default playlist: `DEFAULT_PLAYLIST` menunjuk `slide-00X.*` (png/jpg/mp4) di root project.
- [ ] T031 [P] Contoh `public/playlist.json` + dokumentasi struktur slide `{ id,title,src,type,duration?,poster?,fit? }`.
- [ ] T032 Loader eksternal (opsional): muat dari URL dan normalisasi; fallback ke playlist lokal saat gagal.

## E — Tests

- [ ] T040 [P] Unit `useVideoPlayer`: event/error/state dasar; mock `<video>`.
- [ ] T041 Slideshow: advance gambar, panggil `onEnded` video → next; kontrol keyboard.
- [ ] T042 E2E ringan (jsdom): render playlist campuran dan pastikan elemen muncul.

## F — Packaging & Delivery

- [ ] T050 Build: `npm run build:webos` dan validasi hasil `dist/` (ikon, appinfo, assets tersalin).
- [ ] T051 Package: `npm run package:webos` → `.ipk` di `out/`.
- [ ] T052 Deploy: install + launch pada emulator/perangkat; smoke test loop.

## G — Next (Opsional)

- [ ] T060 Text slide (HTML) + sanitasi (DOMPurify atau setara) + style responsif.
- [ ] T061 Bundling lokal `hls.js` (hindari CDN) untuk lingkungan tanpa internet.
- [ ] T062 Placeholder/error UI untuk gambar/video gagal.

## Dependencies

- B setelah A; C/D/E paralel setelah B sebagian tersedia; F setelah build stabil.

