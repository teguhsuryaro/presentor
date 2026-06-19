# Spesifikasi Sistem Presensi Mahasiswa Baru Berbasis Website

> Dokumen ini adalah **acuan teknis lengkap** untuk pengembangan Sistem Presensi Mahasiswa Baru dari nol (0). Dokumen ditujukan untuk web developer maupun AI model lain yang akan membuat perencanaan teknis, struktur kode, dan implementasi. Seluruh detail pada dokumen ini bersifat mengikat kecuali dinyatakan lain pada bagian "Hal yang Belum Ditentukan".

---

## 1. Gambaran Umum

Sistem Presensi Mahasiswa Baru adalah aplikasi web yang digunakan untuk membantu proses absensi kegiatan OSPEK, PKKMB, Gladi Bersih, maupun kegiatan kampus lainnya.

Tujuan utama sistem adalah:

- Mempercepat proses presensi.
- Mengurangi antrean panjang.
- Menghilangkan pencatatan manual.
- Menyediakan rekap kehadiran secara real-time.
- Menyediakan laporan yang dapat diunduh dan dicetak.
- Dapat digunakan selama bertahun-tahun oleh organisasi kampus.

Sistem dirancang untuk digunakan oleh panitia dan mahasiswa baru.

### Prinsip Biaya (Mengikat untuk Seluruh Dokumen)

Seluruh layanan, library, dan infrastruktur yang dipilih pada dokumen ini **wajib free tier permanen**, bukan trial berbatas waktu dan bukan model "gratis untuk awal lalu wajib upgrade". Setiap kali sebuah layanan disebutkan pada dokumen ini, asumsikan tier yang dimaksud adalah tier gratis permanennya, kecuali ditulis lain secara eksplisit.

---

## 2. Tujuan Sistem

- Mempermudah proses presensi mahasiswa baru.
- Memungkinkan banyak panitia melakukan presensi secara bersamaan.
- Menyediakan pengelolaan data peserta yang mudah.
- Menyediakan riwayat aktivitas untuk audit.
- Menyediakan laporan kehadiran yang terstruktur.

---

## 3. Arsitektur Sistem

### 3.1 Frontend

- React 18
- Vite
- TypeScript
- Tailwind CSS (styling utility-first, mendukung tema kustom — lihat Bagian 21)

### 3.2 Database & Backend

- Supabase (PostgreSQL) — free tier
  - Database PostgreSQL
  - Auth (digunakan terbatas, lihat Bagian 6)
  - Realtime (untuk sinkronisasi multi-device, lihat Bagian 12)
  - Row Level Security (RLS) untuk kontrol akses berbasis role
  - Storage (opsional, untuk lampiran/logo jika diperlukan di masa depan)

### 3.3 Deployment

- Vercel (frontend) — free tier
- Supabase (database & backend) — free tier

### 3.4 Integrasi

Frontend terhubung langsung ke database melalui API yang disediakan Supabase (REST API auto-generated dan/atau Supabase JS Client). Realtime subscription Supabase digunakan untuk memastikan seluruh perangkat panitia melihat data kehadiran yang sama secara langsung tanpa perlu refresh manual.

### 3.5 Diagram Arsitektur (Tekstual)

```
[Mahasiswa - Browser]         [Panitia - Browser]         [Super Admin - Browser]
        |                              |                              |
        +-------------- HTTPS ---------+-------------- HTTPS ---------+
                                       |
                          [React + Vite + TypeScript SPA]
                            (Hosted on Vercel - Free Tier)
                                       |
                         Supabase JS Client (REST + Realtime)
                                       |
                    +------------------+------------------+
                    |                                     |
           [Supabase Auth]                      [Supabase PostgreSQL]
           (Login Panitia/Admin)                 (RLS enforced per role)
                    |                                     |
                    +------------- Realtime Channel -------+
                                       |
                         [Supabase Realtime Engine]
                    (Broadcast perubahan data kehadiran)
```

---

## 4. Prinsip Sistem

- Seluruh layanan yang digunakan harus memiliki opsi gratis permanen (bukan trial).
- Sistem harus dapat digunakan dalam jangka panjang (multi-tahun).
- Sistem harus mendukung banyak perangkat panitia secara bersamaan.
- Sistem harus responsif dan ringan.
- Sistem harus mudah digunakan oleh pengguna non-teknis.
- Sistem harus tetap dapat berjalan meskipun terkendala limitasi free tier (lihat Bagian 22).

---

## 5. Sistem Pengguna

### 5.1 Role

#### Super Admin

**Jumlah:**

- Hanya 1 akun.

**Hak akses:**

- Membuat akun panitia.
- Mengubah akun panitia.
- Menghapus akun panitia.
- Mengubah username sendiri.
- Mengubah nama sendiri.
- Mengubah password sendiri.
- Melakukan seluruh aktivitas yang dapat dilakukan panitia.

**Batasan:**

- Tidak dapat dihapus.
- Tidak dapat diubah role-nya.
- Selalu terdapat tepat 1 akun Super Admin (dijaga melalui constraint database, lihat Bagian 23.4).

#### Panitia

**Hak akses:**

- Membuat sesi presensi.
- Mengedit sesi presensi.
- Menghapus sesi presensi.
- Membuka sesi presensi.
- Menutup sesi presensi.
- Mengelola data peserta.
- Mengimpor data peserta.
- Mengoreksi kehadiran.
- Melihat laporan.
- Mengunduh laporan.
- Mengakses mode presensi mahasiswa.
- Melihat riwayat aktivitas.

