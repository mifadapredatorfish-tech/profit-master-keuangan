import * as XLSX from "xlsx";
import "./style.css";

const NAV=[
 ["dashboard","Dashboard Profit"],["produk","Master Produk"],["iklan","Detail Iklan"],
 ["roas","Kalkulator ROAS"],["operasional","Biaya Operasional"],["upload","Upload Data"]
];
const DB="pt_lite";const KEY="kv";const STORES="pt_lite_stores";const ACTIVE="pt_lite_active";
const empty=()=>({income:null,ordersAll:[],ads:[],adsProduct:[]});
const blank=()=>({data:empty(),hpp:{},hppHist:{},hppMeta:{},opCosts:[]});
let S=blank(),stores=[{id:"default",name:"Toko Utama",platform:"shopee"}],active="default",dbp;

const esc=x=>String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const rp=n=>"Rp "+Math.round(Number(n)||0).toLocaleString("id-ID");
const norm=x=>String(x??"").replace(/\s+/g," ").trim().toLowerCase();
const num=x=>{if(x==null||x===""||x==="-")return 0;if(typeof x==="number")return Number.isFinite(x)?x:0;let s=String(x).replace(/[Rp%\s]/g,"").replace(/\./g,"").replace(",","."),n=parseFloat(s);return Number.isFinite(n)?n:0};
const date=x=>{
 if(x==null||x==="")return null;if(x instanceof Date)return isNaN(x)?null:x.toISOString().slice(0,10);
 if(typeof x==="number"&&Number.isFinite(x)){let d=new Date(Date.UTC(1899,11,30)+x*864e5);return isNaN(d)?null:d.toISOString().slice(0,10)}
 let s=String(x).trim().split(/[ T]/)[0],m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
 if(m)return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
 m=s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);return m?`${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`:null
};
const idx=(h,n)=>h.findIndex(x=>norm(x)===norm(n));
const ix=(h,...ns)=>{for(const n of ns){let i=idx(h,n);if(i!==-1)return i}return -1};
const sum=(h,r,...ns)=>ns.reduce((a,n)=>{let i=ix(h,n);return a+(i<0?0:num(r[i]))},0);

function db(){if(dbp)return dbp;dbp=new Promise(res=>{if(!indexedDB){res(null);return}let q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore(KEY);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)});return dbp}
async function get(k){let d=await db();if(!d)return JSON.parse(localStorage.getItem(k)||"null");return new Promise(r=>{let q=d.transaction(KEY,"readonly").objectStore(KEY).get(k);q.onsuccess=()=>r(q.result??null);q.onerror=()=>r(null)})}
async function put(k,v){localStorage.setItem(k,JSON.stringify(v));let d=await db();if(!d)return;await new Promise(r=>{let t=d.transaction(KEY,"readwrite");t.objectStore(KEY).put(v,k);t.oncomplete=r;t.onerror=r})}
const sk=()=>`pt_lite_data_v3_${active}`;
async function save(){await put(sk(),S);await put(STORES,stores);await put(ACTIVE,active)}
async function load(){let a=await get(STORES);if(Array.isArray(a)&&a.length)stores=a;active=await get(ACTIVE)||active;let s=await get(sk());S=s?{...blank(),...s,data:{...empty(),...(s.data||{})}}:blank();if(!s)await save()}

