
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
const icon=(s)=>`<svg viewBox="0 0 24 24"><path d="${s}"/></svg>`;
const nav=[
['dashboard','Dashboard Profit','M3 4h7v7H3zM14 4h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
['produk','Master Produk','M4 4h16v16H4z'],
['iklan','Detail Iklan','M3 10l13-5v14L3 14zM16 9h5v6h-5'],
['roas','Kalkulator ROAS','M5 3h14v18H5zM8 7h8M8 11h3M14 11h2M8 15h3M14 15h2'],
['operasional','Biaya Operasional','M4 7h16v12H4zM7 7V5h10v2'],
['upload','Upload Data','M12 16V4M7 9l5-5 5 5M5 14v5h14v-5']
];

const state={page:'dashboard', orders:1111, products:1442, omzet:67446057, diskon:65000, biaya:12612000, income:48500000, hpp:17600000, ads:10100000, ops:0, profit:20835298};

function sidebar(){
 return `<aside class="sidebar"><div class="brand"><div class="brand-mark">↗</div><div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div></div>
 <div class="store-wrap"><button class="store-select">▣ <span>Toko Utama</span><span class="arrow">⌄</span></button></div>
 <nav class="nav">${nav.map(n=>`<button class="nav-item ${state.page===n[0]?'active':''}" data-page="${n[0]}">${icon(n[2])}<span>${n[1]}</span></button>`).join('')}</nav></aside>`
}
function dashboard(){
 return `<main class="content">
 ${head('Dashboard Profit','1.111 order (+208 est.) · 2026-07-01 → 2026-07-31 · incl. estimasi order yang uangnya belum cair')}
 <div class="metric-grid">
 ${card('Total Omzet',rupiah(state.omzet),'1.111 order · +208 estimasi','')}
 ${card('Total Diskon & Promo',rupiah(state.diskon),'Voucher, cashback, refund','orange')}
 ${card('Total Biaya',rupiah(state.biaya),'Fee marketplace (Shopee) · estimasi','orange')}
 ${card('Income dari Marketplace',rupiah(state.income),'Total penghasilan Shopee · estimasi','green')}
 ${card('HPP + Packaging',rupiah(state.hpp),'Harga pokok + packaging','orange')}
 ${card('Biaya Iklan',rupiah(state.ads),'Ad spend + PPN 11%','orange')}
 ${card('Biaya Operasional',rupiah(state.ops),'Klik buat tambah','')}
 ${card('Real Profit',rupiah(state.profit),'Income − HPP − Iklan − Ops','green')}
 </div>
 <section class="panel greenbox"><div class="panel-head" style="background:transparent;border:0"><h2>🎯 Cakupan Data & Estimasi <span style="float:right;color:#087e61">81%</span></h2><p>Real Profit di atas = biaya aktual (order yang uangnya sudah cair) + estimasi</p></div>
 <div class="progress"><i></i></div><div class="line"><span>🟢 903 order biaya aktual (81%)</span><span>🟡 208 order estimasi (19%)</span></div>
 <div class="cards3" style="margin-top:14px"><div class="mini"><span>Total Order (non-batal)</span><b>1111</b><small>153 batal dikecualikan</small></div><div class="mini"><span>Uang Sudah Cair (aktual)</span><b class="green">903</b><small>Rp 39.099.510 (Net Income)</small></div><div class="mini"><span>Estimasi (uang belum cair)</span><b class="orange">208</b><small>Rp 9.383.178 (Net est.)</small></div></div></section>
 ${flow()} ${sources()} ${trend()} ${courier()} </main>`
}
function flow(){
 return `<section class="panel"><div class="panel-head"><h2>ℹ️ Alur Dana: Omzet → Real Profit</h2><p>Rincian semua pengurangan dari omzet kotor sampai profit bersih</p></div><div class="flow">
 ${line('Nilai Semua Order',rupiah(67446057),'100.0%')}
 ${line('Disisihkan dulu: order belum cair',rupiah(13053285),'19.4%')}
 ${line('Omzet yang Uangnya Sudah Cair',rupiah(54392772),'80.6%')}
 ${line('Diskon & Promo yang Kamu Tanggung',rupiah(65000),'0.1%')}
 ${line('Subtotal setelah Diskon',rupiah(54327772),'80.5%')}
 ${line('Biaya Marketplace (Shopee)',rupiah(10134167),'15.0%')}
 ${line('Income dari Marketplace',rupiah(39099510),'58.0%')}
 ${line('HPP + Packaging',rupiah(14203000),'21.1%')}
 ${line('Biaya Iklan + termasuk PPN 11%',rupiah(10081390),'14.9%')}
 ${line('Real Profit',rupiah(20835298),'30.9%')}
 </div></section>`
}
function sources(){
 return `<section class="panel"><div class="panel-head"><h2>🎯 Sumber Omzet</h2><p>Dari mana omzet datang: iklan berbayar, affiliate (AMS), atau organik</p></div><div class="flow">
 ${line('Iklan (Berbayar)',rupiah(37799524),'56.0%')}
 ${line('Affiliate (AMS)',rupiah(16593248),'24.6%')}
 ${line('Organik',rupiah(0),'0.0%')}
 ${line('Uang belum cair (est.)',rupiah(13053285),'19.4%')}
 ${line('Total Omzet',rupiah(67446057),'100.0%')}
 </div></section>`
}
function trend(){
 return `<section class="panel"><div class="panel-head"><h2>Tren Harian</h2></div><div class="chart">${[45,61,48,72,35,68,54,42,60,51,74,47,58,35,66,53,40,62,48,58,30].map(x=>`<i class="bar" style="height:${x}%"></i>`).join('')}</div></section>`
}
function courier(){
 return `<section class="panel"><div class="panel-head"><h2>Analisa Kurir</h2></div><div class="flow">${line('SPX Hemat','470 order · Rp 4.003.801','Rp 8.519/order')}${line('SPX Standard','393 order · Rp 3.317.099','Rp 8.440/order')}${line('Pos Reguler','39 order · Rp 630.500','Rp 16.167/order')}${line('J&T Cargo','1 order · Rp 23.500','Rp 23.500/order')}</div></section>`
}
function products(){
 const rows=[['BERRITZ Ekstrak Ketapang Pekat...','KTP600','95',39953,4914252,1395306,3518946,7000],['BERRITZ Ziklin Glass Cairan Pembers...','CPKK','65',53356,3681583,946260,2735324,13000]];
 return `<main class="content">${head('Analisa per Produk','Profit bersih tiap SKU (sudah dipotong iklan & ops) · ikut periode di atas')}
 <section class="panel"><div class="toolbar"><h2>Analisa per Produk</h2><input class="search" placeholder="Cari produk / SKU..."></div><div class="table-wrap"><table class="table"><thead><tr><th>Produk</th><th>Variasi</th><th>Order</th><th>Harga Jual</th><th>Omzet</th><th>Potongan MP</th><th>Pendapatan</th><th>HPP / unit</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b><br><small>${r[1]}</small></td><td>${r[1]}</td><td>${r[2]}</td><td>${rupiah(r[3])}</td><td>${rupiah(r[4])}</td><td class="red">−${rupiah(r[5])}</td><td>${rupiah(r[6])}</td><td>${rupiah(r[7])}</td></tr>`).join('')}</tbody></table></div></section></main>`
}
function orders(){
 const rows=[['260707368J7EE1','07/07/2026','BERRITZ Alas...','20.000','20.000','0','−','0','2.728','−2.728'],['260727QW5H3KE9','27/07/2026','BERRITZ Alas...','10.000','6.783','3.217','−3.000','217','1.364','−1.147'],['2607098A96MRR1','09/07/2026','BERRITZ Dried...','21.560','13.234','8.326','−8.000','326','2.941','−2.615']];
 return `<main class="content">${head('Detail per Order','Ada 7 order rugi total Rp 21.550 dari 1111 order · ikut periode di atas')}<section class="panel"><div class="toolbar"><h2>Detail per Order</h2><div><button class="btn primary">Rugi aja</button> <button class="btn">Semua order</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Pesanan</th><th>Produk</th><th>Omzet</th><th>Potongan MP</th><th>Pendapatan</th><th>HPP</th><th>Iklan</th><th>Profit Bersih</th><th>Sebab</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}<br><small>${r[1]}</small></td><td>${r[2]}</td><td>Rp ${r[3]}</td><td class="red">−Rp ${r[4]}</td><td>Rp ${r[5]}</td><td class="red">${r[6]}</td><td>Rp ${r[7]}</td><td class="red">Rp ${r[9]}</td><td><span class="orange">—</span></td></tr>`).join('')}</tbody></table></div></section></main>`
}
function upload(){
 return `<main class="content">${head('Upload Laporan','Gabungkan laporan Shopee / TikTok jadi satu dashboard. Semua diproses di browser kamu.')}
 <section class="upload-grid">${[['Income (sudah dilepas)','income','.xlsx,.xls'],['Order.all','orders','.xlsx,.xls'],['Iklan Keseluruhan','ads','.csv'],['Iklan per Produk','adsProduct','.csv']].map(x=>`<label class="upload-box"><input hidden type="file" accept="${x[2]}" data-type="${x[1]}"><div>⇧</div><b>${x[0]}</b><span>Pilih file</span></label>`).join('')}</section>
 <p class="footer-note">💡 Bisa upload beberapa periode — file baru otomatis digabung. Data diproses di browser kamu.</p>
 <section class="panel"><div class="panel-head"><h2>Data tersimpan</h2><p>Income 3.722 · Order.all 1.264 · Iklan 110</p></div><div class="flow">${line('Income','3.722 baris','tersimpan')}${line('Order.all','1.264 baris','tersimpan')}${line('Order Produk','1.373 baris','tersimpan')}${line('HPP History','102 produk','tersimpan')}</div></section></main>`
}
function generic(title,sub){return `<main class="content">${head(title,sub)}<section class="panel"><div class="empty">Halaman ${title} siap digunakan.</div></section></main>`}
function head(t,s){return `<div class="page-head"><h1>${t}</h1><p>${s}</p></div>`}
function card(l,v,s,c){return `<div class="metric ${c||''}"><span>${l}</span><b>${v}</b><small>${s}</small></div>`}
function line(a,b,c){return `<div class="line"><span>${a}</span><span class="value">${b} <small>${c||''}</small></span></div>`}

function render(){
 let body=state.page==='dashboard'?dashboard():state.page==='produk'?products():state.page==='iklan'?generic('Detail Iklan','Rincian biaya iklan keseluruhan dan per produk.'):state.page==='roas'?generic('Kalkulator ROAS','Simulasi target ROAS dan biaya iklan.'):state.page==='operasional'?generic('Biaya Operasional','Catat biaya operasional toko.'):state.page==='upload'?upload():orders();
 document.getElementById('app').innerHTML=`<div class="app">${sidebar()}${body}</div>`;
 document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render()});
}
render();
