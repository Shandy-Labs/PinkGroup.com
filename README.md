# PINK GROUP Website

## Struktur file

```text
 pink-group-website/
 ├── index.html              # Struktur dan konten halaman
 ├── css/
 │   └── style.css           # CSS khusus proyek
 ├── js/
 │   ├── tailwind.config.js  # Warna kustom Tailwind
 │   └── app.js              # Fungsi keranjang, checkout, WhatsApp, QR, dan interaksi
 └── images/
     └── menu/               # Simpan foto-foto menu di folder ini
```

## Cara menjalankan

1. Ekstrak ZIP ini.
2. Buka `index.html` di browser atau unggah seluruh isi folder ke GitHub Pages.
3. Jangan memindahkan `css/` dan `js/` dari lokasi relatifnya.
4. Foto menu yang belum disediakan dapat ditambahkan ke `images/menu/` dengan nama file yang tertera pada atribut `data-image` di `index.html`.

## Cara mengedit

- Teks, susunan menu, dan elemen halaman: `index.html`.
- CSS khusus: `css/style.css`. Tampilan utama juga memakai utility class dari Tailwind CDN.
- Logika pesanan, harga, keranjang, checkout, WhatsApp, dan QR: `js/app.js`.
- Palet warna Tailwind: `js/tailwind.config.js`.

## Opsi menu yang ditambahkan

- Tanpa nasi: Kentaki Rp9.000, Katsu Rp9.000, Omlet Rp9.000, Dadar Rp6.000, Ceplok Rp6.000, Balado Rp6.000, Pindang Rp6.000, Ayam Rica Rp6.000, dan Jengkol Rp6.000.
- Nasi Jengkol: Rp10.000.
- Mie Telur tanpa telur: Rp7.000.

Harga alternatif ikut dihitung dalam rincian keranjang, total checkout, dan pesan WhatsApp.
