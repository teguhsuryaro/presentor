# UI/UX Revamp & Feature Refinement

## Latar Belakang

Saya sudah memiliki website yang berfungsi dengan baik secara umum, namun saya masih kurang puas dengan kualitas UI/UX yang ada saat ini.

Sebagai referensi desain, saya terinspirasi dari tampilan dashboard pada gambar yang saya lampirkan. Saya ingin mengadopsi tema visual, tata letak, dan nuansa desain dari referensi tersebut ke seluruh halaman website.

### Catatan Penting
Saya **tidak ingin melakukan redesign total** atau mengubah alur kerja yang sudah ada.

Fokus perubahan adalah:

- Mengadopsi tema visual yang lebih modern dan profesional.
- Menyesuaikan warna, spacing, typography, card design, dan layout.
- Membuat tampilan lebih clean, soft, dan konsisten.
- Mempertahankan seluruh fitur yang sudah berjalan.
- Menyesuaikan desain baru dengan struktur halaman yang sudah ada.

Referensi tersebut hanya digunakan sebagai inspirasi untuk:
- Warna
- Tata letak
- Komponen UI
- Hierarki informasi
- Kesan visual secara keseluruhan

---

# Revisi Global

## Navigasi Browser

Perhatikan fungsi tombol **Back (Go Back)** pada browser.

Pastikan seluruh perubahan yang dilakukan tidak mengganggu perilaku navigasi browser.

Kriteria:

- Tombol Back harus tetap berfungsi dengan normal.
- Tidak boleh terjadi redirect yang membingungkan.
- Tidak boleh ada halaman yang terjebak dalam loop navigasi.
- Riwayat halaman harus tetap konsisten dan sesuai ekspektasi pengguna.

---

# Dashboard

## 1. Perbaikan Popup Pembuatan Sesi

Saat ini popup pembuatan sesi masih terlihat kurang menarik dan kurang nyaman digunakan.

Perbaikan yang diharapkan:

- Gunakan desain yang lebih modern dan konsisten dengan tema baru.
- Perhalus tampilan placeholder dan input field.
- Tingkatkan spacing dan visual hierarchy.
- Buat tampilan lebih clean dan profesional.

### Field yang Dibutuhkan

Hapus field:

- Event/Kegiatan

Field yang digunakan cukup:

1. Nama Sesi (Wajib)
2. Deskripsi (Opsional)
3. Salin Peserta

Tidak perlu menambahkan field lain.

---

## 2. Penyederhanaan Ringkasan Dashboard

Saat ini terdapat 4 kartu statistik pada bagian atas dashboard:

- Total Sesi
- Total Peserta
- Total Hadir
- Kehadiran

Saya hanya membutuhkan:

- Total Sesi
- Kehadiran

Silakan hapus kartu lainnya agar tampilan lebih fokus dan tidak terlalu ramai.

---

## 3. Perbaikan Export PDF

Saat pengguna mengunduh laporan PDF:

### Tambahkan Deskripsi Sesi

Tampilkan informasi deskripsi sesi yang dimasukkan saat pembuatan sesi.

Ketentuan:

- Jika deskripsi tersedia → tampilkan deskripsi tersebut.
- Jika deskripsi kosong → tampilkan tanda "-".

---

### Tambahkan Waktu Download

Tambahkan informasi:

- Tanggal download
- Bulan download
- Tahun download
- Jam download

Tujuannya agar pembaca mengetahui kapan dokumen tersebut dihasilkan.

Contoh:

Download pada:
23 Juni 2026, 14:35 WIB

---

### Kerapihan Layout PDF

Rapikan tata letak informasi pada laporan PDF agar lebih mudah dibaca.

Contoh perbaikan:

- Alignment yang lebih konsisten
- Spacing yang lebih rapi
- Informasi lebih terstruktur

Namun apabila perubahan tersebut membuat implementasi menjadi terlalu kompleks atau tidak memberikan peningkatan yang signifikan terhadap kualitas dokumen, maka bagian ini dapat diabaikan.

---

# Statistik

## 1. Perbaikan Fungsionalitas