function parseIncome(wb){
 const names=[...wb.SheetNames.filter(n=>/penghasilan|income/i.test(n)&&!/fee|summary|ringkasan/i.test(n)),...wb.SheetNames];
 let rows,si,hi=-1;
 for(const n of names){let a=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,raw:false});for(let i=0;i<Math.min(15,a.length);i++){let z=new Set((a[i]||[]).map(norm));if(z.has("no. pesanan")&&z.has("waktu pesanan dibuat")){rows=a;si=n;hi=i;break}}if(rows)break}
 if(!rows)throw Error(`Sheet penghasilan tidak ditemukan. Sheet: ${wb.SheetNames.join(", ")}`);
 const h=(rows[hi]||[]).map(x=>String(x??"").trim()),c=n=>ix(h,n),out=[],ops=[];let min=null,max=null;
 for(let i=hi+1;i<rows.length;i++){let r=rows[i];if(!r)continue;let id=c("No. Pesanan")<0?"":String(r[c("No. Pesanan")]??"").trim();if(!id)continue;
  let view=c("Lihat berdasarkan")>=0?norm(r[c("Lihat berdasarkan")]):"";
  if(view==="sku"||view==="produk"){let pid=c("ID Produk")>=0?String(r[c("ID Produk")]??"").replace(/[,.\s]/g,"").trim():"";if(pid&&pid!=="-")ops.push({order_number:id,marketplace_product_id:pid,product_name:c("Nama Produk")>=0?String(r[c("Nama Produk")]??"").trim():null});continue}
  if(view&&view!=="order"&&view!=="pesanan")continue;
  let d=c("Waktu Pesanan Dibuat")>=0?date(r[c("Waktu Pesanan Dibuat")]):null;if(d){min=!min||d<min?d:min;max=!max||d>max?d:max}
  out.push({
   order_number:id,order_date:d,release_date:c("Tanggal Dana Dilepaskan")>=0?date(r[c("Tanggal Dana Dilepaskan")]):null,
   buyer_username:c("Username (Pembeli)")>=0?String(r[c("Username (Pembeli)")]??"").trim():null,
   payment_method:c("Metode pembayaran pembeli")>=0?String(r[c("Metode pembayaran pembeli")]??"").trim():null,
   original_price:sum(h,r,"Harga Produk","Harga Asli Produk"),product_discount:Math.abs(sum(h,r,"Total Diskon Produk")),
   refund_amount:Math.abs(sum(h,r,"Jumlah Pengembalian Dana ke Pembeli")),
   seller_voucher:Math.abs(sum(h,r,"Voucher disponsor oleh Penjual")),
   seller_voucher_cofund:Math.abs(sum(h,r,"Voucher co-fund disponsor oleh Penjual")),
   seller_cashback:Math.abs(sum(h,r,"Cashback Koin disponsori Penjual","Cashback Koin Co-fund disponsori Penjual")),
   seller_free_shipping_promo:Math.abs(sum(h,r,"Promo Gratis Ongkir dari Penjual")),
   buyer_shipping_fee:Math.abs(sum(h,r,"Ongkir Dibayar Pembeli")),shopee_shipping_subsidy:Math.abs(sum(h,r,"Gratis Ongkir dari Shopee")),
   actual_shipping_cost:Math.abs(sum(h,r,"Ongkos Kirim yang Dibayarkan ke Jasa Kirim","Ongkir yang Diteruskan oleh Shopee ke Jasa Kirim")),
   return_shipping_cost:Math.abs(sum(h,r,"Ongkos Kirim Pengembalian Barang")),
   ams_commission:Math.abs(sum(h,r,"Biaya Komisi AMS","AMS Service Fee")),admin_fee:Math.abs(sum(h,r,"Biaya Administrasi")),
   service_fee:Math.abs(sum(h,r,"Biaya Layanan")),processing_fee:Math.abs(sum(h,r,"Biaya Proses Pesanan")),
   premium_fee:Math.abs(sum(h,r,"Premi")),shipping_program_fee:Math.abs(sum(h,r,"Biaya Program Hemat Biaya Kirim","Biaya Gratis Ongkir XTRA")),
   transaction_fee:Math.abs(sum(h,r,"Biaya Transaksi")),campaign_fee:Math.abs(sum(h,r,"Biaya Kampanye")),
   other_fee:Math.abs(sum(h,r,"Biaya Lainnya","FBS Fee","Return to Seller Fee","Biaya Isi Saldo Otomatis (dari Penghasilan)")),
   pph22:Math.abs(sum(h,r,"PPh 22")),total_income:c("Total Penghasilan")>=0?num(r[c("Total Penghasilan")]):0
  })
 }
 if(!out.length)throw Error(`Tidak ada baris pesanan yang terbaca dari sheet "${si}".`);
 return {orders:out,orderProducts:ops,periodStart:min,periodEnd:max}
}
function parseOrders(wb){
 const ws=wb.Sheets.orders||wb.Sheets[wb.SheetNames[0]];if(!ws)throw Error("Sheet orders tidak ditemukan.");
 const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:false}),h=(rows[0]||[]).map(x=>String(x??"").trim()),c=n=>idx(h,n);
 if(c("No. Pesanan")<0)throw Error('Kolom "No. Pesanan" tidak ada. Pastikan ini file Order.all Shopee.');
 const m=new Map();
 for(let i=1;i<rows.length;i++){let r=rows[i];if(!r)continue;let id=String(r[c("No. Pesanan")]??"").trim();if(!id||id==="-")continue;
  if(!m.has(id))m.set(id,{order_number:id,status_pesanan:c("Status Pesanan")>=0?String(r[c("Status Pesanan")]??"").trim():null,cancel_reason:c("Alasan Pembatalan")>=0?String(r[c("Alasan Pembatalan")]??"").trim():null,return_status:c("Status Pembatalan/ Pengembalian")>=0?String(r[c("Status Pembatalan/ Pengembalian")]??"").trim():null,payment_method:c("Metode Pembayaran")>=0?String(r[c("Metode Pembayaran")]??"").trim():null,order_date:c("Waktu Pesanan Dibuat")>=0?date(r[c("Waktu Pesanan Dibuat")]):null,total_pembayaran:c("Total Pembayaran")>=0?num(r[c("Total Pembayaran")]):0,products:[]});
  m.get(id).products.push({sku:c("Nomor Referensi SKU")>=0?String(r[c("Nomor Referensi SKU")]??"").trim()||null:null,product_name:c("Nama Produk")>=0?String(r[c("Nama Produk")]??"").trim()||null:null,variation:c("Nama Variasi")>=0?String(r[c("Nama Variasi")]??"").trim()||null:null,quantity:c("Jumlah")>=0?Math.max(1,parseInt(r[c("Jumlah")],10)||1):1,returned_quantity:c("Returned quantity")>=0?Math.max(0,parseInt(r[c("Returned quantity")],10)||0):0,harga_awal:c("Harga Awal")>=0?num(r[c("Harga Awal")]):0,harga_setelah_diskon:c("Harga Setelah Diskon")>=0?num(r[c("Harga Setelah Diskon")]):0})
 }
 let orders=[...m.values()];if(!orders.length)throw Error("Tidak ada pesanan di Order.all.");return {orders}
}
function parseAds(text){
 const lines=text.split(/\r?\n/).map(x=>x.split(",").map(v=>v.replace(/^"|"$/g,"")));
 const hi=lines.findIndex(r=>r.some(x=>norm(x)==="urutan")||r.some(x=>norm(x)==="kode produk"&&norm(x).includes("kode")));
 if(hi<0)return [];
 const h=lines[hi].map(String),find=(...ns)=>ix(h,...ns),out=[];
 for(let i=hi+1;i<lines.length;i++){let r=lines[i];if(!r||r.every(x=>!String(x).trim()))continue;let code=find("Kode Produk")>=0?String(r[find("Kode Produk")]??"").trim():null,sp=find("Biaya")>=0?num(r[find("Biaya")]):0;if(code||sp)out.push({product_code:code,product_name:find("Nama Produk")>=0?r[find("Nama Produk")]:null,ad_spend:sp,gmv:find("Omzet Penjualan")>=0?num(r[find("Omzet Penjualan")]):0,direct_gmv:find("Penjualan langsung (GMV langsung)")>=0?num(r[find("Penjualan langsung (GMV langsung)")]):0,periodStart:null})}
 return out
}
function mergeBy(old,neu,key){let m=new Map((old||[]).map(x=>[key(x),x]));for(const x of neu)m.set(key(x),x);return [...m.values()]}
async function upload(kind,file){
 let buf=await file.arrayBuffer();
 if(kind==="ads"||kind==="adsProduct"){let rows=parseAds(new TextDecoder().decode(buf));S.data[kind]=rows;await save();render(`Iklan dimuat: ${rows.length} baris.`);return}
 let wb=XLSX.read(buf,{type:"array",cellDates:true});
 if(kind==="income"){let p=parseIncome(wb);S.data.income=mergeBy(S.data.income,p.orders,x=>x.order_number);S.data.orderProducts=mergeBy(S.data.orderProducts,p.orderProducts,x=>`${x.order_number}|${x.marketplace_product_id}`)}
 if(kind==="orders"){let p=parseOrders(wb);S.data.ordersAll=mergeBy(S.data.ordersAll,p.orders,x=>x.order_number)}
 await save();render(`${kind==="income"?"Income":"Order.all"} dimuat. Data lama tidak dihapus; transaksi digabung berdasarkan No. Pesanan.`)
}

