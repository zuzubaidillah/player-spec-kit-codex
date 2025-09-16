# Agent Guide – WebOS Signage Player (React/Vite)

Peran: Mengerjakan spesifikasi dan rencana untuk aplikasi signage `.ipk` (LG webOS) berbasis React + Vite, dengan fokus ke pemutaran gambar/video yang stabil dan kompatibel pada engine webOS.

## Tujuan

- Memutar gambar dan video dalam loop, dukung navigasi D‑pad, dan logging kejadian media.
- Hasil akhir: paket `.ipk` siap install (`com.lg.app.signage`).

## Batasan & Prinsip

- Gunakan React 19 + Vite; fokus navigasi memakai `@enact/spotlight`.
- CSS murni untuk styling; hindari framework CSS besar.
- Prioritaskan stabilitas pemutaran, fallback pada kasus autoplay diblokir, dan kompatibilitas engine lama.

## Artefak Rujukan

- Spec: `templates/spec-template.md`
- Plan: `templates/plan-template.md`
- Tasks: `templates/tasks-template.md`

## Alur Eksekusi

1) Baca Spec → pahami fitur inti dan acceptance.
2) Baca Plan → pahami struktur komponen, hooks, build, dan packaging.
3) Eksekusi Tasks berurutan; tambahkan test saat menyentuh logic penting.
4) Uji di emulator/perangkat; pantau log error/stall dan perf.
5) Kemasi `.ipk` dan lengkapi catatan cara deploy.

## Kualitas & Logging

- Log ke localStorage key `playerLogs` (error media, waiting, stalled, sourcechange, perf transitions).
- Sediakan `LogViewer` untuk lihat/clear log.
- Gunakan watchdog untuk skip video yang macet; batasi durasi per item.

## Output yang Diharapkan

- Kode sumber: `src/components` (Slideshow, VideoPlayer, NavBar, LogViewer), `src/hooks` (useVideoPlayer, useSpotlightNavigation).
- `appinfo.json`, ikon `icon-192.png`/`icon-512.png`, dan aset `slide-00X.*` tersalin ke `dist/`.
- `.ipk` di `out/` + instruksi `ares-install` dan `ares-launch`.

Catatan Next:
- Aktifkan dukungan teks (HTML) dengan sanitasi sebelum rilis produksi.
- Pertimbangkan bundling lokal `hls.js` agar tidak tergantung CDN.

