
import * as XLSX from "xlsx";
import "./style.css";

const I={
shop:'<svg viewBox="0 0 24 24"><path d="M4 10v9h16v-9"/><path d="M3 10h18l-2-6H5l-2 6Z"/><path d="M8 19v-5h8v5"/></svg>',
grid:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
box:'<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4 8-4M12 11.5V21"/></svg>',
ad:'<svg viewBox="0 0 24 24"><path d="m4 10 12-5v14L4 14v-4Z"/><path d="M16 9h4v6h-4"/></svg>',
calc:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/></svg>',
wallet:'<svg viewBox="0 0 24 24"><path d="M4 7h15a1 1 0 0 1 1 1v11H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13"/><path d="M16 13h4"/></svg>',
upload:'<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
file:'<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/></svg>',
check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
chev:'<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>',
search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>'
};

const NAV=[
["dashboard","Dashboard Profit","grid"],
["produk","Master Produk","box"],
["iklan","Detail Iklan","ad"],
["roas","Kalkulator ROAS","calc"],
["operasional","Biaya Operasional","wallet"],
["upload","Upload Data","upload"]
];

const TYPES={
income:{title:"Income (sudah dilepas)",accept:".xlsx,.xls,.csv",ext:"Upload .xlsx",icon:"file"},
orders:{title:"Order.all",accept:".xlsx,.xls,.csv",ext:"Upload .xlsx",icon:"box"},
ads:{title:"Iklan Keseluruhan",accept:".csv,.xlsx,.xls",ext:"Upload .csv",icon:"ad"},
adsProduct:{title:"Iklan per Produk",accept:".csv,.xlsx,.xls",ext:"Upload .csv",icon:"file"}
};

const blank={files:{},data:{income:[],orders:[],ads:[],adsProduct:[]},products:{},ops:[]};
let S=load();
function load(){try{return {...blank,...JSON.parse(localStorage.getItem("pmk_full")||"{}")}}catch{return structuredClone(blank)}}
function save(){localStorage.setItem("pmk_full",JSON.stringify(S))}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function num(v){
 if(typeof v==="number") return isFinite(v)?v:0;
 let s=String(v??"").trim().replace(/[^\d,.-]/g,"");
 if(!s)return 0;
 if(s.includes(",")&&s.includes(".")) s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
 else if(s.includes(",") && !s.includes(".")) s=s.replace(",",".");
 return Number(s)||0
}
function money(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0)}
function norm(s){return String(s??"").toLowerCase().replace(/[\s_.:()/\-]+/g,"")}
function findKey(row, patterns){
 const ks=Object.keys(row); return ks.find(k=>patterns.some(p=>norm(k).includes(norm(p))))
}
function val(row,patterns){const k=findKey(row,patterns);return k?row[k]:""}
function orderId(r){return String(val(r,["no pesanan","nomor pesanan","order id","orderid","order number","no order"])||"").trim()}
function productName(r){return String(val(r,["nama produk","product name","produk","nama barang","product"])||"").trim()}
function revenue(r){
 return num(val(r,["total penghasilan","penghasilan","total pesanan","jumlah dibayar","total pembayaran","omzet","penjualan","revenue","harga setelah diskon","harga jual"]))
}
function qty(r){return num(val(r,["jumlah","qty","quantity","kuantitas"]))||1}
function adSpend(r){return num(val(r,["biaya iklan","pengeluaran iklan","belanja iklan","ad spend","spend","cost"]))}
function nav(active){return `<aside class="sidebar"><div class="brand"><div class="brand-mark">↗</div><div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div></div><div class="store-wrap"><button class="store-select">${I.shop}<span>Toko Utama</span><span class="arrow">${I.chev}</span></button></div><nav>${NAV.map(x=>`<button class="nav-item ${active===x[0]?"active":""}" data-page="${x[0]}">${I[x[2]]}<span>${x[1]}</span></button>`).join("")}</nav></aside>`}
function head(title,sub){return `<div class="page-head"><h1>${title}</h1><p>${sub}</p></div>`}
function card(label,value,sub=""){return `<div class="metric"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`}