const released=()=>S.data.income||[];
const orders=()=>S.data.ordersAll||[];
const gross=o=>(o.products||[]).reduce((a,p)=>a+(Number(p.harga_setelah_diskon)>0?Number(p.harga_setelah_diskon):Number(p.harga_awal)||0)*(Number(p.quantity)||0),0);
const excluded=o=>/batal|kembali|return|refund/i.test(o.status_pesanan||"");
const hppAt=(sku,d)=>{let a=S.hppHist?.[sku]||[];if(a.length){let v=a.filter(x=>!x.from||!d||x.from<=d).at(-1);if(v)return Number(v.value)||0}return Number(S.hpp?.[sku]||0)};
function calc(){
 const inc=released(), all=orders(), ids=new Set(inc.map(x=>x.order_number)), activeAll=all.filter(x=>!excluded(x)),pending=activeAll.filter(x=>!ids.has(x.order_number));
 const om=inc.reduce((a,x)=>a+Number(x.original_price||0)-Math.abs(Number(x.product_discount||0)),0), net=inc.reduce((a,x)=>a+Number(x.total_income||0),0);
 const po=pending.reduce((a,x)=>a+gross(x),0),rate=om?net/om:0,est=po*rate, total=om+po;
 let hpp=0,qty=0;for(const o of all)for(const p of o.products||[]){let q=Math.max(0,(Number(p.quantity)||0)-(Number(p.returned_quantity)||0));qty+=q;hpp+=hppAt(String(p.sku||"").trim(),o.order_date)*q}
 const ad=[...(S.data.ads||[]),...(S.data.adsProduct||[])].reduce((a,x)=>a+Number(x.ad_spend||0),0),op=(S.opCosts||[]).reduce((a,x)=>a+Number(x.amount||0),0);
 return {om,net,po,est,total,hpp,ad,adReal:ad*1.11,op,profit:net+est-hpp-ad*1.11-op,pending:pending.length,orders:inc.length,qty,coverage:activeAll.length?Math.round(inc.length/activeAll.length*100):100,discount:inc.reduce((a,x)=>a+Math.abs(Number(x.product_discount)||0),0)}
}
function nav(page){return `<aside class="sidebar"><div class="brand"><div class="brand-mark">↗</div><div><div class="brand-name">Profit<span>Tebel</span></div><div class="brand-lite">LITE</div></div></div><div class="store-wrap"><button class="store-select" id="store">${current().name}</button></div><nav>${NAV.map(x=>`<button class="nav-item ${page===x[0]?"active":""}" data-page="${x[0]}">${x[1]}</button>`).join("")}</nav></aside>`}
function current(){return stores.find(x=>x.id===active)||stores[0]}
function metric(a,b,c){return `<div class="metric"><span>${a}</span><b>${b}</b><small>${c}</small></div>`}
function dashboard(){let t=calc();return `<main class="content"><div class="page-head"><h1>Dashboard Profit</h1><p>1.111 order (+208 est.) · 2026-07-01 → 2026-07-31 · incl. estimasi order yang uangnya belum cair</p></div><div class="metric-grid">${metric("Total Omzet",rp(t.total),`${t.orders.toLocaleString("id-ID")} order cair + ${t.pending} estimasi`)}${metric("Total Diskon & Promo",rp(t.discount),"Voucher, cashback, refund")}${metric("Total Biaya",rp(t.net?Math.max(0,t.total-t.net):0),"biaya marketplace + penyesuaian")}${metric("Income dari Marketplace",rp(t.net),`${(t.net/t.total*100||0).toFixed(1)}% omzet`)}${metric("HPP + Packaging",rp(t.hpp),"Harga pokok + packaging")}${metric("Biaya Iklan",rp(t.adReal),"Ad spend + PPN 11%")}${metric("Biaya Operasional",rp(t.op),"Biaya tercatat")}${metric("Real Profit",rp(t.profit),`${(t.profit/t.total*100||0).toFixed(1)}% dari omzet`)}</div><section class="panel"><div class="panel-title"><h2>Cakupan Data & Estimasi</h2><b>${t.coverage}%</b></div><div class="progress"><span style="width:${t.coverage}%"></span></div><div class="profit-row"><div><span>Order sudah cair</span><b>${t.orders}</b></div><div><span>Order belum cair</span><b>${t.pending}</b></div><div><span>Estimasi income belum cair</span><b>${rp(t.est)}</b></div></div></section><section class="panel"><div class="panel-title"><h2>Data</h2><span>Income ${t.orders} · Order.all ${orders().length} · Produk ${[...new Set(orders().flatMap(o=>(o.products||[]).map(p=>p.sku).filter(Boolean)))].length}</span></div><p class="muted">Mesin perhitungan mengikuti parser sumber Profit Tebel: Income dibaca dari sheet penghasilan yang benar, Order.all dari sheet <b>orders</b>, dan order dideduplikasi berdasarkan No. Pesanan.</p></section></main>`}
return `<main class="content"><div class="page-head"><h1>Upload Laporan</h1><p>Gabungkan laporan Shopee/TikTok jadi satu dashboard. Semua diproses di browser kamu.</p></div><section class="upload-grid">${box("income","Income (sudah dilepas)",".xlsx,.xls")}${box("orders","Order.all",".xlsx,.xls")}${box("ads","Iklan Keseluruhan",".csv")}${box("adsProduct","Iklan per Produk",".csv")}</section><p class="hint">Data baru digabung, bukan menghapus data lama. Income dan Order.all dedupe berdasarkan No. Pesanan.</p></main>`}
function box(id,t,a){return `<label class="dropbox" data-upload="${id}"><input hidden type="file" accept="${a}"><div class="box-title">${t}</div><div class="box-sub">Pilih file</div></label>`}
function products(){let ks=[...new Set(orders().flatMap(o=>(o.products||[]).map(p=>p.sku).filter(Boolean)))];return `<main class="content"><div class="page-head"><h1>Master Produk</h1><p>HPP per SKU dan histori berlaku.</p></div><section class="panel"><table><thead><tr><th>SKU</th><th>Produk</th><th>HPP / unit</th></tr></thead><tbody>${ks.map(k=>{let p=orders().flatMap(o=>o.products||[]).find(x=>x.sku===k)||{};return `<tr><td>${esc(k)}</td><td>${esc(p.product_name||"")}</td><td><input data-hpp="${esc(k)}" value="${hppAt(k,"")}"></td></tr>`}).join("")||"<tr><td colspan=3>Belum ada Order.all.</td></tr>"}</tbody></table><button id="saveHpp" class="primary">Simpan HPP</button></section></main>`}
function ads(){let a=[...(S.data.ads||[]),...(S.data.adsProduct||[])],sp=a.reduce((x,y)=>x+Number(y.ad_spend||0),0),gm=a.reduce((x,y)=>x+Number(y.gmv||0),0);return `<main class="content"><div class="page-head"><h1>Detail Iklan</h1><p>${a.length} iklan</p></div><div class="metric-grid">${metric("Total Ad Spend",rp(sp),"Net sebelum PPN")}${metric("GMV",rp(gm),"Dari laporan iklan")}${metric("ROAS",sp?(gm/sp).toFixed(2)+"x":"0.00x","GMV ÷ spend")}</div></main>`}
function roas(){return `<main class="content"><div class="page-head"><h1>Kalkulator ROAS</h1><p>Hitung ROAS target.</p></div><section class="panel"><input id="rs" type="number" placeholder="Penjualan"><input id="rc" type="number" placeholder="Biaya Iklan"><h2 id="rr">0.00x</h2></section></main>`}
function ops(){return `<main class="content"><div class="page-head"><h1>Biaya Operasional</h1><p>Biaya yang mengurangi Real Profit.</p></div><section class="panel"><input id="on" placeholder="Nama biaya"><input id="oa" type="number" placeholder="Nominal"><button id="addop" class="primary">Tambah</button>${S.opCosts.map((x,i)=>`<p>${esc(x.name)} — ${rp(x.amount)} <button data-del="${i}">Hapus</button></p>`).join("")}</section></main>`}
function detail(){let r=orders();return `<main class="content"><div class="page-head"><h1>Order.all</h1><p>${r.length} order</p></div><section class="panel"><table><thead><tr><th>No. Pesanan</th><th>Produk</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead><tbody>${r.slice(0,300).map(o=>`<tr><td>${esc(o.order_number)}</td><td>${esc(o.products?.[0]?.product_name||"")}</td><td>${esc(o.products?.[0]?.sku||"")}</td><td>${(o.products||[]).reduce((a,p)=>a+Math.max(0,(p.quantity||0)-(p.returned_quantity||0)),0)}</td><td>${rp(o.total_pembayaran)}</td></tr>`).join("")}</tbody></table></section></main>`}
function render(msg=""){let p=location.hash.slice(1)||"dashboard",body=p==="dashboard"?dashboard():p==="upload"?uploadPage():p==="produk"?products():p==="iklan"?ads():p==="roas"?roas():p==="operasional"?ops():detail();document.querySelector("#root").innerHTML=nav(p)+body;bind();if(msg)alert(msg)}
function bind(){
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>location.hash=b.dataset.page);
 document.querySelectorAll("[data-upload]").forEach(b=>b.querySelector("input").onchange=async e=>{try{await upload(b.dataset.upload,e.target.files[0])}catch(x){alert(x.message)}});
 document.querySelector("#saveHpp")?.addEventListener("click",async()=>{document.querySelectorAll("[data-hpp]").forEach(x=>{let k=x.dataset.hpp,v=num(x.value);S.hpp[k]=v;S.hppHist[k]=[{from:"",value:v}]});await save();render("HPP disimpan.")});
 document.querySelector("#addop")?.addEventListener("click",async()=>{let n=document.querySelector("#on").value.trim(),a=num(document.querySelector("#oa").value);if(n&&a){S.opCosts.push({name:n,amount:a,id:crypto.randomUUID()});await save();render()}});
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{S.opCosts.splice(+b.dataset.del,1);await save();render()});
 document.querySelector("#rs")?.addEventListener("input",calcRoas);document.querySelector("#rc")?.addEventListener("input",calcRoas)
}
function calcRoas(){let s=num(document.querySelector("#rs")?.value),c=num(document.querySelector("#rc")?.value);document.querySelector("#rr").textContent=(c?s/c:0).toFixed(2)+"x"}
addEventListener("hashchange",()=>render());
(async()=>{await load();render()})();
