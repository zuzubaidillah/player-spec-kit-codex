# templates/spec-template.md

# Feature Specification: WebOS Signage Player (React/Vite)

Status: Draft (disesuaikan dengan implementasi berjalan)
Input: “Aplikasi .ipk webOS signage memutar gambar dan video berulang.”

---

## Primary User Story

Sebagai operator signage, saya dapat menampilkan serangkaian slide berisi gambar dan video pada perangkat LG webOS Signage sehingga informasi dapat berputar berulang sesuai urutan dan durasi yang ditentukan.

Catatan: Dukungan teks (HTML) belum diaktifkan di aplikasi saat ini dan menjadi kandidat lanjutan.

## Acceptance Scenarios

1) Given aplikasi terbuka, When playlist berisi campuran gambar/video dimuat, Then setiap item tampil sesuai urutan dan berpindah otomatis (gambar via durasi, video via selesai/ended).
2) Given item bertipe gambar, When aset tersedia, Then gambar tampil layar penuh tanpa distorsi dengan opsi contain/cover otomatis (portrait → contain, landscape → cover).
3) Given item bertipe video, When file/stream didukung, Then video autoplay; jika autoplay dengan suara diblokir, player jatuh ke mode muted dan menampilkan overlay untuk unmute dengan satu gestur (Enter/OK/pointer).
4) Given durasi khusus per gambar, When durasi diisi, Then gambar menghormati durasi tersebut; video default mengikuti durasi media.
5) Given kendala jaringan, When aset lokal tersedia, Then player tetap berjalan menggunakan aset lokal yang sudah dibundel.
6) Given kendala codec/format, When pemutaran gagal, Then error dicatat di log dan player melanjutkan item berikutnya.

## Edge Cases

- URL tidak dapat diakses/timeout atau 404.
- Codec video tidak didukung; HLS (m3u8) butuh fallback di non-Safari/non-native.
- Gambar ekstrem (resolusi sangat besar) → waktu decode lama.
- Autoplay with sound diblokir sampai ada user gesture.
- Stalled buffering/bitrate drop selama streaming.

## Functional Requirements (selaras implementasi)

- FR-001: Player MUST memutar gambar dan video dalam loop.
- FR-002: Gambar auto-advance berdasarkan durasi; video advance pada event ended atau watchdog (maks 10 menit atau stall >8s).
- FR-003: Object-fit gambar/video: contain/cover adaptif; opsi per-item `fit` bila tersedia.
- FR-004: Navigasi manual dengan remote/keyboard: Left/Right (Prev/Next), Space (Pause/Resume), Back/Escape (keluar/ kembali view).
- FR-005: Logging MUST mencatat event media (loadedmetadata, waiting, stalled, error) ke localStorage (`playerLogs`) dan dapat ditinjau via Log Viewer.
- FR-006: Sumber playlist default: daftar lokal terdefinisi di kode (`DEFAULT_PLAYLIST` di `src/App.jsx`) dengan aset `slide-00X.*` di root project; disalin ke `dist/` oleh skrip build.
- FR-007: Optional: HLS fallback menggunakan `hls.js` jika tidak didukung native.
- FR-008 (TODO): Dukungan teks (HTML) aman (sanitasi) sebelum diaktifkan produksi.

## Non-Functional Requirements

- NFR-001: Target engine lama via Vite Legacy (ES2019) agar kompatibel dengan webOS browser engine umum.
- NFR-002: Transisi view ringan; pengukuran performa navigasi dicatat sebagai log `perf` (durasi ms) untuk observabilitas.
- NFR-003: Stabil untuk pemutaran panjang (8–12 jam) tanpa kebocoran memori.

## Entities (operasional)

- Slide: `{ id, title, src, type, duration?, poster?, fit? }` dengan `type ∈ { image/*, video/*, application/vnd.apple.mpegurl, (text/html - TODO) }` dan `duration` dalam detik untuk gambar.
- Playlist: `items: Slide[]` dalam urutan tampil.

## Review & Acceptance Checklist

- [ ] Gambar dan video berputar sesuai urutan dengan auto-advance tepat.
- [ ] Overlay unmute muncul saat autoplay bersuara diblokir; satu gestur mengaktifkan suara dan mencoba set sistem audio webOS.
- [ ] Log kesalahan/kejadian media tercatat dan dapat ditinjau di Log Viewer.
- [ ] Build dan packaging `.ipk` berjalan menggunakan skrip yang tersedia.
- [ ] Catatan: Dukungan teks (HTML) ditandai sebagai TODO sebelum produksi.