**Batasan:**

- Tidak dapat membuat akun.
- Tidak dapat mengubah akun.
- Tidak dapat menghapus akun.
- Tidak dapat mengubah role pengguna.

#### Mahasiswa (Tanpa Akun)

Mahasiswa **tidak memiliki akun login**. Mahasiswa berinteraksi dengan sistem hanya melalui Mode Presensi Mahasiswa (Bagian 10) yang dijalankan pada perangkat milik panitia atau perangkat bersama yang disediakan di lokasi presensi.

---

## 6. Login dan Keamanan

### 6.1 Login

Menggunakan:

- Username
- Password

Tidak tersedia:

- Registrasi publik.
- Login menggunakan Google.
- Login menggunakan Email.

**Catatan implementasi:** Supabase Auth secara native berbasis email. Karena sistem ini menggunakan username (bukan email) sebagai identitas login, gunakan salah satu pendekatan berikut:

- **Opsi A (disarankan):** Simpan username pada tabel `users` aplikasi, lalu petakan ke format email internal yang tidak pernah ditampilkan ke pengguna (contoh: `{username}@internal.presensi.local`) saat memanggil Supabase Auth. Pengguna tetap hanya melihat dan mengetik username.
- **Opsi B:** Tidak menggunakan Supabase Auth sama sekali untuk Panitia/Super Admin; autentikasi dilakukan manual melalui tabel `users` dengan password yang di-hash (bcrypt/argon2) di sisi server (Supabase Edge Function), lalu sesi dikelola dengan token kustom. Opsi ini lebih kompleks tetapi memberi kontrol penuh atas aturan "satu device aktif" (Bagian 6.2).

Pemilihan opsi A atau B harus difinalisasi sebelum development backend dimulai, karena berdampak pada struktur tabel `users` dan `sessions`.

### 6.2 Session

- Satu akun hanya dapat digunakan pada satu perangkat dalam waktu yang sama.
- Jika akun sudah aktif pada perangkat lain, login baru akan ditolak.
- Session akan berakhir otomatis setelah 30 menit tidak ada aktivitas.
- Logout manual tersedia.

**Catatan implementasi:**

- Aturan "satu device aktif" tidak didukung secara native oleh Supabase Auth, sehingga harus diimplementasikan secara manual menggunakan tabel `active_sessions` (lihat Bagian 23.2) yang menyimpan `session_token` aktif per pengguna. Setiap permintaan login baru memeriksa apakah sudah ada sesi aktif; jika ada dan belum expired, login ditolak dengan pesan yang jelas (contoh: nama device/waktu login terakhir, opsi "Paksa keluar dari perangkat lain" hanya dapat dilakukan oleh Super Admin terhadap akun panitia).
- Idle timeout 30 menit diimplementasikan di sisi frontend (timer aktivitas: mouse move, keyboard, klik) yang memperbarui `last_activity_at` pada `active_sessions`, dikombinasikan dengan pengecekan di sisi server pada setiap request sensitif.

### 6.3 Lupa Password

**Super Admin:**

Jika lupa password:

- Harus menghubungi pengembang sistem.
- Password direset langsung melalui database.

**Panitia:**

Password dapat direset oleh Super Admin.

---

## 7. Dashboard Utama

Menampilkan daftar seluruh sesi presensi.

**Informasi yang ditampilkan:**

- Nama sesi
- Status sesi
- Tanggal pembuatan
- Jumlah peserta
- Jumlah hadir
- Jumlah belum hadir

**Aksi yang tersedia:**

- Buat sesi
- Edit sesi
- Hapus sesi
- Buka sesi
- Tutup sesi
- Lihat laporan
- Download laporan
- Masuk ke mode presensi

---

## 8. Sesi Presensi

Sistem menggunakan konsep sesi.

**Contoh:**

- Presensi OSPEK Hari 1
- Presensi OSPEK Hari 2
- Gladi Bersih
- Pembukaan
- Penutupan

**Setiap sesi memiliki:**

- Nama sesi
- Deskripsi (opsional)
- Tanggal pembuatan
- Status sesi
- Daftar peserta
- Data kehadiran

**Status sesi:**

#### Aktif

Mahasiswa dapat melakukan presensi.

#### Ditutup

Mahasiswa tidak dapat melakukan presensi.

Panitia dapat membuka kembali sesi yang sudah ditutup.

---

## 9. Pengelolaan Data Peserta

### 9.1 Input Manual

Panitia dapat menambahkan peserta satu per satu.

### 9.2 Import CSV

Panitia dapat mengunggah file CSV.

### 9.3 Import Excel

Panitia dapat mengunggah file Excel (.xlsx).

### 9.4 Mapping Kolom

Saat proses impor:

- Sistem menampilkan preview data.
- Panitia memilih kolom Nama.
- Panitia memilih kolom NIM.
- Sistem mengambil data berdasarkan mapping tersebut.

### 9.5 Data Peserta

**Data wajib:**

- Nama
- NIM

**Data tambahan yang dapat digunakan:**

- Prodi
- Fakultas
- Kelompok
- Angkatan
- Kelas
- dan data lainnya sesuai kebutuhan (lihat skema `attributes` JSONB pada Bagian 23.6)

### 9.6 Salin Peserta

Saat membuat sesi baru:

