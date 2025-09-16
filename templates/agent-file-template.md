# templates/agent-file-template.md

# Agent Guide – WebOS Signage Slider (.ipk)

**Peran Anda**: Agen pengembang yang mengeksekusi spesifikasi dan rencana untuk membangun aplikasi signage **.ipk** (LG webOS) menggunakan **EnactJS** dan **CSS murni** (tanpa framework CSS).

## Tujuan

* Implementasi pemutar **slider** untuk **teks(HTML)**, **gambar**, **video** dengan **durasi** per slide, **loop**, dan **kontrol manual** opsional.
* Hasil akhir: **paket .ipk** siap diinstal pada perangkat webOS.

## Batasan & Prinsip

* **Wajib**: EnactJS; **Dilarang**: framework CSS pihak ketiga.
* Ikuti **Spec** (WHAT/WHY), rujuk **Plan** (HOW), kerjakan **Tasks** (DO).
* Jika ada ketidakjelasan, tandai **\[NEEDS CLARIFICATION]** dan ajukan pertanyaan, jangan berasumsi liar.
* Jaga performa: transisi halus, video lancar, memori stabil.

## Artefak Rujukan

* Spec: `templates/spec-template.md`
* Plan: `templates/plan-template.md`
* Tasks: `templates/tasks-template.md`

## Alur Eksekusi yang Diarahkan

1. Baca **Spec** → pahami fitur & kriteria penerimaan.
2. Baca **Plan** → pahami struktur, komponen, dan packaging.
3. Kerjakan **Tasks** secara berurutan (TDD pada bagian yang memungkinkan).
4. Uji pada emulator/perangkat; catat temuan performa & stabilitas.
5. Kemasi **.ipk** dan serahkan artefak + dokumentasi.

## Kualitas & Logging

* Tambahkan logging untuk error pemuatan/pemutaran.
* Laporkan isu dengan langkah reproduksi dan dugaan akar masalah.

## Output yang Diharapkan

* Kode sumber dengan struktur sesuai Plan.
* `webos/appinfo.json`, contoh `config/playlist.json`.
* Paket **.ipk** hasil build + instruksi pemasangan.
* Catatan pengujian (durasi loop panjang, codec, jaringan).

*Siap mengeksekusi? Mulai dari T001, pastikan test/kontrak dibuat lebih dulu.*
