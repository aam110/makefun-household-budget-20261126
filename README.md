# Anggaran Kita — Situs Anggaran Rumah Tangga

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/aam110/makefun-household-budget-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/aam110/makefun-household-budget-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

Kompetisi: [Make the best household budget site — make.fun](https://make.fun/bounty/best-household-budget-site-20261126-1457)

**Anggaran Kita** adalah situs anggaran rumah tangga berbahasa Indonesia untuk Keluarga Budi & Sari (Jakarta), bulan November 2026. Bukan dashboard satu halaman: ini sistem lengkap 6 halaman yang semuanya berfungsi dan semuanya dihitung dari **satu sumber data yang sama** — jadi angka di Dashboard, Transaksi, Anggaran, Tagihan, Tabungan, dan Laporan tidak pernah bertentangan.

## Angka bulan ini (dihitung dari data, bukan ditulis tangan)

| | |
|---|---|
| Saldo dompet | Rp8.641.000 (saldo awal Rp2.400.000 + pemasukan − pengeluaran) |
| Pemasukan | Rp10.350.000 — gaji Rp8.500.000, freelance Rp1.200.000, jualan online Rp650.000 |
| Pengeluaran | Rp4.109.000 dari 25 transaksi pengeluaran |
| Total anggaran | Rp6.150.000 — sisa Rp2.041.000 |
| Tingkat tabungan | 60% dari pemasukan |

## 6 halaman, semua berfungsi

1. **Dashboard** — saldo dompet besar, 4 kartu ringkasan, donat pengeluaran per kategori (CSS murni), 3 peringatan anggaran (Makan & Jajan 88%, Sekolah Anak 86%, Listrik & Air 82%), 5 transaksi terbaru, dan progres 3 target tabungan.
2. **Transaksi** — 28 transaksi nyata dalam Rupiah (Belanja Pasar, Listrik, Sekolah Anak, Transport, dan lainnya). Tambah / ubah / hapus transaksi lewat form, filter per kategori, cari berdasarkan kata kunci. Semua perubahan tersimpan di `localStorage` dan langsung mengubah saldo serta anggaran.
3. **Anggaran** — 8 kategori dengan progress bar realisasi vs anggaran, status Aman / Waspada / Lewat batas, dan sisa anggaran. Nominal anggaran bisa diubah dan Dashboard langsung ikut berubah.
4. **Tagihan & Langganan** — 8 tagihan (Internet, Air PDAM, SPP, BPJS, Listrik PLN, Streaming, Arisan RT, Cicilan Motor) diurutkan dari jatuh tempo terdekat. Tombol "Tandai lunas" bekerja dan mencatat pembayaran sebagai pengeluaran di Transaksi.
5. **Tabungan** — 3 target: Dana Darurat Rp6.250.000 / Rp10.000.000, Liburan Keluarga Rp2.150.000 / Rp5.000.000, DP Motor Baru Rp3.800.000 / Rp12.000.000. Tombol setoran bekerja dan mengurangi saldo dompet sebesar setoran itu.
6. **Laporan** — ringkasan bulanan, grafik batang pemasukan vs pengeluaran Juni–November 2026 (CSS murni, tanpa library), rata-rata pengeluaran 6 bulan, dan 3 tips hemat yang dihitung dari kategori dengan pemakaian anggaran tertinggi.

## Cara menjalankan

Buka `app/index.html` langsung di browser, atau jalankan server statis apa pun dengan `app/` sebagai root. Tidak ada build step, tidak ada CDN, tidak ada font eksternal, tidak ada request jaringan — font sistem saja, data tersimpan di browser sendiri.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22 stdlib saja) menyalin `app/` dan `screenshots/` ke direktori output dan menulis `dossier.json` dengan `buildDossier` dari `vendor/makefun-frontend.ts`. Dua kali jalan menghasilkan byte yang identik.

## Struktur

- `app/index.html` — kerangka 6 halaman (hash routes)
- `app/style.css` — palet biru laut dalam + kuning madu + terakota
- `app/data.js` — data awal & satu sumber hitungan (saldo, total, realisasi per kategori)
- `app/app.js` — render, router, dan semua interaksi
- `main.ts` — program penyerahan entry
- `vendor/makefun-frontend.ts` — pustaka dossier dari kit make.fun (tanpa diubah)
- `screenshots/` — 4 tangkapan layar asli dari situs ini (dashboard, transaksi, anggaran di ponsel, laporan)

## Lisensi

MIT — lihat `LICENSE`.