function totals(){
 const income=S.data.income, orders=S.data.orders;
 const omzet=income.reduce((a,r)=>a+revenue(r),0);
 const pesanan=new Set(orders.map(orderId).filter(Boolean)).size || orders.length;
 const qtySold=orders.reduce((a,r)=>a+qty(r),0);
 const iklan=S.data.ads.reduce((a,r)=>a+adSpend(r),0)+S.data.adsProduct.reduce((a,r)=>a+adSpend(r),0);
 const ops=S.ops.reduce((a,r)=>a+num(r.amount),0);
 let hpp=0;
 orders.forEach(r=>{const p=productName(r),q=qty(r),h=num(S.products[p]?.hpp);hpp+=h*q});
 return {omzet,pesanan,qtySold,iklan,ops,hpp,profit:omzet-hpp-iklan-ops};
}

function dashboard(){
 const t=totals();
 const top=Object.entries(S.products).slice(0,8);
 return `<main class="content">${head("Dashboard Profit","Ringkasan performa toko berdasarkan laporan yang sudah di-upload.")}
 <div class="metric-grid">${card("Omzet",money(t.omzet),"dari Income")}${card("Pesanan",t.pesanan.toLocaleString("id-ID"),"order unik")}${card("Produk Terjual",t.qtySold.toLocaleString("id-ID"),"qty")}${card("HPP",money(t.hpp),"berdasarkan Master Produk")}${card("Biaya Iklan",money(t.iklan),"laporan iklan")}${card("Biaya Operasional",money(t.ops),"biaya tercatat")}${card("Profit",money(t.profit),"estimasi profit")}${card("Margin Profit",t.omzet?(t.profit/t.omzet*100).toFixed(2)+"%":"0%","profit ÷ omzet")}</div>
 <section class="panel"><div class="panel-title"><h2>Ringkasan Profit</h2><span>Realtime dari data lokal</span></div><div class="profit-row"><div><span>Omzet</span><b>${money(t.omzet)}</b></div><div><span>Total biaya</span><b>${money(t.hpp+t.iklan+t.ops)}</b></div><div><span>Profit</span><b class="${t.profit>=0?"positive":"negative"}">${money(t.profit)}</b></div></div></section>
 <section class="panel"><div class="panel-title"><h2>Master Produk Terisi</h2><span>${Object.keys(S.products).length} produk</span></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th>HPP</th><th>Harga Jual</th></tr></thead><tbody>${top.length?top.map(([p,x])=>`<tr><td>${esc(p)}</td><td>${money(x.hpp)}</td><td>${money(x.price)}</td></tr>`).join(""):`<tr><td colspan="3" class="empty">Belum ada HPP. Isi Master Produk agar profit bersih dapat dihitung.</td></tr>`}</tbody></table></div></section>
 </main>`
}

function uploadBox(id){
 const t=TYPES[id],f=S.files[id];
 return `<label class="dropbox ${f?"uploaded":""}" data-upload="${id}"><input hidden type="file" accept="${t.accept}"><div class="box-icon">${I[t.icon]}</div><div><div class="box-title">${t.title}</div><div class="box-sub">${f?`${esc(f.name)} • ${f.rows.toLocaleString("id-ID")} baris`:t.ext}</div></div></label>`
}
function uploadPage(msg=""){
 return `<main class="content">${msg?`<div class="notice">${I.check}<span>${esc(msg)}</span></div>`:""}${head("Upload Laporan","Gabungkan laporan Shopee/TikTok jadi satu dashboard. Semua diproses di browser kamu.")}
 <section class="store-card"><div class="store-label">${I.shop}<strong>Upload ke toko:</strong><span class="pill">Toko Utama (shopee)</span></div><div class="new-store"><input placeholder="Nama toko baru"><div><select><option>Shopee</option><option>TikTok</option></select><button>＋ Tambah</button></div></div></section>
 <section class="upload-grid">${uploadBox("income")}${uploadBox("orders")}${uploadBox("ads")}${uploadBox("adsProduct")}</section>
 <div class="hint">💡 Bisa upload beberapa periode — file baru otomatis digabung (dedupe by no. pesanan). Minimal Income + Order.all. <a href="#" id="reset">Reset data</a></div>
 <div class="privacy">◉ Semua perhitungan terjadi di perangkat kamu. Tidak ada data yang dikirim ke server.</div></main>`
}

