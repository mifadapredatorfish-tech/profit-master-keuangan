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

const STORE_KEY="pt_lite_stores";
const ACTIVE_KEY="pt_lite_active";
const PREFIX="pt_lite_";
const DB_NAME="pt_lite";
const DB_STORE="kv";

const emptyData=()=>({
  income:[], orders:[], orderProducts:[], ads:[], adsProduct:[]
});
const blank=()=>({
  files:{}, data:emptyData(), hpp:[], hppHistory:[], hppMeta:{}, opCosts:[], skuStore:{}
});

let S=blank();
let activeStoreId="default";
let dbPromise=null;

function clone(x){return structuredClone(x)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function norm(s){return String(s??"").toLowerCase().replace(/[\s_.:()/\-]+/g,"")}
function num(v){
  if(typeof v==="number") return Number.isFinite(v)?v:0;
  let s=String(v??"").trim().replace(/[^\d,.-]/g,"");
  if(!s)return 0;
  if(s.includes(",")&&s.includes(".")) s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
  else if(s.includes(",")&&!s.includes(".")) s=s.replace(",",".");
  return Number(s)||0;
}
function money(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0)}
function findKey(row,patterns){
  const ks=Object.keys(row||{});
  return ks.find(k=>patterns.some(p=>norm(k).includes(norm(p))));
}
function val(row,patterns){const k=findKey(row,patterns);return k?row[k]:""}
function orderId(r){return String(val(r,["no pesanan","nomor pesanan","order id","orderid","order number","no order","id pesanan"])||"").trim()}
function productName(r){return String(val(r,["nama produk","product name","nama barang","product","produk"])||"").trim()}
function variation(r){return String(val(r,["nama variasi","variasi","variation","variation name"])||"").trim()}
function sku(r){return String(val(r,["sku","seller sku","sku penjual","kode produk","product code","item sku"])||"").trim()}
function marketplaceProductId(r){return String(val(r,["marketplace product id","product id","item id","id produk"])||"").trim()}
function qty(r){return num(val(r,["jumlah","qty","quantity","kuantitas","jumlah produk"]))||1}
function returnedQty(r){return num(val(r,["jumlah retur","qty retur","returned qty","return quantity","quantity returned"]))}
function dateValue(r){
  const v=val(r,["waktu pesanan","tanggal pesanan","order date","created time","waktu","tanggal"]);
  if(v instanceof Date)return v;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
}
function dateKey(v){
  const d=v instanceof Date?v:new Date(v);
  return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10);
}
function revenue(r){
  return num(val(r,[
    "total penghasilan","penghasilan bersih","total penghasilan bersih",
    "jumlah dibayar","total pembayaran","harga setelah diskon",
    "total pesanan","omzet","penjualan","revenue","harga jual"
  ]));
}
function netIncome(r){
  const direct=val(r,["penghasilan bersih","net income","net proceeds","total penghasilan"]);
  return direct===""?revenue(r):num(direct);
}
function adSpend(r){return num(val(r,["biaya iklan","pengeluaran iklan","belanja iklan","ad spend","spend","cost"]))}
function adSales(r){return num(val(r,["omzet penjualan","penjualan iklan","gmv langsung","direct gmv","sales","revenue"]))}
function periodOf(r){
  const d=dateValue(r);
  if(d)return d.toISOString().slice(0,7);
  const s=String(val(r,["periode","period","bulan","month"])||"");
  const m=s.match(/(20\d{2})[-/](\d{1,2})/);
  return m?`${m[1]}-${String(m[2]).padStart(2,"0")}`:"";
}

