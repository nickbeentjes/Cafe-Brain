const https=require('https'),fs=require('fs'),path=require('path');
const token=process.env.SQUARE_ACCESS_TOKEN; if(!token){console.error('Missing SQUARE_ACCESS_TOKEN');process.exit(1);}
const env=(process.env.SQUARE_ENV||'production').toLowerCase();
const host=env==='sandbox'?'connect.squareupsandbox.com':'connect.squareup.com';
const squareVersion=process.env.SQUARE_VERSION||'2025-07-16';
const locId=process.env.SQUARE_LOCATION_ID||'';
const dataDir='/home/data', ckFile=path.join(dataDir,'orders.checkpoint.json');
const BACKFILL_DAYS=Number(process.env.SQ_ORDERS_BACKFILL_DAYS||365*5);
const headers={'Authorization':`Bearer ${token}`,'Square-Version':squareVersion,'Content-Type':'application/json'};
function post(p,b){const j=JSON.stringify(b);return new Promise((res,rej)=>{const r=https.request({hostname:host,path:p,method:'POST',headers},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>x.statusCode>=400?rej(new Error(`HTTP ${x.statusCode}: ${d}`)):res(JSON.parse(d)))});r.on('error',rej);r.write(j);r.end();});}
function load(){try{return JSON.parse(fs.readFileSync(ckFile,'utf8'));}catch{return null}}
function save(o){try{fs.writeFileSync(ckFile,JSON.stringify(o,null,2));}catch(e){}}
function isoNow(){return new Date().toISOString()}
function daysAgoISO(d){return new Date(Date.now()-d*24*3600e3).toISOString()}
function minusSecsISO(iso,s){return new Date(new Date(iso).getTime()-s*1000).toISOString()}
async function handle(list){
  for(const o of list){
    const when=o.closed_at||o.created_at||''; const items=(o.line_items||[]).map(li=>({
      name:li.name, qty:li.quantity, variation:li.variation_name,
      price: li.base_price_money?.amount ?? li.total_money?.amount ?? null,
      modifiers:(li.modifiers||[]).map(m=>({name:m.name, price:m.base_price_money?.amount ?? null}))
    }));
    console.log(`[ORDER] ${o.id} cust=${o.customer_id||''} items=${items.length} at=${when} upd=${o.updated_at}`);
    // dispatch to DB/queue here
  }
}
async function pageOrders(startISO,endISO){
  let cursor,total=0,pages=0,lastUpdated=null;
  const location_ids = locId ? [locId] : undefined;
  do{
    const body={ location_ids, cursor, query:{ filter:{ date_time_filter:{ updated_at:{ start_at:startISO, end_at:endISO } } }, sort:{ sort_field:'UPDATED_AT', sort_order:'ASC' }, return_entries:false }, limit:100 };
    const r=await post('/v2/orders/search', body);
    const list=r.orders||[];
    if(list.length){ lastUpdated=list[list.length-1].updated_at || lastUpdated; await handle(list); }
    total+=list.length; pages++; cursor=r.cursor;
  }while(cursor);
  return {total,pages,lastUpdated};
}
(async ()=>{ const ck=load(); const now=isoNow(); const start=ck?.next_start||daysAgoISO(BACKFILL_DAYS); const startLB=minusSecsISO(start,72*3600);
  console.log(`[ORD] range ${startLB} .. ${now} env=${env}`); const r=await pageOrders(startLB,now);
  const nextStart=r.lastUpdated?minusSecsISO(r.lastUpdated,5):startLB; save({last_run_at:now,last_updated_at:r.lastUpdated,next_start:nextStart,last_result:{total:r.total,pages:r.pages}});
  console.log(`[ORD] fetched=${r.total} pages=${r.pages} lastUpdated=${r.lastUpdated||'n/a'}`);
})();
