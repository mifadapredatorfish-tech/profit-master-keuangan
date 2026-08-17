import "./style.css";
import * as XLSX from "xlsx";

const icons={
shop:`<svg viewBox="0 0 24 24"><path d="M4 10v9h16v-9"/><path d="M3 10h18l-2-6H5l-2 6Z"/><path d="M8 19v-5h8v5"/></svg>`,
grid:`<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
product:`<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4 8-4M12 11.5V21"/></svg>`,
ad:`<svg viewBox="0 0 24 24"><path d="m4 10 12-5v14L4 14v-4Z"/><path d="M16 9h4v6h-4"/></svg>`,
calc:`<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/></svg>`,
wallet:`<svg viewBox="0 0 24 24"><path d="M4 7h15a1 1 0 0 1 1 1v11H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13"/><path d="M16 13h4"/></svg>`,
upload:`<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>`,
file:`<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/></svg>`,
cube:`<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4 8-4M12 11.5V21"/></svg>`,
check:`<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,
chev:`<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>`,
shield:`<svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 5-3.1 8.3-7 10-3.9-1.7-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`
};

const menu=[
["dashboard","Dashboard Profit","grid"],
["produk","Master Produk","product"],
["iklan","Detail Iklan","ad"],
["roas","Kalkulator ROAS","calc"],
["operasional","Biaya Operasional","wallet"],
["upload","Upload Data","upload"]
];

const types={
income:{title:"Income (sudah dilepas)",ext:".xlsx",accept:".xlsx,.xls",icon:"file"},
orders:{title:"Order.all",ext:".xlsx",accept:".xlsx,.xls",icon:"cube"},
ads:{title:"Iklan Keseluruhan",ext:".csv",accept:".csv",icon:"ad"},
adsProduct:{title:"Iklan per Produk",ext:".csv",accept:".csv",icon:"file"}
};

const state=JSON.parse(localStorage.getItem("pmk_upload_state")||'{"files":{},"rows":{}}');

function save(){localStorage.setItem("pmk_upload_state",JSON.stringify(state));}

function orderKey(row){
  const keys=["No. Pesanan","No Pesanan","Order ID","Order Id","OrderID","Nomor Pesanan","Order number","Order Number"];
  for(const k of keys) if(row[k]!=null&&String(row[k]).trim()) return String(row[k]).trim();
  const k=Object.keys(row).find(x=>/no.*pesanan|order.*id|order.*number/i.test(x));
  return k?String(row[k]).trim():"";
}

function mergeRows(oldRows,newRows){
  const map=new Map();
  [...oldRows,...newRows].forEach(r=>{
    const k=orderKey(r);
    map.set(k||JSON.stringify(r),r);
  });
  return [...map.values()];
}

async function readFile(file){
  const buffer=await file.arrayBuffer();
  const wb=XLSX.read(buffer,{type:"array",cellDates:true});
  const result=[];
  wb.SheetNames.forEach(name=>{
    const ws=wb.Sheets[name];
    result.push(...XLSX.utils.sheet_to_json(ws,{defval:""}));
  });
  return result;
}

function sidebar(active){
 return `<aside class="sidebar">
 <div class="brand"><div class="brand-mark">↗</div><div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div></div>
 <div class="store-wrap"><button class="store-select">${icons.shop}<span>Toko Utama</span><span class="arrow">${icons.chev}</span></button></div>
 <nav>${menu.map(([id,label,ic])=>`<button class="nav-item ${active===id?"active":""}" data-page="${id}">${icons[ic]}<span>${label}</span></button>`).join("")}</nav>
 </aside>`;
}

function uploadBox(id){
 const t=types[id], f=state.files[id];
 return `<label class="dropbox ${f?"uploaded":""}" data-upload="${id}">
 <input type="file" hidden accept="${t.accept}">
 <div class="box-icon">${icons[t.icon]}</div>
 <div><div class="box-title">${t.title}</div><div class="box-sub">${f?`${f.name} • ${f.rows.toLocaleString("id-ID")} baris`:`Upload ${t.ext}`}</div></div>
 </label>`;
}

function uploadPage(message){
 return `<main class="content">
 ${message?`<div class="notice success">${icons.check}<span>${message}</span></div>`:""}
 <div class="page-head"><h1>Upload Laporan</h1><p>Gabungkan laporan Shopee/TikTok jadi satu dashboard. Semua diproses di browser kamu.</p></div>
 <section class="store-card">
  <div class="store-label">${icons.shop}<strong>Upload ke toko:</strong><span class="pill">Toko Utama (shopee)</span></div>
  <div class="new-store"><input placeholder="Nama toko baru"><div><select><option>Shopee</option><option>TikTok</option></select><button type="button">＋ Tambah</button></div></div>
 </section>
 <section class="upload-grid">${uploadBox("income")}${uploadBox("orders")}${uploadBox("ads")}${uploadBox("adsProduct")}</section>
 <div class="hint">💡 Bisa upload beberapa periode — file baru otomatis digabung (dedupe by no. pesanan). Minimal Income + Order.all. <a href="#" id="resetData">Reset data</a></div>
 <div class="privacy">${icons.shield}<span>Semua perhitungan terjadi di perangkat kamu. Tidak ada data yang dikirim ke server.</span></div>
 </main>`;
}

function dashboard(){
 const total=Object.values(state.rows).reduce((n,r)=>n+r.length,0);
 return `<main class="content"><div class="page-head"><h1>Dashboard Profit</h1><p>Ringkasan data yang sudah di-upload.</p></div>
 <div class="cards"><div><span>Data tersimpan</span><b>${total.toLocaleString("id-ID")}</b><small>baris</small></div>
 <div><span>File upload</span><b>${Object.keys(state.files).length}</b><small>file</small></div>
 <div><span>Status</span><b class="ok">Aktif</b><small>diproses di browser</small></div></div>
 <section class="placeholder"><h2>Data siap diproses</h2><p>Upload Income dan Order.all untuk mulai membangun perhitungan profit.</p></section></main>`;
}

function placeholder(title,text){
 return `<main class="content"><div class="page-head"><h1>${title}</h1><p>${text}</p></div><section class="placeholder"><h2>${title}</h2><p>Modul ini akan menggunakan data yang sudah di-upload.</p></section></main>`;
}

async function handleUpload(id,file){
 try{
   const rows=await readFile(file);
   if(!rows.length) throw new Error("File tidak memiliki baris data.");
   const merged=mergeRows(state.rows[id]||[],rows);
   state.rows[id]=merged;
   state.files[id]={name:file.name,rows:merged.length,updated:new Date().toISOString()};
   save();
   render(`Berhasil membaca ${file.name}: ${rows.length.toLocaleString("id-ID")} baris. Total tersimpan: ${merged.length.toLocaleString("id-ID")} baris.`);
 }catch(e){
   console.error(e);
   render(`File ${file.name} gagal dibaca. Pastikan file ${types[id].ext} berisi tabel laporan.`);
 }
}

function bind(){
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>location.hash=b.dataset.page);
 document.querySelectorAll("[data-upload]").forEach(box=>{
   const input=box.querySelector("input");
   box.addEventListener("click",e=>{if(e.target!==input)input.click()});
   input.addEventListener("change",async e=>{
     const file=e.target.files?.[0];
     if(file) await handleUpload(box.dataset.upload,file);
     input.value="";
   });
 });
 document.querySelector("#resetData")?.addEventListener("click",e=>{
   e.preventDefault();
   localStorage.removeItem("pmk_upload_state");
   location.hash="upload";
   render("Data berhasil direset.");
 });
}

function render(message=""){
 const page=location.hash.slice(1)||"upload";
 let body;
 if(page==="upload") body=uploadPage(message);
 else if(page==="dashboard") body=dashboard();
 else if(page==="produk") body=placeholder("Master Produk","Kelola produk, SKU, harga jual, dan HPP.");
 else if(page==="iklan") body=placeholder("Detail Iklan","Analisis biaya dan performa iklan.");
 else if(page==="roas") body=placeholder("Kalkulator ROAS","Hitung ROAS dan target iklan.");
 else body=placeholder("Biaya Operasional","Kelola biaya operasional toko.");
 document.querySelector("#root").innerHTML=sidebar(page)+body;
 bind();
}

addEventListener("hashchange",()=>render());
render();