function openDB(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){resolve(null);return}
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>resolve(null);
  });
  return dbPromise;
}
async function dbGet(key){
  const db=await openDB();
  if(!db)return JSON.parse(localStorage.getItem(key)||"null");
  return new Promise(resolve=>{
    const tx=db.transaction(DB_STORE,"readonly"), q=tx.objectStore(DB_STORE).get(key);
    q.onsuccess=()=>resolve(q.result??null); q.onerror=()=>resolve(null);
  });
}
async function dbSet(key,value){
  localStorage.setItem(key,JSON.stringify(value));
  const db=await openDB();
  if(!db)return;
  await new Promise(resolve=>{
    const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=resolve;
  });
}
function storeKey(){return `${PREFIX}data_${activeStoreId}`}
async function save(){
  await dbSet(storeKey(),S);
  await dbSet(STORE_KEY,stores);
  await dbSet(ACTIVE_KEY,activeStoreId);
}
let stores=[{id:"default",name:"Toko Utama",marketplace:"shopee"}];

async function loadAll(){
  const ss=await dbGet(STORE_KEY); if(Array.isArray(ss)&&ss.length)stores=ss;
  const a=await dbGet(ACTIVE_KEY); if(a)activeStoreId=a;
  if(!stores.some(x=>x.id===activeStoreId))activeStoreId=stores[0]?.id||"default";
  const old=await dbGet(storeKey());
  if(old){
    S={...blank(),...old,data:{...emptyData(),...(old.data||{})},files:old.files||{}};
  }else{
    S=blank();
    await save();
  }
}

function currentStore(){return stores.find(x=>x.id===activeStoreId)||stores[0]}

function nav(active){
  return `<aside class="sidebar"><div class="brand"><div class="brand-mark">↗</div><div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div></div>
  <div class="store-wrap"><button class="store-select" id="storeSelect">${I.shop}<span>${esc(currentStore()?.name||"Toko Utama")}</span><span class="arrow">${I.chev}</span></button></div>
  <nav>${NAV.map(x=>`<button class="nav-item ${active===x[0]?"active":""}" data-page="${x[0]}">${I[x[2]]}<span>${x[1]}</span></button>`).join("")}</nav></aside>`
}
function head(title,sub){return `<div class="page-head"><h1>${title}</h1><p>${sub}</p></div>`}
function card(label,value,sub=""){return `<div class="metric"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`}

function mergeBy(rows,newRows,keyFn){
  const m=new Map();
  for(const r of rows||[]){const k=keyFn(r)||JSON.stringify(r);m.set(k,r)}
  for(const r of newRows||[]){const k=keyFn(r)||JSON.stringify(r);m.set(k,r)}
  return [...m.values()];
}
function mergeIncome(oldRows,newRows){
  return mergeBy(oldRows,newRows,orderId);
}
function mergeOrders(oldRows,newRows){
  return mergeBy(oldRows,newRows,orderId);
}
function mergeOrderProducts(oldRows,newRows){
  return mergeBy(oldRows,newRows,r=>{
    const o=orderId(r),p=marketplaceProductId(r)||sku(r)||productName(r);
    return o&&p?`${o}|${p}`:"";
  });
}
function mergeAds(oldRows,newRows){
  return mergeBy(oldRows,newRows,r=>{
    const p=periodOf(r),s=sku(r)||marketplaceProductId(r)||productName(r);
    return p&&s?`${p}|${s}`:JSON.stringify(r);
  });
}

async function readFile(file){
  const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
  let rows=[];
  for(const sn of wb.SheetNames){
    const ws=wb.Sheets[sn];
    rows.push(...XLSX.utils.sheet_to_json(ws,{defval:""}));
  }
  return rows;
}

function normalizeOrderRows(rows){
  return rows.map(r=>({...r,
    __order_number:orderId(r),
    __sku:sku(r),
    __product:productName(r),
    __variation:variation(r),
    __qty:qty(r),
    __returned_qty:returnedQty(r),
    __date:dateKey(dateValue(r))
  }));
}