- Panitia dapat menyalin peserta dari sesi sebelumnya.
- Seluruh data peserta akan disalin ke sesi baru.
- Status kehadiran **tidak** ikut disalin (peserta baru akan dimulai dengan status "Belum Hadir" pada sesi baru).

---

## 10. Mode Presensi Mahasiswa

Mode ini digunakan mahasiswa untuk melakukan presensi.

**Tampilan:**

- Kolom pencarian
- Hasil pencarian real-time

Mahasiswa tidak perlu menekan tombol Enter.

### 10.1 Pencarian

Pencarian berdasarkan:

- Nama
- NIM

Hasil pencarian menampilkan:

- Nama
- NIM

Data tambahan tidak ditampilkan kepada mahasiswa.

---

## 11. Alur Presensi Mahasiswa

1. Mahasiswa mengetik Nama atau NIM.
2. Sistem menampilkan hasil secara real-time.
3. Mahasiswa memilih data dirinya.
4. Sistem menampilkan halaman konfirmasi.

Contoh:

```
Nama : Teguh Surya Romadon
NIM  : 241051001

[Konfirmasi Presensi]
```

5. Mahasiswa menekan tombol konfirmasi.
6. Sistem menyimpan kehadiran.
7. Sistem menampilkan notifikasi berhasil.

### 11.1 Ketentuan Presensi

- Satu peserta hanya dapat hadir satu kali dalam satu sesi.
- Jika peserta sudah hadir, data tetap muncul di hasil pencarian.

Contoh:

```
Teguh Surya Romadon
241051001

Status   : Sudah Hadir
Waktu    : 07:15 WIB
```

> **Catatan desain:** Status "Sudah Hadir" ditampilkan menggunakan badge berwarna dan ikon dari icon library (lihat Bagian 21.6), bukan emoji keyboard.

---

## 12. Multi Device

Sistem mendukung banyak panitia secara bersamaan.

**Contoh:**

- Laptop Panitia A
- Laptop Panitia B
- Laptop Panitia C

Semua dapat membuka sesi presensi yang sama.

Seluruh perubahan data harus tersinkronisasi secara real-time.

**Catatan implementasi:** Sinkronisasi real-time menggunakan **Supabase Realtime** (berbasis PostgreSQL logical replication / Postgres Changes). Frontend melakukan subscribe pada channel per `session_id`, sehingga setiap insert/update/delete pada tabel `attendance_records` langsung dipantulkan ke seluruh klien yang sedang membuka sesi tersebut tanpa perlu polling.

---

## 13. Monitoring Kehadiran

Menampilkan:

- Total peserta
- Total hadir
- Total belum hadir
- Persentase kehadiran

Daftar peserta menampilkan:

- Nama
- NIM
- Status hadir
- Waktu presensi

---

## 14. Koreksi Kehadiran

Panitia dapat:

#### Checklist Hadir

Menandai peserta hadir secara manual.

#### Unchecklist Hadir

Menghapus status hadir peserta.

Saat status hadir dihapus:

- Data kehadiran dihapus.
- Waktu presensi dihapus.

> Setiap aksi checklist/unchecklist tetap tercatat pada Audit Log (Bagian 16) walaupun data kehadirannya sendiri dihapus, sehingga riwayat siapa yang melakukan koreksi tetap terlacak.

---

## 15. Laporan

Format yang tersedia:

- PDF
- CSV

Data yang disertakan:

- Nama
- NIM
- Status kehadiran
- Waktu presensi

---

## 16. Audit Log

Seluruh aktivitas penting harus dicatat.

**Aktivitas yang dicatat:**

- Login
- Logout
- Pembuatan sesi
- Pengeditan sesi
- Penghapusan sesi
- Pemulihan sesi
- Pembukaan sesi
- Penutupan sesi
- Import peserta
- Download PDF
- Download CSV
- Pembuatan akun panitia
- Pengubahan akun panitia
- Penghapusan akun panitia
- Perubahan password
- Koreksi kehadiran

**Informasi yang disimpan:**

- Waktu aktivitas
- User pelaku
- Aktivitas
- Sesi terkait

**Audit log:**

- Tidak dapat diedit.
- Tidak dapat dihapus.

> Konsistensi ini ditegakkan di level database menggunakan PostgreSQL Rule/Trigger yang menolak operasi `UPDATE` dan `DELETE` pada tabel `audit_logs` (lihat Bagian 23.7), bukan hanya dibatasi di sisi aplikasi.

---

## 17. Sampah (Trash)

Saat sesi dihapus:

- Tidak langsung hilang permanen.
- Masuk ke halaman Sampah.

Sesi dapat dipulihkan kembali sebelum masa retensi berakhir.

**Retensi:**

- 30 hari.

Setelah 30 hari:

- Sistem menghapus sesi secara permanen.

> Implementasi soft-delete menggunakan kolom `deleted_at` pada tabel `sessions` (lihat Bagian 23.5). Penghapusan permanen otomatis setelah 30 hari dijalankan melalui mekanisme terjadwal — lihat Bagian 22.3 untuk opsi yang sepenuhnya gratis tanpa cron job berbayar.

---

## 18. Statistik

Dashboard harus menampilkan:

- Total sesi
- Total peserta
- Total kehadiran
- Persentase kehadiran

Visualisasi statistik ditampilkan dalam bentuk grafik interaktif — lihat Bagian 21.7 untuk detail jenis chart dan library yang digunakan.

---

## 19. Ketentuan Jangka Panjang

