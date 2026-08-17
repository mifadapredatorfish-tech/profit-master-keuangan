import "./style.css";

const ORANGE = "#f26522";

const icons = {
  shop: `<svg viewBox="0 0 24 24"><path d="M4 10v9h16v-9"/><path d="M3 10h18l-2-6H5l-2 6Z"/><path d="M8 19v-5h8v5"/><path d="M7 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/></svg>`,
  grid: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
  product: `<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4"/><path d="M12 11.5V21"/></svg>`,
  megaphone: `<svg viewBox="0 0 24 24"><path d="m4 10 12-5v14L4 14v-4Z"/><path d="M16 9h4v6h-4"/><path d="m6 15 2 5h3l-2-5"/></svg>`,
  calculator: `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24"><path d="M4 7h15a1 1 0 0 1 1 1v11H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13"/><path d="M16 13h4"/><circle cx="16" cy="13" r=".6"/></svg>`,
  upload: `<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>`,
  file: `<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/></svg>`,
  cube: `<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4 8-4M12 11.5V21"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,
  chev: `<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 5-3.1 8.3-7 10-3.9-1.7-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`
};

const menu = [
  ["dashboard", "Dashboard Profit", "grid"],
  ["produk", "Master Produk", "product"],
  ["iklan", "Detail Iklan", "megaphone"],
  ["roas", "Kalkulator ROAS", "calculator"],
  ["operasional", "Biaya Operasional", "wallet"],
  ["upload", "Upload Data", "upload"]
];

function el(html){ const t=document.createElement("template"); t.innerHTML=html.trim(); return t.content.firstElementChild; }

function sidebar(active="upload"){
  return `
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">↗</div>
      <div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div>
    </div>
    <div class="store-wrap">
      <button class="store-select">${icons.shop}<span>Toko Utama</span><span class="store-arrow">${icons.chev}</span></button>
    </div>
    <nav class="nav">
      ${menu.map(([id,label,ico])=>`
        <button class="nav-item ${active===id?'active':''}" data-page="${id}">
          ${icons[ico]}<span>${label}</span>
        </button>`).join("")}
    </nav>
  </aside>`;
}

function uploadPage(){
  return `
  <main class="content">
    <div class="notice"><span class="notice-icon">${icons.check}</span>Data berhasil direset.</div>
    <section class="page-head">
      <h1>Upload Laporan</h1>
      <p>Gabungkan laporan Shopee/TikTok jadi satu dashboard. Semua diproses di browser kamu.</p>
    </section>

    <section class="store-card">
      <div class="upload-store-label">${icons.shop}<strong>Upload ke toko:</strong><span class="pill">Toko Utama (shopee)</span></div>
      <div class="new-store">
        <input placeholder="Nama toko baru" />
        <div class="new-row"><select><option>Shopee</option><option>TikTok</option></select><button>＋ Tambah</button></div>
      </div>
    </section>

    <section class="upload-grid">
      ${uploadBox("Income (sudah dilepas)", "Upload .xlsx", "file")}
      ${uploadBox("Order.all", "Upload .xlsx", "cube")}
      ${uploadBox("Iklan Keseluruhan", "Upload .csv", "megaphone")}
      ${uploadBox("Iklan per Produk", "Upload .csv", "file")}
    </section>

    <div class="hint"><span>💡</span> Bisa upload beberapa periode — file baru otomatis digabung (dedupe by no. pesanan). Minimal Income + Order.all. <a href="#">Import backup</a></div>
    <div class="privacy">${icons.shield}<span>Semua perhitungan terjadi di perangkat kamu. Tidak ada data yang dikirim ke server.</span></div>
  </main>`;
}

function uploadBox(title, sub, icon){
  return `<label class="dropbox"><input type="file" hidden/><div class="box-icon">${icons[icon]}</div><div><div class="box-title">${title}</div><div class="box-sub">${sub}</div></div></label>`;
}

function placeholderPage(title, subtitle, active){
  return `<main class="content">
    <section class="page-head">
      <h1>${title}</h1><p>${subtitle}</p>
    </section>
    <section class="placeholder">
      <div class="placeholder-icon">${icons.grid}</div>
      <h2>${title}</h2>
      <p>Halaman ini sudah disiapkan dengan layout dan navigasi ProfitTebel Lite. Komponen bisnisnya dapat dihubungkan ke data upload pada tahap berikutnya.</p>
    </section>
  </main>`;
}

function render(page){
  const views = {
    upload: uploadPage(),
    dashboard: placeholderPage("Dashboard Profit","Ringkasan performa toko dan profit dalam satu tampilan.","dashboard"),
    produk: placeholderPage("Master Produk","Kelola produk, SKU, harga jual, dan HPP.","produk"),
    iklan: placeholderPage("Detail Iklan","Analisis biaya iklan dan performa kampanye.","iklan"),
    roas: placeholderPage("Kalkulator ROAS","Hitung ROAS dan target efisiensi iklan.","roas"),
    operasional: placeholderPage("Biaya Operasional","Kelola biaya operasional toko.","operasional")
  };
  document.querySelector("#root").innerHTML = sidebar(page) + (views[page] || views.upload);
  document.querySelectorAll(".nav-item").forEach(btn=>{
    btn.addEventListener("click",()=>{ location.hash=btn.dataset.page; });
  });
  document.querySelectorAll(".dropbox").forEach(box=>{
    box.addEventListener("change",()=>{});
  });
}

function currentPage(){ return location.hash.replace("#","") || "upload"; }
window.addEventListener("hashchange",()=>render(currentPage()));
render(currentPage());