function rebuildProducts(){
  const all=[...(S.data.orders||[]),...(S.data.orderProducts||[])];
  for(const r of all){
    const k=sku(r)||marketplaceProductId(r);
    if(!k)continue;
    S.hppMeta[k]??={sku:k,product:productName(r),variation:variation(r)};
    if(!S.skuStore[k])S.skuStore[k]=activeStoreId;
  }
}

function hppFor(k,orderDate){
  if(!k)return 0;
  const hist=(S.hppHistory||[]).filter(x=>String(x.sku||"")===String(k));
  const d=orderDate?new Date(orderDate):null;
  const valid=hist.filter(x=>!d||!x.from||new Date(x.from)<=d).sort((a,b)=>new Date(a.from||0)-new Date(b.from||0));
  if(valid.length)return num(valid.at(-1).hpp);
  const direct=(S.hpp||[]).find(x=>String(x.sku||"")===String(k));
  return num(direct?.hpp);
}

function effectiveQty(r){return Math.max(0,qty(r)-returnedQty(r))}
function buildOrderProducts(){
  const rows=S.data.orderProducts?.length?S.data.orderProducts:S.data.orders;
  return rows;
}

function totals(){
  const income=S.data.income||[], orders=S.data.orders||[];
  const omzet=income.reduce((a,r)=>a+revenue(r),0);
  const incomeNet=income.reduce((a,r)=>a+netIncome(r),0);
  const pesanan=new Set([...income,...orders].map(orderId).filter(Boolean)).size;
  const qtySold=orders.reduce((a,r)=>a+effectiveQty(r),0);
  const iklan=(S.data.ads||[]).reduce((a,r)=>a+adSpend(r),0)+(S.data.adsProduct||[]).reduce((a,r)=>a+adSpend(r),0);
  const iklanRiil=iklan*1.11;
  const ops=(S.opCosts||[]).reduce((a,r)=>a+num(r.amount),0);
  let hpp=0;
  for(const r of buildOrderProducts()){
    const k=sku(r)||marketplaceProductId(r);
    hpp+=hppFor(k,dateValue(r))*effectiveQty(r);
  }
  const profit=incomeNet-hpp-iklanRiil-ops;
  return {omzet,incomeNet,pesanan,qtySold,iklan,iklanRiil,ops,hpp,profit};
}

function dashboard(){
  const t=totals();
  return `<main class="content">${head("Dashboard Profit","Ringkasan performa toko berdasarkan laporan yang sudah di-upload.")}
  <div class="metric-grid">${card("Omzet",money(t.omzet),"dari Income")}${card("Pesanan",t.pesanan.toLocaleString("id-ID"),"order unik")}${card("Produk Terjual",t.qtySold.toLocaleString("id-ID"),"qty bersih retur")}${card("HPP",money(t.hpp),"berdasarkan SKU + histori")}${card("Biaya Iklan",money(t.iklanRiil),"termasuk PPN 11%")}${card("Biaya Operasional",money(t.ops),"biaya tercatat")}${card("Real Profit",money(t.profit),"income net − biaya")}${card("Margin Profit",t.incomeNet?(t.profit/t.incomeNet*100).toFixed(2)+"%":"0%","profit ÷ income")}</div>
  <section class="panel"><div class="panel-title"><h2>Ringkasan Profit</h2><span>Data toko aktif</span></div><div class="profit-row"><div><span>Income Bersih</span><b>${money(t.incomeNet)}</b></div><div><span>Total biaya</span><b>${money(t.hpp+t.iklanRiil+t.ops)}</b></div><div><span>Real Profit</span><b class="${t.profit>=0?"positive":"negative"}">${money(t.profit)}</b></div></div></section>
  <section class="panel"><div class="panel-title"><h2>Data</h2><span>Income ${S.data.income.length} · Order.all ${S.data.orders.length} · Iklan ${S.data.ads.length+S.data.adsProduct.length}</span></div>
  <div class="table-wrap"><table><thead><tr><th>Jenis</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>
  <tr><td>Income</td><td>${S.data.income.length.toLocaleString("id-ID")}</td><td>tersimpan</td></tr>
  <tr><td>Order.all</td><td>${S.data.orders.length.toLocaleString("id-ID")}</td><td>tersimpan</td></tr>
  <tr><td>Order Produk</td><td>${S.data.orderProducts.length.toLocaleString("id-ID")}</td><td>tersimpan</td></tr>
  <tr><td>HPP History</td><td>${S.hppHistory.length.toLocaleString("id-ID")}</td><td>tersimpan</td></tr>
  </tbody></table></div></section></main>`
}