- Sistem dirancang untuk digunakan bertahun-tahun.
- Data antar tahun harus tetap tersimpan.
- Data sesi lama tetap dapat diakses.
- Sistem harus tetap dapat digunakan untuk kegiatan selain OSPEK.

> Untuk mendukung ini, setiap sesi disarankan terhubung ke entitas `events` (kegiatan/tahun ajaran) — lihat Bagian 23.3 — sehingga data dapat dikelompokkan dan difilter per tahun/kegiatan tanpa kehilangan riwayat lama.

---

## 20. Hal yang Belum Ditentukan

- Pemilihan final antara Opsi A atau Opsi B untuk skema autentikasi (Bagian 6.1).
- Desain dashboard statistik final (jenis chart spesifik per metrik — kerangka sudah ditetapkan pada Bagian 21.7, detail final menyesuaikan saat development).
- Strategi backup data — kerangka sudah ditetapkan pada Bagian 22.2, jadwal/eksekusi final menyesuaikan kapasitas tim.
- Mekanisme cron job atau ping berkala untuk menjaga layanan tetap aktif — kerangka opsi sudah ditetapkan pada Bagian 22.3, pemilihan final menyesuaikan kebijakan layanan yang berlaku saat development dimulai.

---

## 21. Desain UI/UX

### 21.1 Arah Desain

**Tema:** Klasik dan minimalis.
**Warna aksen dominan:** Orange.
**Prinsip:** Bersih, tidak ramai, fokus pada keterbacaan dan kecepatan tugas (task-completion speed), karena pengguna utama (panitia di lapangan dan mahasiswa baru) seringkali mengakses sistem dalam kondisi terburu-buru dan jaringan yang tidak selalu stabil.

**Larangan eksplisit:** Tidak menggunakan emoticon/emoji keyboard (😀, ✅, 🕒, dsb.) sebagai icon di mana pun dalam antarmuka. Seluruh indikator status, aksi, dan navigasi menggunakan icon dari icon library (Bagian 21.6) atau ilustrasi SVG kustom.

### 21.2 Palet Warna

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-bg` | `#FAF7F2` | Latar belakang utama (warm off-white, kesan klasik) |
| `--color-surface` | `#FFFFFF` | Kartu, modal, panel |
| `--color-text-primary` | `#2B2521` | Teks utama (hampir hitam, bukan hitam pekat) |
| `--color-text-secondary` | `#6B6258` | Teks sekunder, label, caption |
| `--color-border` | `#E5DED3` | Garis pembatas, divider |
| `--color-accent` | `#D9651A` | Warna aksen orange utama (tombol primer, highlight, fokus) |
| `--color-accent-hover` | `#B8520F` | State hover/active dari aksen |
| `--color-accent-soft` | `#FBE6D6` | Background lembut untuk badge/notifikasi bernuansa aksen |
| `--color-success` | `#3F7D4F` | Status hadir/berhasil (hijau tua, bukan hijau neon) |
| `--color-danger` | `#A8392F` | Status error/hapus/peringatan |
| `--color-warning` | `#B8860B` | Status pending/perlu perhatian |

> Skema ini sengaja menghindari 3 pola umum desain AI generik (cream + serif tinggi kontras, dark mode + neon, atau koran hairline) dengan tetap mempertahankan kesan "klasik": warm off-white dengan orange terracotta yang lebih dalam (bukan orange neon), dikombinasikan dengan tipografi serif yang hangat namun fungsional.

### 21.3 Tipografi

- **Display/Heading:** `Source Serif 4` atau `Lora` (serif klasik, hangat, mudah dibaca pada ukuran besar) — digunakan untuk judul halaman, nama sesi, dan judul kartu statistik.
- **Body/UI:** `Inter` atau `Plus Jakarta Sans` (sans-serif netral, sangat legible pada ukuran kecil) — digunakan untuk seluruh teks UI, label form, tabel data.
- **Monospace (data presisi):** `JetBrains Mono` atau `IBM Plex Mono` — digunakan khusus untuk menampilkan NIM, timestamp presensi, dan kode sesi, agar deretan angka selalu sejajar dan mudah dipindai secara visual.

Seluruh font dapat diakses gratis melalui Google Fonts/Fontsource (self-hosted via npm package agar tidak bergantung pada CDN eksternal saat offline-first dipertimbangkan di masa depan).

### 21.4 Layout & Komponen Kunci

- **Struktur navigasi:** Sidebar tetap (desktop) yang dapat collapse menjadi bottom-nav/hamburger pada mobile, karena panitia kemungkinan mengakses dashboard dari laptop sedangkan mode presensi mahasiswa diakses dari device apa pun di lokasi.
- **Mode Presensi Mahasiswa** dirancang sebagai layar penuh (full-screen, distraction-free) tanpa sidebar/navigasi admin, hanya menampilkan kolom pencarian besar di tengah — meniru kiosk mode — agar mahasiswa tidak bingung dengan elemen panitia.
- **Kartu sesi** pada dashboard menggunakan border tipis (`--color-border`) dengan radius kecil (4–6px, kesan klasik bukan bubble rounded modern), shadow sangat halus, dan strip aksen orange tipis di salah satu sisi kartu untuk menandai status "Aktif".
- **Tabel data peserta** menggunakan baris zebra sangat halus (selang-seling `--color-bg` dan `--color-surface`), dengan kolom NIM menggunakan font monospace.

### 21.5 Animasi & Loading (UX Motion)

