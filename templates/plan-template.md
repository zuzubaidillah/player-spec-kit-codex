
# templates/plan-template.md

# Implementation Plan: WebOS Signage Slider (.ipk)

**Branch**: `[001-webos-slider]` | **Date**: 2025-09-15 | **Spec**: `templates/spec-template.md`

## Summary

Implementasi aplikasi signage **.ipk** untuk **webOS** menggunakan **EnactJS** dengan **CSS murni** (tanpa framework CSS). Aplikasi memutar **slide teks(HTML), gambar, video** berdasarkan playlist (JSON lokal/URL), mendukung durasi per slide, loop, dan navigasi manual opsional.

## Technical Context

* **Language/Version**: JavaScript (ES2022+)
* **Primary Dependencies**: **EnactJS** (tanpa library UI pihak ketiga), API webOS runtime bila diperlukan (key input, storage)
* **Styling**: **CSS murni** (BEM/utility ringan, tanpa framework)
* **Storage**: File lokal untuk contoh playlist; opsional fetch dari URL \[butuh klarifikasi]
* **Testing**: Unit (Jest), e2e smoke via emulator/perangkat
* **Target Platform**: **LG webOS Signage** \[NEEDS CLARIFICATION: versi minimal]
* **Performance Goals**: Transisi halus; video tanpa stutter
* **Constraints**: Offline-friendly (opsional), penggunaan memori rendah
* **Project Type**: Single (frontend-only)

## Project Structure (proposed)

```
src/
  components/
    Slider.js
    SlideItem.js
    SlideText.js
    SlideImage.js
    SlideVideo.js
  hooks/
    usePlaylist.js
    useSlideTimer.js
  styles/
    main.css
  App.js
  index.js
assets/
  images/  videos/
config/
  playlist.json   # contoh playlist lokal
webos/
  appinfo.json   # manifest aplikasi webOS
```

## Architecture & Design

* **Slider** mengelola state indeks, timer, dan transisi.
* **SlideItem** sebagai wrapper yang memilih renderer khusus.
* **SlideText/Image/Video** merender tipe konten spesifik.
* **usePlaylist** memuat dan memvalidasi playlist (lokal/URL).
* **useSlideTimer** menangani durasi per slide + kontrol manual.
* **CSS** fokus pada fullscreen layout, scaling (cover/contain), teks responsif.

## Build & Packaging

* Scaffold proyek menggunakan **Enact CLI**.
* Build production bundle.
* Buat **.ipk** dengan tooling webOS (contoh: `ares-package`) dan uji dengan `ares-launch` pada emulator/perangkat.

## Risks & Open Questions

* \[NEEDS CLARIFICATION] **Sumber playlist utama** (lokal vs remote) & kebijakan **caching**.
* \[NEEDS CLARIFICATION] **Versi minimal webOS** dan dukungan codec video.
* \[NEEDS CLARIFICATION] Ketersediaan **kontrol remote** (key codes) vs touch.

## Phase 0: Research

* Verifikasi dukungan codec video di webOS target.
* Tentukan kebijakan sanitasi HTML.
* Uji performa transisi & preloading pada perangkat nyata.

## Phase 1: Design Outputs

* `data-model.md`: Definisi `Slide` dan `Playlist` (konseptual)
* `contracts/`: Skema playlist JSON (JSON Schema) + contoh
* `quickstart.md`: Cara menjalankan di emulator & deploy ke perangkat

## Phase 2 (for /tasks): Task Planning Approach

* Generate tasks dari struktur di atas (tests → components → wiring → packaging).
* Tandai \[P] untuk pekerjaan berbeda file yang independen.

**STOP (sesuai /plan)**: Pembuatan `tasks.md` dilakukan oleh **/tasks**.