function uploadBox(id){
  const t=TYPES[id],f=S.files[id];
  return `<label class="dropbox ${f?"uploaded":""}" data-upload="${id}"><input hidden type="file" accept="${t.accept}"><div class="box-icon">${I[t.icon]}</div><div><div class="box-title">${t.title}</div><div class="box-sub">${f?`${esc(f.name)} • ${f.rows.toLocaleString("id-ID")} baris`:t.ext}</div></div></label>`
}
function uploadPage(msg=""){
  return `<main class="content">${msg?`<div class="notice">${I.check}<span>${esc(msg)}</span></div>`:""}${head("Upload Laporan","Gabungkan laporan Shopee/TikTok jadi satu dashboard. Semua diproses di browser kamu.")}
  <section class="store-card"><div class="store-label">${I.shop}<strong>Upload ke toko:</strong><span class="pill">${esc(currentStore()?.name||"Toko Utama")} (${esc(currentStore()?.marketplace||"shopee")})</span></div>
  <div class="new-store"><input id="newStoreName" placeholder="Nama toko baru"><div><select id="newStoreMarket"><option>Shopee</option><option>TikTok</option></select><button id="addStore">＋ Tambah</button></div></div></section>
  <section class="upload-grid">${uploadBox("income")}${uploadBox("orders")}${uploadBox("ads")}${uploadBox("adsProduct")}</section>
  <div class="hint">💡 File baru otomatis digabung. Income/Order.all dedupe berdasarkan No. Pesanan. Upload ulang tidak menggandakan transaksi. <a href="#" id="reset">Reset data</a></div>
  <div class="privacy">◉ Semua perhitungan dan penyimpanan terjadi di perangkat kamu.</div></main>`
}

function products(){
  rebuildProducts();
  const keys=[...new Set([...Object.keys(S.hppMeta||{}),...(S.data.orders||[]).map(r=>sku(r)||marketplaceProductId(r)).filter(Boolean)])];
  return `<main class="content">${head("Master Produk","Kelola SKU dan HPP historis untuk perhitungan profit.")}<section class="panel"><div class="toolbar"><input id="prodSearch" placeholder="Cari SKU/produk..."><button class="primary" id="saveProducts">Simpan HPP</button></div>
  <div class="table-wrap"><table><thead><tr><th>SKU</th><th>Produk</th><th>Variasi</th><th>HPP Saat Ini</th></tr></thead><tbody>
  ${keys.map(k=>{const m=S.hppMeta[k]||{},h=hppFor(k,new Date());return `<tr><td>${esc(k)}</td><td>${esc(m.product||"")}</td><td>${esc(m.variation||"")}</td><td><input class="cell" data-hpp="${esc(k)}" value="${h||""}" placeholder="0"></td></tr>`}).join("")||`<tr><td colspan="4" class="empty">Upload Order.all terlebih dahulu.</td></tr>`}
  </tbody></table></div></section></main>`
}