Motion digunakan secara halus dan fungsional, bukan dekoratif:

- **Loading awal aplikasi:** Skeleton screen (placeholder konten berbentuk blok abu-abu berdenyut halus/`pulse`) untuk dashboard dan tabel — bukan spinner generik — agar pengguna merasakan struktur halaman sebelum data tampil.
- **Pencarian real-time (Mode Presensi):** Debounce 150–250ms pada input, dengan transisi fade-in halus (150ms) saat hasil pencarian berganti, dan indikator loading kecil (garis progress tipis berwarna aksen orange di bawah search bar) saat query berjalan.
- **Konfirmasi presensi berhasil:** Transisi micro-interaction singkat (checkmark yang menggambar dirinya sendiri / draw-on animation, durasi ±400ms, menggunakan SVG path animation atau library motion) disertai pesan teks yang jelas, bukan emoji.
- **Perubahan status sesi (buka/tutup):** Transisi warna badge status yang halus (`transition: background-color 200ms ease, color 200ms ease`).
- **Sinkronisasi real-time multi-device:** Baris tabel yang berubah karena update dari device lain diberi highlight sementara (background `--color-accent-soft` yang fade out dalam 800ms) agar panitia menyadari ada perubahan data tanpa terkejut.
- **Page transition:** Fade + slight slide (8–12px) antar halaman dashboard, durasi singkat (150–200ms), agar terasa halus tanpa terasa lambat.
- **Prinsip umum:** Semua animasi menghormati `prefers-reduced-motion`; durasi animasi tidak pernah lebih dari 400ms agar tidak menghambat kecepatan kerja panitia di lapangan.

### 21.6 Icon Library

Gunakan satu icon library konsisten di seluruh aplikasi, contoh pilihan gratis dan open-source:

- **Lucide Icons** (`lucide-react`) — direkomendasikan: gaya outline tipis, konsisten, ringan, cocok dengan tema klasik-minimalis.

Alternatif: Phosphor Icons, Heroicons. Pilih satu dan konsisten di seluruh produk — tidak mencampur beberapa icon set berbeda gaya.

Penggunaan icon:

- Status hadir → icon check-circle (warna `--color-success`)
- Status belum hadir → icon circle-dashed (warna `--color-text-secondary`)
- Waktu presensi → icon clock (warna `--color-text-secondary`)
- Import data → icon upload
- Download laporan → icon download
- Sesi aktif → icon radio/broadcast kecil berwarna aksen
- Sampah → icon trash-2

### 21.7 Visualisasi Statistik

Library chart yang direkomendasikan (gratis, open-source, ringan, kompatibel React + TypeScript):

- **Recharts** — direkomendasikan sebagai pilihan utama: deklaratif, mudah dikustomisasi warna sesuai token palet (Bagian 21.2), komunitas besar.
- Alternatif: **Tremor** (kumpulan komponen dashboard siap pakai berbasis Tailwind, sangat cocok untuk mempercepat pembuatan kartu statistik) atau **visx** (jika diperlukan kustomisasi visual lebih dalam).

Jenis visualisasi yang disarankan per metrik:

| Metrik | Jenis Chart | Catatan |
|---|---|---|
| Persentase kehadiran per sesi | Donut/Radial chart | Warna aksen orange untuk "hadir", abu-abu untuk "belum hadir" |
| Tren kehadiran antar sesi (mis. OSPEK Hari 1 vs Hari 2) | Bar chart horizontal/vertikal | Memudahkan perbandingan antar sesi |
| Kehadiran berdasarkan waktu masuk (jam-jaman) | Area/Line chart | Untuk melihat jam-jam padat presensi, berguna evaluasi alur antrean |
| Distribusi peserta per Prodi/Fakultas/Kelompok | Bar chart bertumpuk (stacked) atau treemap | Opsional, menggunakan kolom `attributes` JSONB |

Seluruh kartu statistik menggunakan skeleton loading saat data belum tersedia, dan transisi number counting (angka menghitung naik singkat, ±500ms) saat data pertama kali dimuat untuk memberi kesan dinamis tanpa berlebihan.

### 21.8 Aksesibilitas & Responsivitas

- Kontras warna teks terhadap background memenuhi WCAG AA minimum.
- Fokus keyboard terlihat jelas (outline aksen orange) pada seluruh elemen interaktif, penting karena Super Admin/Panitia mungkin menavigasi form panjang (input peserta manual).
- Layout sepenuhnya responsif, dengan breakpoint utama: mobile (<640px), tablet (640–1024px), desktop (>1024px) — Mode Presensi Mahasiswa dioptimalkan khusus untuk layar sentuh/tablet di lokasi registrasi.

---

## 22. Strategi Mengatasi Keterbatasan Database & Free Tier

### 22.1 Ringkasan Limitasi Free Tier Supabase yang Relevan

Free tier Supabase (per kondisi umum yang berlaku) memiliki batasan yang relevan untuk diantisipasi sejak desain awal:

- Proyek dapat di-pause otomatis jika tidak ada aktivitas dalam jangka waktu tertentu.
- Batas penyimpanan database dan bandwidth bulanan.
- Batas jumlah koneksi realtime/concurrent connections.
- Batas ukuran log dan retensi backup otomatis pada tier gratis lebih terbatas dibanding tier berbayar.

> **Catatan:** Angka pasti limit (storage, bandwidth, jumlah project pause threshold) berubah dari waktu ke waktu sesuai kebijakan Supabase. Developer wajib mengecek halaman pricing/limits resmi Supabase saat development dimulai, dan tidak berasumsi pada angka tertentu yang mungkin sudah usang.

