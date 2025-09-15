# templates/spec-template.md

# Feature Specification: WebOS Signage Slider (.ipk)

**Feature Branch**: `[001-webos-slider]`
**Created**: 2025-09-15
**Status**: Draft
**Input**: User description: "/specify membuat aplikasi .ipk untuk operasi sistem webos signage, menampilkan sliders text(HTML), image, video"

---

## Primary User Story

Sebagai **operator signage** atau **admin konten**, saya dapat menampilkan **serangkaian slide** berisi **teks (HTML)**, **gambar**, dan **video** pada perangkat **LG webOS Signage**, sehingga informasi dan promosi dapat diputar **berulang (loop)** sesuai urutan dan **durasi** yang ditentukan.

## Acceptance Scenarios

1. **Given** perangkat menyala dan aplikasi terbuka, **When** playlist berisi campuran teks/gambar/video dimuat, **Then** setiap slide tampil sesuai urutan dan **berpindah otomatis** setelah durasinya berakhir.
2. **Given** slide bertipe **teks (HTML)**, **When** HTML yang valid diberikan (tanpa script berbahaya), **Then** teks dirender dengan benar dan menyesuaikan ukuran layar.
3. **Given** slide bertipe **gambar**, **When** URL/asset gambar tersedia, **Then** gambar ditampilkan **penuh layar** (tanpa distorsi) dengan opsi **contain/cover** sesuai konfigurasi slide.
4. **Given** slide bertipe **video**, **When** file/stream video dapat diputar di perangkat, **Then** video diputar otomatis dengan **mute/unmute** sesuai konfigurasi dan kembali ke slide berikutnya saat selesai.
5. **Given** playlist memuat **durasi per slide**, **When** nilai berbeda ditetapkan, **Then** setiap slide menghormati durasi masing-masing (kecuali video yang default ke durasi asli bila tidak ditentukan).
6. **Given** koneksi jaringan terputus, **When** konten lokal tersedia, **Then** pemutaran tetap berjalan menggunakan aset **cache/lokal** sesuai kebijakan caching.
7. **Given** operator menekan tombol **Next/Prev** (remote/touch bila ada), **When** kontrol manual diizinkan, **Then** aplikasi berpindah slide secara manual tanpa mengganggu loop berikutnya.

## Edge Cases

* URL konten tidak dapat diakses / **HTTP error**.
* **Format/codec** video tidak didukung.
* Gambar beresolusi sangat besar → **downscale** diperlukan.
* HTML terlalu panjang → overflow/scroll vs auto-fit.
* **Kehabisan memori** saat preloading banyak media.
* **Loss of network** saat update playlist (fallback ke versi terakhir).

## Functional Requirements

* **FR-001**: Sistem **MUST** menampilkan slide **teks (HTML), gambar, video**.
* **FR-002**: Sistem **MUST** menjalankan **loop** berkelanjutan atas seluruh slide.
* **FR-003**: Sistem **MUST** menghormati **durasi per slide** (override opsional untuk video).
* **FR-004**: Sistem **MUST** mendukung **urutan** slide dari playlist.
* **FR-005**: Sistem **MUST** mendukung **navigasi manual** (Next/Prev) bila diaktifkan.
* **FR-006**: Sistem **MUST** memuat konten dari **konfigurasi** (file JSON lokal atau endpoint URL) \[NEEDS CLARIFICATION: sumber utama konten].
* **FR-007**: Sistem **MUST** menampilkan **fallback** (placeholder) ketika media gagal dimuat.
* **FR-008**: Sistem **MUST** melakukan **validasi HTML** agar aman (no inline script berbahaya) \[NEEDS CLARIFICATION: kebijakan sanitasi].
* **FR-009**: Sistem **MUST** mendukung **skala tampilan** (cover/contain) untuk gambar/video.
* **FR-010**: Sistem **MUST** mencatat **log kesalahan** pemuatan/pemutaran media.

## Non-Functional Requirements

* **NFR-001**: **Startup < 5 detik** pada perangkat target \[NEEDS CLARIFICATION: versi minimal webOS].
* **NFR-002**: **Smooth** transisi antar slide (target 60 FPS untuk transisi sederhana).
* **NFR-003**: **Stabil** dalam pemutaran panjang (8–12 jam nonstop).
* **NFR-004**: Penggunaan memori **terkendali** dan tidak bocor saat loop.

## Key Entities (konseptual)

* **Slide**: `type ∈ {text_html, image, video}`, `content` (string/URL), `duration`, `fitMode` (cover/contain), `mute` (video), `poster` (video opsional).
* **Playlist**: `items: Slide[]`, `loop: boolean`, `allowManualNav: boolean`.

## Review & Acceptance Checklist

* [ ] Tidak ada detail implementasi (teknologi, framework) dalam dokumen ini.
* [ ] Semua kebutuhan ditulis dalam bahasa bisnis dan dapat diuji.
* [ ] Semua **\[NEEDS CLARIFICATION]** telah didaftarkan untuk ditindaklanjuti.