Saat ini masih terdapat beberapa komponen statistik yang belum berfungsi dengan benar.

Tugas:

- Identifikasi seluruh data statistik yang tidak berjalan.
- Perbaiki agar seluruh statistik menampilkan data yang valid.
- Pastikan data selalu ter-update secara real-time sesuai kondisi terbaru.

---

## 2. Penyederhanaan Statistik Utama

Saat ini terdapat 4 kartu statistik:

- Total Sesi
- Total Peserta
- Total Kehadiran
- Rata-rata Hadir

Saya hanya membutuhkan:

- Total Sesi
- Rata-rata Hadir

Silakan hapus kartu lainnya.

---

## 3. Sinkronisasi Data

Pastikan seluruh data statistik:

- Sinkron dengan Dashboard.
- Menggunakan sumber data yang sama.
- Selalu mengikuti perubahan terbaru yang terjadi pada sistem.
- Tidak menampilkan data yang berbeda antara halaman Dashboard dan Statistik.

---

# Riwayat Aktivitas

## Perbaikan Presensi Manual

Saat ini alur presensi manual adalah:

1. Panitia menekan tombol "Presensi Manual".
2. Checkbox muncul pada setiap mahasiswa.
3. Setiap checkbox yang diklik langsung menyimpan kehadiran.
4. Setiap klik checkbox langsung menghasilkan satu aktivitas pada Riwayat Aktivitas.

Masalah:

Jika panitia mencentang banyak mahasiswa, maka Riwayat Aktivitas akan dipenuhi oleh banyak log yang sebenarnya berasal dari satu proses presensi yang sama.

---

## Alur Baru yang Diinginkan

Ubah alur menjadi:

1. Panitia menekan tombol "Presensi Manual".
2. Checkbox muncul pada setiap mahasiswa.
3. Panitia memilih mahasiswa yang hadir.
4. Data belum langsung disimpan.
5. Panitia menekan tombol "Konfirmasi".
6. Setelah tombol Konfirmasi ditekan:
   - Kehadiran seluruh mahasiswa yang dipilih diperbarui sekaligus.
   - Sistem menyimpan perubahan secara batch.
   - Riwayat Aktivitas hanya membuat satu log aktivitas.

---

## Contoh Riwayat Aktivitas

Yang diinginkan:

"Panitia melakukan presensi manual untuk 18 peserta."

Bukan:

- Peserta A hadir
- Peserta B hadir
- Peserta C hadir
- Peserta D hadir
- dan seterusnya

Tujuannya agar Riwayat Aktivitas tetap bersih dan mudah dibaca.

---

# Manajemen Akun

## Perbaikan Dropdown Menu

Saat ini setiap akun ditampilkan di dalam card/kotak.

Masalah:

Ketika tombol tiga titik (⋮) ditekan, dropdown menu yang muncul terpotong oleh container/card pembungkus sehingga isi menu tidak terlihat secara penuh.

Hal ini sangat mengganggu pengalaman pengguna.

---

## Perbaikan yang Diharapkan

Pastikan dropdown:

- Selalu tampil secara penuh.
- Tidak terpotong oleh parent container.
- Memiliki z-index yang benar.
- Dapat muncul di atas elemen lain apabila diperlukan.
- Tetap responsif pada berbagai ukuran layar.

Periksa kemungkinan penggunaan:

- overflow: hidden
- positioning
- z-index

yang menyebabkan dropdown terpotong, lalu perbaiki implementasinya.

---

# Hasil Akhir yang Diharapkan

Setelah seluruh perubahan selesai:

- UI terlihat modern, clean, dan profesional.
- Seluruh halaman memiliki konsistensi visual.
- Dashboard lebih fokus dan tidak terlalu ramai.
- Statistik berfungsi dengan benar dan sinkron.
- Riwayat Aktivitas lebih bersih dan mudah dibaca.
- Export PDF lebih informatif.
- Dropdown pada Manajemen Akun tampil sempurna.
- Navigasi browser tetap berjalan normal.
- Tidak ada fitur lama yang rusak akibat perubahan yang dilakukan.