### 22.2 Strategi Mengatasi Limitasi

1. **Mencegah project pause karena idle:**
   - Karena kegiatan seperti OSPEK bersifat musiman (aktif intensif beberapa hari, lalu idle berbulan-bulan), proyek database berisiko di-pause otomatis oleh Supabase akibat tidak ada aktivitas.
   - Solusi: jadwalkan ping ringan berkala (lihat Bagian 22.3) untuk menjaga proyek tetap dianggap aktif **hanya jika dibutuhkan dan sesuai kebijakan layanan yang berlaku saat itu**. Jika kebijakan Supabase melarang/tidak memerlukan ping buatan, langkah ini dilewati.
   - Alternatif: dokumentasikan prosedur manual "wake-up" proyek (login ke dashboard Supabase) sebagai bagian dari SOP rutin panitia setiap kali mendekati periode kegiatan baru, sehingga tidak bergantung pada otomatisasi yang berisiko melanggar kebijakan.

2. **Mengelola pertumbuhan data jangka panjang:**
   - Karena sistem dirancang dipakai bertahun-tahun (Bagian 19), volume data (`participants`, `attendance_records`, `audit_logs`) akan terus bertambah setiap tahun.
   - Solusi: terapkan strategi **arsip data** — data dari `events` (tahun ajaran) yang sudah lewat 2+ tahun dapat diekspor ke file CSV/JSON (sebagai backup dingin) dan opsional dipindahkan ke tabel arsip terpisah atau dihapus dari tabel aktif jika storage mendekati limit, sambil tetap mempertahankan agregat statistik (lihat tabel `session_stats_snapshot` pada Bagian 23.8) agar laporan historis tetap dapat diakses tanpa menyimpan raw data selamanya.
   - Audit log yang sangat besar dapat dipartisi per tahun (table partitioning by `created_at`) jika diperlukan, untuk mempermudah arsip selektif tanpa menghapus kewajiban "tidak dapat diedit/dihapus" pada data yang masih dalam periode aktif.

3. **Backup data:**
   - Lakukan ekspor manual berkala (CSV/SQL dump) terutama sebelum dan sesudah periode kegiatan besar (OSPEK), disimpan di Google Drive/penyimpanan gratis lain milik organisasi sebagai redundansi di luar Supabase.
   - Supabase free tier menyediakan backup otomatis dengan retensi terbatas; backup manual berkala tetap diperlukan sebagai mitigasi karena retensi otomatis pada tier gratis tidak sepanjang tier berbayar.

4. **Mengelola batas koneksi realtime:**
   - Batasi subscription realtime hanya pada channel yang relevan dengan sesi yang sedang dibuka oleh masing-masing klien (bukan subscribe ke seluruh tabel), agar jumlah koneksi concurrent tetap efisien saat banyak panitia online bersamaan.

### 22.3 Opsi Mekanisme Ping/Cron Berkala (Gratis)

Jika dibutuhkan untuk mencegah idle pause, dan sesuai dengan kebijakan layanan yang berlaku saat development, opsi yang sepenuhnya gratis meliputi:

- **GitHub Actions scheduled workflow** (free tier untuk repository publik atau kuota gratis bulanan untuk repository privat) yang menjalankan request HTTP ringan ke endpoint Supabase secara berkala.
- **Supabase Edge Functions + pg_cron** (jika tersedia pada tier yang digunakan) untuk menjalankan tugas pemeliharaan ringan terjadwal di dalam database itu sendiri.
- **Layanan cron gratis pihak ketiga** (mis. cron-job.org) yang melakukan ping ke endpoint publik aplikasi secara berkala.

> Pemilihan akhir didokumentasikan sebagai keputusan terbuka pada Bagian 20, karena bergantung pada kebijakan layanan yang aktif saat implementasi.

---

## 23. Struktur Database Lengkap

Skema dirancang untuk PostgreSQL (Supabase) dengan Row Level Security (RLS) aktif pada seluruh tabel. Seluruh tabel menggunakan `UUID` sebagai primary key (`gen_random_uuid()`) agar aman diekspos pada URL/API tanpa membocorkan urutan/jumlah data, kecuali dinyatakan lain.

### 23.1 Tabel `users`

Menyimpan akun Super Admin dan Panitia.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `username` | `text` UNIQUE NOT NULL | Identitas login |
| `password_hash` | `text` NOT NULL | Hash password (bcrypt/argon2) — hanya relevan jika Opsi B (Bagian 6.1) dipilih; jika Opsi A, kolom ini tetap disimpan sebagai cadangan/audit namun autentikasi utama via Supabase Auth |
| `auth_user_id` | `uuid` NULLABLE | Referensi ke `auth.users.id` Supabase jika Opsi A dipilih |
| `full_name` | `text` NOT NULL | Nama lengkap pengguna |
| `role` | `text` NOT NULL | Enum: `super_admin`, `panitia` |
| `is_active` | `boolean` NOT NULL DEFAULT `true` | Untuk menonaktifkan akun panitia tanpa menghapus riwayat |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

**Constraint khusus:** lihat Bagian 23.4 untuk memastikan hanya 1 `super_admin` yang valid setiap saat.

### 23.2 Tabel `active_sessions`

