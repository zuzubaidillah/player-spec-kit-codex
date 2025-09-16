
# templates/tasks-template.md

# Tasks: WebOS Signage Slider (.ipk)

**Input**: `templates/plan-template.md` + desain pendukung
**Prerequisites**: Spec & Plan selesai

> Format: `[ID] [P?] Deskripsi` — **\[P]** = dapat dikerjakan paralel (file berbeda, tanpa dependensi)

## Phase 3.1 — Setup

* [ ] **T001** Buat proyek EnactJS (tanpa UI framework), inisialisasi repo
* [ ] **T002 \[P]** Konfigurasi lint/format (ESLint, Prettier)
* [ ] **T003 \[P]** Siapkan `webos/appinfo.json` minimal + ikon
* [ ] **T004 \[P]** Tambahkan `config/playlist.json` contoh (campuran teks/gambar/video)

## Phase 3.2 — Tests First (Smoke/Contract)

* [ ] **T005 \[P]** Unit test util: validasi object `Slide` (jenis, durasi ≥ 0)
* [ ] **T006 \[P]** Unit test `useSlideTimer` (durasi, next/prev manual)
* [ ] **T007 \[P]** Contract test skema playlist (JSON Schema)

## Phase 3.3 — Core Components

* [ ] **T008** Implement `usePlaylist` (load lokal, validasi skema, error state)
* [ ] **T009 \[P]** Implement `Slider` (state indeks, loop, integrasi timer)
* [ ] **T010 \[P]** Implement `SlideItem` (switch by type, error fallback)
* [ ] **T011 \[P]** Implement `SlideText` (render HTML aman, aturan sanitasi)
* [ ] **T012 \[P]** Implement `SlideImage` (preload, cover/contain)
* [ ] **T013 \[P]** Implement `SlideVideo` (autoplay, mute/unmute, end → next)
* [ ] **T014** Wiring ke `App` + navigasi manual (remote key/touch) bila diaktifkan

## Phase 3.4 — Styling (CSS murni)

* [ ] **T015 \[P]** `styles/main.css`: fullscreen layout, alignment, fade transition
* [ ] **T016 \[P]** Responsif teks HTML (clamp/fit), handling overflow
* [ ] **T017 \[P]** State UI untuk error/loading (placeholder)

## Phase 3.5 — Robustness & Observability

* [ ] **T018 \[P]** Logging kesalahan pemuatan/pemutaran
* [ ] **T019 \[P]** Fallback saat jaringan gagal (pakai playlist lokal terakhir)
* [ ] **T020** Stress test loop 8 jam (monitor memori, stutter)

## Phase 3.6 — Packaging & Delivery

* [ ] **T021** Build production bundle
* [ ] **T022** Kemasi `.ipk` (tooling webOS)
* [ ] **T023** Deploy ke emulator/perangkat, verifikasi end-to-end

## Phase 3.7 — Polish

* [ ] **T024 \[P]** Dokumentasi `quickstart.md` (run, deploy, update konten)
* [ ] **T025 \[P]** Contoh playlist tambahan (berat/tinggi resolusi)
* [ ] **T026** Audit aksesibilitas dasar (kontras, label) & watchdog freeze sederhana

## Dependencies

* Tests (T005–T007) **sebelum** implementasi (T008+).
* `Slider` (T009) bergantung pada `useSlideTimer` (T006) & `usePlaylist` (T008).
* Packaging (T021–T023) setelah core stabil.

## After Tasks — Execution Hand-off

Setelah daftar tugas dihasilkan, **minta agen** untuk **mengeksekusi berurutan** (TDD lebih dulu), menjaga batasan: **EnactJS + CSS murni**, target **webOS Signage**.