function ads(){
  const rows=[...(S.data.ads||[]),...(S.data.adsProduct||[])];
  const spend=rows.reduce((a,r)=>a+adSpend(r),0),sales=rows.reduce((a,r)=>a+adSales(r),0);
  return `<main class="content">${head("Detail Iklan","Detail biaya dan performa iklan dari laporan yang sudah di-upload.")}<div class="metric-grid">${card("Belanja Iklan",money(spend),"sebelum PPN")}${card("Penjualan Iklan",money(sales),"GMV/penjualan iklan")}${card("ROAS",spend?(sales/spend).toFixed(2)+"x":"0.00x","penjualan ÷ ad spend")}</div>
  <section class="panel"><div class="panel-title"><h2>Data Iklan</h2><span>${rows.length.toLocaleString("id-ID")} baris</span></div><div class="table-wrap"><table><thead><tr><th>Periode</th><th>Produk</th><th>Biaya</th><th>Penjualan</th><th>ROAS</th></tr></thead><tbody>
  ${rows.slice(0,150).map(r=>{const s=adSpend(r),g=adSales(r);return `<tr><td>${esc(periodOf(r)||"—")}</td><td>${esc(productName(r)||val(r,["nama"])||sku(r)||"—")}</td><td>${money(s)}</td><td>${money(g)}</td><td>${s?(g/s).toFixed(2)+"x":"—"}</td></tr>`}).join("")||`<tr><td colspan="5" class="empty">Belum ada laporan iklan.</td></tr>`}
  </tbody></table></div></section></main>`
}