Menjaga aturan satu device aktif per akun dan idle timeout.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` NOT NULL | |
| `session_token` | `text` UNIQUE NOT NULL | Token sesi aktif |
| `device_label` | `text` NULLABLE | Info perangkat (user agent ringkas) untuk ditampilkan saat penolakan login |
| `last_activity_at` | `timestamptz` NOT NULL DEFAULT `now()` | Diperbarui setiap aktivitas, dasar idle timeout 30 menit |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `expired_at` | `timestamptz` NULLABLE | Diisi saat logout manual/idle timeout/dipaksa keluar |

**Aturan logika aplikasi:** Sebelum membuat baris baru untuk `user_id` yang sama, sistem memeriksa apakah ada baris dengan `expired_at IS NULL` dan `last_activity_at` masih dalam batas 30 menit terakhir; jika ada, login baru ditolak.

### 23.3 Tabel `events`

Mengelompokkan sesi berdasarkan kegiatan/tahun ajaran agar data jangka panjang (Bagian 19) tetap terstruktur.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | Contoh: "PKKMB 2026", "OSPEK Fakultas Teknik 2026" |
| `academic_year` | `text` NULLABLE | Contoh: "2026/2027" |
| `created_by` | `uuid` FK → `users.id` | |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

### 23.4 Tabel `sessions`

Sesi presensi individual (mis. "Presensi OSPEK Hari 1").

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `event_id` | `uuid` FK → `events.id` NULLABLE | Pengelompokan kegiatan/tahun |
| `name` | `text` NOT NULL | Nama sesi |
| `description` | `text` NULLABLE | Deskripsi opsional |
| `status` | `text` NOT NULL DEFAULT `'aktif'` | Enum: `aktif`, `ditutup` |
| `created_by` | `uuid` FK → `users.id` NOT NULL | |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `closed_at` | `timestamptz` NULLABLE | Waktu terakhir ditutup |
| `deleted_at` | `timestamptz` NULLABLE | Soft-delete untuk fitur Sampah (Bagian 17) |
| `permanently_delete_at` | `timestamptz` NULLABLE | Dihitung otomatis = `deleted_at + 30 hari`, dipakai oleh proses pembersihan terjadwal |

**Constraint unik Super Admin (terkait tabel `users`):** Karena constraint "hanya 1 Super Admin" melibatkan tabel `users`, gunakan salah satu dari:

- **Partial unique index:** `CREATE UNIQUE INDEX one_super_admin_idx ON users ((role)) WHERE role = 'super_admin';` — memastikan hanya boleh ada satu baris dengan `role = 'super_admin'` pada level database.
- Ditambah trigger `BEFORE DELETE` dan `BEFORE UPDATE` pada baris dengan `role = 'super_admin'` yang menolak operasi tersebut secara eksplisit (menegakkan "tidak dapat dihapus" dan "tidak dapat diubah role-nya").

### 23.5 Tabel `participants`

Data peserta per sesi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `sessions.id` NOT NULL | |
| `full_name` | `text` NOT NULL | Nama (wajib) |
| `nim` | `text` NOT NULL | NIM (wajib) |
| `attributes` | `jsonb` NULLABLE DEFAULT `'{}'` | Data tambahan fleksibel: `{"prodi": "...", "fakultas": "...", "kelompok": "...", "angkatan": "...", "kelas": "..."}` — fleksibel menampung field tambahan apa pun tanpa mengubah skema |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `source` | `text` NOT NULL DEFAULT `'manual'` | Enum: `manual`, `import_csv`, `import_excel`, `copied_from_session` — untuk audit asal data |

**Index:**

- `CREATE INDEX idx_participants_session ON participants(session_id);`
- `CREATE INDEX idx_participants_search ON participants USING gin (to_tsvector('simple', full_name || ' ' || nim));` — mendukung pencarian real-time pada Mode Presensi (Bagian 10–11) agar tetap cepat walau jumlah peserta besar.
- Constraint unik gabungan disarankan: `UNIQUE (session_id, nim)` agar NIM yang sama tidak terduplikasi dalam satu sesi.

### 23.6 Tabel `attendance_records`

Data kehadiran aktual, terpisah dari `participants` agar riwayat presensi per sesi jelas dan mudah dikoreksi (Bagian 14) tanpa menyentuh data master peserta.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `sessions.id` NOT NULL | Redundan dengan `participant.session_id` untuk mempercepat query agregat tanpa join |
| `participant_id` | `uuid` FK → `participants.id` NOT NULL | |
| `attended_at` | `timestamptz` NOT NULL DEFAULT `now()` | Waktu presensi |
| `method` | `text` NOT NULL DEFAULT `'self_service'` | Enum: `self_service` (mahasiswa konfirmasi sendiri), `manual_checklist` (dicentang panitia) |
| `recorded_by` | `uuid` FK → `users.id` NULLABLE | Diisi jika `method = manual_checklist`; null jika self-service |

**Constraint:** `UNIQUE (session_id, participant_id)` — menegakkan "satu peserta hanya dapat hadir satu kali dalam satu sesi" langsung di level database, tidak hanya di aplikasi.

**Catatan koreksi (unchecklist):** Operasi "Unchecklist Hadir" (Bagian 14) menghapus baris ini sepenuhnya (`DELETE`), sesuai spesifikasi "data kehadiran dihapus, waktu presensi dihapus" — namun aksi penghapusan tersebut tetap dicatat di `audit_logs` (Bagian 23.7) sebagai jejak terpisah yang tidak terhapus.

### 23.7 Tabel `audit_logs`

Catatan aktivitas yang tidak dapat diedit/dihapus.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` NULLABLE | Null jika aktivitas dilakukan oleh mahasiswa tanpa akun (mis. self-service presensi) |
| `actor_label` | `text` NULLABLE | Label tampilan pelaku jika `user_id` null, contoh: "Mahasiswa (self-service)" |
| `action` | `text` NOT NULL | Enum mengikuti daftar pada Bagian 16: `login`, `logout`, `session_create`, `session_edit`, `session_delete`, `session_restore`, `session_open`, `session_close`, `participant_import`, `report_download_pdf`, `report_download_csv`, `account_create`, `account_edit`, `account_delete`, `password_change`, `attendance_correction` |
| `related_session_id` | `uuid` FK → `sessions.id` NULLABLE | Sesi terkait, jika relevan |
| `metadata` | `jsonb` NULLABLE | Detail tambahan spesifik per jenis aksi (contoh: jumlah baris yang diimpor, nama file) |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | Waktu aktivitas |

