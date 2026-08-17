# ProfitTebel Lite — Rebuild

Rebuild awal berdasarkan screenshot aplikasi ProfitTebel Lite yang diberikan.

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat Vite yang muncul.

## Build untuk Vercel

```bash
npm run build
```

Folder hasil build: `dist`

Project ini sengaja dibuat tanpa dependensi UI eksternal sehingga dapat langsung dideploy sebagai aplikasi frontend Vercel.

## Catatan

Sidebar, typography, warna, kartu upload, layout, dan halaman Upload Data direkonstruksi dari screenshot referensi. Halaman menu lain sudah memiliki routing dan shell yang sama dan siap diisi dengan modul bisnis masing-masing.