function roas(){
  return `<main class="content">${head("Kalkulator ROAS","Hitung target ROAS dan estimasi hasil iklan.")}<section class="panel calc"><label>Omzet dari iklan<input id="rSales" type="number" placeholder="1000000"></label><label>Biaya iklan<input id="rSpend" type="number" placeholder="200000"></label><div class="calc-result"><span>ROAS</span><b id="rResult">0.00x</b></div></section></main>`
}
function ops(){
  return `<main class="content">${head("Biaya Operasional","Catat biaya operasional yang akan mengurangi profit.")}<section class="panel"><div class="toolbar"><input id="opName" placeholder="Nama biaya"><input id="opAmount" type="number" placeholder="Nominal"><button class="primary" id="addOp">＋ Tambah</button></div><div class="table-wrap"><table><thead><tr><th>Biaya</th><th>Nominal</th><th></th></tr></thead><tbody>${S.opCosts.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td><button class="danger" data-del="${i}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="3" class="empty">Belum ada biaya operasional.</td></tr>`}</tbody></table></div></section></main>`
}

function detail(){
  const rows=S.data.orders||[];
  return `<main class="content">${head("Detail Iklan","Detail transaksi/order yang tersedia dari laporan.")}<section class="panel"><div class="panel-title"><h2>Order.all</h2><span>${rows.length.toLocaleString("id-ID")} baris</span></div><div class="table-wrap"><table><thead><tr><th>No. Pesanan</th><th>SKU</th><th>Produk</th><th>Qty Bersih</th><th>Nilai</th></tr></thead><tbody>${rows.slice(0,200).map(r=>`<tr><td>${esc(orderId(r)||"—")}</td><td>${esc(sku(r)||"—")}</td><td>${esc(productName(r)||"—")}</td><td>${effectiveQty(r)}</td><td>${money(revenue(r))}</td></tr>`).join("")||`<tr><td colspan="5" class="empty">Belum ada Order.all.</td></tr>`}</tbody></table></div></section></main>`
}

async function upload(id,file){
  const rows=await readFile(file);
  if(!rows.length)throw Error("Tidak ada data");
  const normalized=normalizeOrderRows(rows);
  if(id==="income")S.data.income=mergeIncome(S.data.income,normalized);
  else if(id==="orders"){
    S.data.orders=mergeOrders(S.data.orders,normalized);
    S.data.orderProducts=mergeOrderProducts(S.data.orderProducts,normalized);
  }else if(id==="ads")S.data.ads=mergeAds(S.data.ads,normalized);
  else if(id==="adsProduct")S.data.adsProduct=mergeAds(S.data.adsProduct,normalized);
  S.files[id]={name:file.name,rows:rows.length,updatedAt:new Date().toISOString()};
  rebuildProducts();
  await save();
  render(`Berhasil: ${file.name} — ${rows.length.toLocaleString("id-ID")} baris dibaca. Data lama tetap dipertahankan dan data transaksi dideduplikasi.`);
}

async function addStore(){
  const name=document.querySelector("#newStoreName")?.value.trim();
  const market=document.querySelector("#newStoreMarket")?.value.toLowerCase()||"shopee";
  if(!name)return;
  const id="store_"+Date.now();
  stores.push({id,name,marketplace:market});
  activeStoreId=id;S=blank();
  await save();render(`Toko ${name} berhasil dibuat.`);
}

async function switchStore(){
  const names=stores.map((s,i)=>`${i+1}. ${s.name} (${s.marketplace})`).join("\n");
  const answer=prompt(`Pilih toko:\n${names}\n\nMasukkan nomor:`);
  const n=Number(answer);
  if(!Number.isInteger(n)||!stores[n-1])return;
  activeStoreId=stores[n-1].id;
  const old=await dbGet(storeKey());
  S=old?{...blank(),...old,data:{...emptyData(),...(old.data||{})}}:blank();
  await save();render();
}

async function resetAll(){
  if(!confirm("Hapus semua data toko aktif?"))return;
  S=blank();await save();render("Data toko aktif berhasil direset.");
}

function bind(p){
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>location.hash=b.dataset.page);
  document.querySelector("#storeSelect")?.addEventListener("click",switchStore);
  document.querySelector("#addStore")?.addEventListener("click",addStore);
  document.querySelectorAll("[data-upload]").forEach(box=>{
    const inp=box.querySelector("input");
    box.onclick=e=>{if(e.target!==inp)inp.click()};
    inp.onchange=async()=>{
      const f=inp.files[0];if(!f)return;
      try{await upload(box.dataset.upload,f)}catch(e){render("File gagal dibaca: "+e.message)}
    };
  });
  document.querySelector("#reset")?.addEventListener("click",e=>{e.preventDefault();resetAll()});
  document.querySelector("#saveProducts")?.addEventListener("click",async()=>{
    document.querySelectorAll("[data-hpp]").forEach(x=>{
      const k=x.dataset.hpp;
      const h=num(x.value);
      S.hppMeta[k]??={sku:k};
      const from=dateKey(new Date());
      S.hppHistory=(S.hppHistory||[]).filter(z=>!(String(z.sku)===String(k)&&String(z.from)===from));
      S.hppHistory.push({sku:k,hpp:h,from});
      S.hpp=(S.hpp||[]).filter(z=>String(z.sku)!==String(k));
      S.hpp.push({sku:k,hpp:h});
    });
    await save();render("Master Produk dan HPP berhasil disimpan.");
  });
  document.querySelector("#addOp")?.addEventListener("click",async()=>{
    const n=document.querySelector("#opName").value.trim(),a=num(document.querySelector("#opAmount").value);
    if(n&&a){S.opCosts.push({name:n,amount:a,createdAt:new Date().toISOString()});await save();render("Biaya operasional ditambahkan.")}
  });
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{S.opCosts.splice(Number(b.dataset.del),1);await save();render()});
  if(p==="roas"){
    const a=document.querySelector("#rSales"),b=document.querySelector("#rSpend"),o=document.querySelector("#rResult");
    const f=()=>o.textContent=(num(b.value)?(num(a.value)/num(b.value)).toFixed(2):"0.00")+"x";
    a.oninput=f;b.oninput=f;
  }
}

function render(msg=""){
  const p=location.hash.slice(1)||"dashboard";
  let body=p==="dashboard"?dashboard():p==="upload"?uploadPage(msg):p==="produk"?products():p==="iklan"?ads():p==="roas"?roas():p==="operasional"?ops():detail();
  document.querySelector("#root").innerHTML=nav(p)+body;
  bind(p);
}
addEventListener("hashchange",()=>render());

(async()=>{await loadAll();render()})();
