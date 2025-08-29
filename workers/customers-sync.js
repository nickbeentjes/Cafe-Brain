const https=require('https'),fs=require('fs'),path=require('path');
const token=process.env.SQUARE_ACCESS_TOKEN; if(!token){console.error('Missing SQUARE_ACCESS_TOKEN');process.exit(1);}
const env=(process.env.SQUARE_ENV||'production').toLowerCase();
const host=env==='sandbox'?'connect.squareupsandbox.com':'connect.squareup.com';
const squareVersion=process.env.SQUARE_VERSION||'2025-07-16';
const dataDir='/home/data', ckFile=path.join(dataDir,'customers.checkpoint.json');
const headers={'Authorization':`Bearer ${token}`,'Square-Version':squareVersion,'Content-Type':'application/json'};
function get(p){return new Promise((res,rej)=>{const r=https.request({hostname:host,path:p,method:'GET',headers},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode>=400?rej(new Error(`HTTP ${x.statusCode}: ${d}`)):res(JSON.parse(d)))});r.on('error',rej);r.end();});}
function post(p,b){const j=JSON.stringify(b);return new Promise((res,rej)=>{const r=https.request({hostname:host,path:p,method:'POST',headers},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode>=400?rej(new Error(`HTTP ${x.statusCode}: ${d}`)):res(JSON.parse(d)))});r.on('error',rej);r.write(j);r.end();});}
function load(){try{return JSON.parse(fs.readFileSync(ckFile,'utf8'));}catch{return null}}
function save(o){try{fs.writeFileSync(ckFile,JSON.stringify(o,null,2));}catch(e){}}
async function handle(list){ for(const c of list){ console.log(`[CUST] ${c.id} ${c.given_name||''} ${c.family_name||''} v${c.version}`); } }
async function backfill(){ let cursor,total=0,pages=0; do{ let p='/v2/customers'; if(cursor)p+=`?cursor=${encodeURIComponent(cursor)}`; const r=await get(p); const list=r.customers||[]; await handle(list); total+=list.length; pages++; cursor=r.cursor; }while(cursor); return {total,pages}; }
async function delta(startISO){ let cursor,total=0,pages=0; do{ const body={ query:{ filter:{ updated_at:{ start_at:startISO } } }, limit: 1000, cursor }; const r=await post('/v2/customers/search', body); const list=r.customers||[]; await handle(list); total+=list.length; pages++; cursor=r.cursor; }while(cursor); return {total,pages}; }
(async ()=>{ const ck=load(); if(!ck?.last_sync_at){ console.log('[CUST] backfill ListCustomers...'); const r=await backfill(); save({last_sync_at:new Date().toISOString(),last_result:r}); console.log(`[CUST] backfill: ${r.total}`); } else { const start=new Date(new Date(ck.last_sync_at).getTime()-5*60*1000).toISOString(); console.log(`[CUST] delta from ${start} SearchCustomers(updated_at)...`); const r=await delta(start); save({last_sync_at:new Date().toISOString(),last_result:r}); console.log(`[CUST] delta: +${r.total}`); } })();
