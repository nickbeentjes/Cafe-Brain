const https = require('https'), fs = require('fs'), path = require('path');
const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) { console.error('Missing SQUARE_ACCESS_TOKEN'); process.exit(1); }
const env = (process.env.SQUARE_ENV || 'production').toLowerCase();
const host = env === 'sandbox' ? 'connect.squareupsandbox.com' : 'connect.squareup.com';
const squareVersion = process.env.SQUARE_VERSION || '2025-07-16';
const TYPES = (process.env.SQ_CATALOG_TYPES || 'ITEM,ITEM_VARIATION,CATEGORY,MODIFIER,MODIFIER_LIST,TAX,DISCOUNT,IMAGE').split(',');
const dataDir = '/home/data', ckFile = path.join(dataDir, 'catalog.checkpoint.json');
const headers = {'Authorization': `Bearer ${token}`, 'Square-Version': squareVersion, 'Content-Type': 'application/json'};
function get(p){return new Promise((res,rej)=>{const r=https.request({hostname:host,path:p,method:'GET',headers},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode>=400?rej(new Error(`HTTP ${x.statusCode}: ${d}`)):res(JSON.parse(d)))});r.on('error',rej);r.end();});}
function post(p,b){const j=JSON.stringify(b);return new Promise((res,rej)=>{const r=https.request({hostname:host,path:p,method:'POST',headers},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode>=400?rej(new Error(`HTTP ${x.statusCode}: ${d}`)):res(JSON.parse(d)))});r.on('error',rej);r.write(j);r.end();});}
function load(){try{return JSON.parse(fs.readFileSync(ckFile,'utf8'));}catch{return null}}
function save(o){try{fs.writeFileSync(ckFile,JSON.stringify(o,null,2));}catch(e){console.error('ck save failed',e)}}
async function handle(objs){ for (const o of objs) console.log(`[CATALOG] ${o.type} ${o.id} v${o.version} ${o.is_deleted?'[DELETED]':''}`); }
async function backfill(){ let cursor,total=0,pages=0; do{ let p=`/v2/catalog/list?types=${encodeURIComponent(TYPES.join(','))}`; if(cursor)p+=`&cursor=${encodeURIComponent(cursor)}`; const r=await get(p); const list=r.objects||[]; total+=list.length; pages++; await handle(list); cursor=r.cursor; }while(cursor); return {total,pages}; }
async function delta(beginISO){ let cursor,total=0,pages=0; do{ const body={ types:TYPES, include_related_objects:true, begin_time:beginISO, cursor }; const r=await post('/v2/catalog/search', body); const list=r.objects||[]; total+=list.length; pages++; await handle(list); cursor=r.cursor; }while(cursor); return {total,pages}; }
(async () => {
  const ck = load();
  if (!ck?.last_sync_at) {
    console.log('[CAT] backfill using ListCatalog...');
    const r = await backfill(); save({ last_sync_at: new Date().toISOString(), mode: 'backfill', last_result: r });
    console.log(`[CAT] backfill done: ${r.total} objs`);
  } else {
    const start = new Date(new Date(ck.last_sync_at).getTime() - 5*60*1000).toISOString();
    console.log(`[CAT] delta from ${start} using SearchCatalogObjects...`);
    const r = await delta(start); save({ last_sync_at: new Date().toISOString(), mode: 'delta', last_result: r });
    console.log(`[CAT] delta done: +${r.total}`);
  }
})();