async function readFile(file){
 const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
 let rows=[];for(const sn of wb.SheetNames){const ws=wb.Sheets[sn];rows.push(...XLSX.utils.sheet_to_json(ws,{defval:""}))}
 return rows
}
function merge(oldRows,newRows){
 const m=new Map();[...oldRows,...newRows].forEach(r=>m.set(orderId(r)||JSON.stringify(r),r));return [...m.values()]
}
async function upload(id,file){
 const rows=await readFile(file);if(!rows.length)throw Error("Tidak ada data");
 S.data[id]=merge(S.data[id]||[],rows);S.files[id]={name:file.name,rows:S.data[id].length};save();
 render("Berhasil: "+file.name+" — "+rows.length.toLocaleString("id-ID")+" baris dibaca. Data sekarang tersedia di Dashboard Profit.");
}

function products(){
 const rows=S.data.orders, names=[...new Set(rows.map(productName).filter(Boolean))];
 const all=[...new Set([...Object.keys(S.products),...names])];
 return `<main class="content">${head("Master Produk","Kelola harga jual dan HPP untuk perhitungan profit.")}<section class="panel"><div class="toolbar"><input id="prodSearch" placeholder="Cari produk..."><button class="primary" id="saveProducts">Simpan HPP</button></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th>Harga Jual</th><th>HPP</th><th>Margin</th></tr></thead><tbody>${all.map(p=>{const x=S.products[p]||{};return `<tr><td>${esc(p)}</td><td><input class="cell" data-price="${esc(p)}" value="${x.price||""}" placeholder="0"></td><td><input class="cell" data-hpp="${esc(p)}" value="${x.hpp||""}" placeholder="0"></td><td>${x.price&&x.hpp?money(num(x.price)-num(x.hpp)):"—"}</td></tr>`}).join("")||`<tr><td colspan="4" class="empty">Upload Order.all terlebih dahulu.</td></tr>`}</tbody></table></div></section></main>`
}

function ads(){
 const rows=[...S.data.ads,...S.data.adsProduct], spend=rows.reduce((a,r)=>a+adSpend(r),0), sales=rows.reduce((a,r)=>a+revenue(r),0);
 return `<main class="content">${head("Detail Iklan","Detail biaya dan performa iklan dari laporan yang sudah di-upload.")}<div class="metric-grid">${card("Belanja Iklan",money(spend),"total biaya")}${card("Penjualan Iklan",money(sales),"nilai yang terbaca")}${card("ROAS",spend?sales/spend.toFixed? (sales/spend).toFixed(2):"0":"0","penjualan ÷ iklan")}</div><section class="panel"><div class="panel-title"><h2>Data Iklan</h2><span>${rows.length.toLocaleString("id-ID")} baris</span></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th>Biaya</th><th>Penjualan</th></tr></thead><tbody>${rows.slice(0,100).map(r=>`<tr><td>${esc(productName(r)||val(r,["nama"] )||"—")}</td><td>${money(adSpend(r))}</td><td>${money(revenue(r))}</td></tr>`).join("")||`<tr><td colspan="3" class="empty">Belum ada laporan iklan.</td></tr>`}</tbody></table></div></section></main>`
}

