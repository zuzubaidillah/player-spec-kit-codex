# Catatan Hasil & Kendala

Dokumen ini merangkum hasil implementasi T001–T014, temuan saat uji coba, serta kendala terkait media/codec dan performa transisi.

## Ringkasan Implementasi
- T001–T004: Proyek Vite + React dengan Enact Spotlight, ESLint/Prettier, `appinfo.json` dan `public/appinfo.json`, serta `public/playlist.json`.
- T005–T007: Konfigurasi Vitest + Testing Library, baseline test (`App`) dan TODO untuk komponen/hook.
- T008–T014: Hook `useVideoPlayer` dan `useSpotlightNavigation`, komponen UI, wiring App + navigasi manual (D‑pad), dan logging performa transisi.

## Media/Codec: Log Error
- Player mencatat event media (loadedmetadata, waiting, stalled) dan error melalui `useVideoPlayer` ke localStorage (`playerLogs`).
- Contoh sumber pada `playlist.json`:
  - `video/mp4` (Big Buck Bunny, Sintel) umumnya didukung luas.
  - HLS (`application/vnd.apple.mpegurl`) tidak didukung native di banyak browser desktop non‑Safari. Pada lingkungan tersebut, playback dapat gagal dengan error serupa `MEDIA_ERR_SRC_NOT_SUPPORTED`.
- Cara memeriksa:
  1. Jalankan app, mainkan setiap item.
  2. Buka tab Logs (atau komponen LogViewer) untuk melihat entri terbaru.
  3. Entri error memuat `code` dan `message` hasil dari `HTMLMediaElement.error`.

## Performa Transisi
- Setiap perpindahan view (`home` ⇄ `player` ⇄ `logs`) diukur menggunakan `requestAnimationFrame` setelah render dan dicatat sebagai `type=perf` dengan `durationMs`.
- Interpretasi:
  - Nilai kecil (<16ms) berarti transisi cukup ringan (<=1 frame pada 60Hz).
  - Nilai >50–100ms dapat menandakan beban render/rehydration yang perlu dioptimalkan (mis. jumlah item playlist, gambar belum di-cache, dll.).

## Navigasi Manual (D‑pad)
- `useSpotlightNavigation` mengelola indeks fokus dengan Arrow Keys dan Enter, mendukung wrap‑around.
- App menambahkan handler global untuk ESC/Backspace sebagai Back.
- `data-spotlight-container` digunakan pada kontainer halaman dan komponen agar kompatibel dengan Enact Spotlight.

## Saran Lanjutan
- Tambah dukungan HLS via `hls.js` saat target browser tidak mendukung HLS native (opsional untuk non‑webOS).
- Tambah buffering UI (progress bar) dan indikator jaringan.
- Melengkapi test TODO (komponen & hook) untuk menutup skenario kontrol playback dan navigasi fokus.

## Cara Mengekspor Log
- Log tersimpan di localStorage key `playerLogs`.
- Gunakan tombol Clear/Refresh di LogViewer atau ambil manual via DevTools: `JSON.parse(localStorage.getItem('playerLogs') || '[]')`.