**Penegakan immutability di level database:**

```sql
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```

Atau alternatif menggunakan trigger `BEFORE UPDATE OR DELETE` yang melempar exception — pilih salah satu sesuai preferensi tim development, keduanya mencegah `UPDATE`/`DELETE` pada level database sehingga tidak bisa dilewati meskipun ada bug di sisi aplikasi.

### 23.8 Tabel `session_stats_snapshot` (Mendukung Bagian 18 & 22.2)

Snapshot agregat statistik per sesi, berguna sebagai cache untuk dashboard statistik dan sebagai data ringan yang tetap dipertahankan walaupun raw data lama diarsipkan (Bagian 22.2).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `sessions.id` NOT NULL UNIQUE | |
| `total_participants` | `integer` NOT NULL DEFAULT `0` | |
| `total_attended` | `integer` NOT NULL DEFAULT `0` | |
| `attendance_percentage` | `numeric(5,2)` NOT NULL DEFAULT `0` | |
| `last_calculated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Diperbarui melalui trigger pada `attendance_records` (setiap insert/delete) atau melalui job terjadwal ringan, sesuai keputusan performa tim development.

### 23.9 Relasi Antar Tabel (ERD Tekstual)

```
events (1) ──── (banyak) sessions
sessions (1) ──── (banyak) participants
sessions (1) ──── (banyak) attendance_records
participants (1) ──── (0..1) attendance_records   [unik per session_id+participant_id]
sessions (1) ──── (0..1) session_stats_snapshot
users (1) ──── (banyak) active_sessions
users (1) ──── (banyak) audit_logs
users (1) ──── (banyak) sessions [sebagai created_by]
sessions (1) ──── (banyak) audit_logs [sebagai related_session_id]
```

### 23.10 Row Level Security (RLS) — Prinsip Umum

- Seluruh tabel mengaktifkan RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- Policy dasar: pengguna dengan `role = 'panitia'` dapat melakukan `SELECT/INSERT/UPDATE` pada `sessions`, `participants`, `attendance_records`, tetapi tidak memiliki akses apa pun ke tabel `users` selain baris dirinya sendiri (`auth.uid() = users.auth_user_id` atau setara, mengikuti opsi autentikasi yang dipilih pada Bagian 6.1).
- Hanya `role = 'super_admin'` yang memiliki policy `INSERT/UPDATE/DELETE` pada tabel `users` (selain baris dirinya sendiri untuk update profil terbatas).
- Tabel `audit_logs` hanya mengizinkan `INSERT` melalui policy; tidak ada policy yang mengizinkan `UPDATE`/`DELETE` sama sekali (selaras dengan rule pada Bagian 23.7).
- Akses Mode Presensi Mahasiswa (tanpa login) ke `participants` dan `attendance_records` dilakukan melalui policy khusus yang sangat terbatas: hanya `SELECT` kolom `full_name`, `nim`, dan status kehadiran pada sesi dengan `status = 'aktif'`, serta `INSERT` ke `attendance_records` dengan validasi constraint unik (Bagian 23.6) — tanpa mengekspos kolom `attributes` (data tambahan) sesuai Bagian 10.1.

---

## 24. Ringkasan Library & Layanan (Seluruhnya Gratis)

| Kebutuhan | Pilihan | Catatan |
|---|---|---|
| Framework UI | React 18 + Vite + TypeScript | |
| Styling | Tailwind CSS | Token warna kustom sesuai Bagian 21.2 |
| Icon | Lucide Icons (`lucide-react`) | Open-source |
| Chart/Statistik | Recharts (+ opsional Tremor) | Open-source |
| Font | Source Serif 4 / Lora, Inter / Plus Jakarta Sans, JetBrains Mono | Via Google Fonts/Fontsource, self-hosted |
| Animasi | CSS transitions native + Framer Motion (opsional, untuk micro-interaction kompleks) | Framer Motion open-source, gratis |
| Parsing CSV | PapaParse | Open-source |
| Parsing Excel | SheetJS (xlsx) | Open-source |
| Generate PDF Laporan | jsPDF atau react-pdf | Open-source |
| Database & Backend | Supabase (PostgreSQL, Auth, Realtime, RLS) | Free tier permanen |
| Hosting Frontend | Vercel | Free tier permanen |
| Penjadwalan ping (jika diperlukan) | GitHub Actions scheduled workflow | Free tier |

---

*Akhir dokumen.*