function roas(){
 return `<main class="content">${head("Kalkulator ROAS","Hitung target ROAS dan estimasi hasil iklan.")}<section class="panel calc"><label>Omzet dari iklan<input id="rSales" type="number" placeholder="1000000"></label><label>Biaya iklan<input id="rSpend" type="number" placeholder="200000"></label><div class="calc-result"><span>ROAS</span><b id="rResult">0.00x</b></div></section></main>`
}
function ops(){
 return `<main class="content">${head("Biaya Operasional","Catat biaya operasional yang akan mengurangi profit.")}<section class="panel"><div class="toolbar"><input id="opName" placeholder="Nama biaya"><input id="opAmount" type="number" placeholder="Nominal"><button class="primary" id="addOp">＋ Tambah</button></div><div class="table-wrap"><table><thead><tr><th>Biaya</th><th>Nominal</th><th></th></tr></thead><tbody>${S.ops.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td><button class="danger" data-del="${i}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="3" class="empty">Belum ada biaya operasional.</td></tr>`}</tbody></table></div></section></main>`
}
function detail(){
 const rows=S.data.orders;
 return `<main class="content">${head("Detail Iklan","Detail transaksi/order yang tersedia dari laporan.")}<section class="panel"><div class="panel-title"><h2>Order.all</h2><span>${rows.length.toLocaleString("id-ID")} baris</span></div><div class="table-wrap"><table><thead><tr><th>No. Pesanan</th><th>Produk</th><th>Qty</th><th>Nilai</th></tr></thead><tbody>${rows.slice(0,150).map(r=>`<tr><td>${esc(orderId(r)||"—")}</td><td>${esc(productName(r)||"—")}</td><td>${qty(r)}</td><td>${money(revenue(r))}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">Belum ada Order.all.</td></tr>`}</tbody></table></div></section></main>`
}

function render(msg=""){
 const p=location.hash.slice(1)||"dashboard";
 let body=p==="dashboard"?dashboard():p==="upload"?uploadPage(msg):p==="produk"?products():p==="iklan"?ads():p==="roas"?roas():p==="operasional"?ops():detail();
 document.querySelector("#root").innerHTML=nav(p)+body;bind(p)
}
function bind(p){
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>location.hash=b.dataset.page);
 document.querySelectorAll("[data-upload]").forEach(box=>{const inp=box.querySelector("input");box.onclick=e=>{if(e.target!==inp)inp.click()};inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{await upload(box.dataset.upload,f)}catch(e){render("File gagal dibaca: "+e.message)}}});
 document.querySelector("#reset")?.addEventListener("click",e=>{e.preventDefault();if(confirm("Hapus semua data upload?")){S=structuredClone(blank);save();render("Data berhasil direset.")}});
 document.querySelector("#saveProducts")?.addEventListener("click",()=>{document.querySelectorAll("[data-hpp]").forEach(x=>{const p=x.dataset.hpp;S.products[p]??={};S.products[p].hpp=num(x.value);const pr=document.querySelector(`[data-price="${CSS.escape(p)}"]`);S.products[p].price=num(pr?.value)});save();render("Master Produk berhasil disimpan.")});
 document.querySelector("#addOp")?.addEventListener("click",()=>{const n=document.querySelector("#opName").value,a=num(document.querySelector("#opAmount").value);if(n&&a){S.ops.push({name:n,amount:a});save();render("Biaya operasional ditambahkan.")}});
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{S.ops.splice(Number(b.dataset.del),1);save();render()});
 if(p==="roas"){const a=document.querySelector("#rSales"),b=document.querySelector("#rSpend"),o=document.querySelector("#rResult");const f=()=>o.textContent=(num(b.value)?(num(a.value)/num(b.value)).toFixed(2):"0.00")+"x";a.oninput=f;b.oninput=f}
}
addEventListener("hashchange",()=>render());render();
