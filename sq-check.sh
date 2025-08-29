#!/usr/bin/env bash
set -e

cd /home/site/wwwroot 2>/dev/null || cd /site/wwwroot 2>/dev/null || true

echo "=== ENV ==="
node -e "const e=process.env; const tok=e.SQUARE_ACCESS_TOKEN||''; console.log({
  SQUARE_ENV:e.SQUARE_ENV||'(missing)',
  SQUARE_LOCATION_ID:e.SQUARE_LOCATION_ID||'(missing)',
  SQUARE_VERSION:e.SQUARE_VERSION||'(missing)',
  TOKEN: tok? tok.slice(0,6)+'…'+tok.slice(-4):'(missing)'
});"

echo -e "\n=== SQUARE PING (locations) ==="
node - <<'JS'
const https=require('https');
const host=(process.env.SQUARE_ENV||'production').toLowerCase()==='sandbox'?'connect.squareupsandbox.com':'connect.squareup.com';
const headers={'Authorization':`Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,'Square-Version':process.env.SQUARE_VERSION||'2025-07-16','Content-Type':'application/json'};
https.request({hostname:host,path:'/v2/locations',method:'GET',headers},r=>{
  let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ if(r.statusCode>=400){ console.error('HTTP',r.statusCode,d); process.exit(1); }
    const j=JSON.parse(d); console.log((j.locations||[]).map(l=>`${l.id}:${l.name}`).join(', ')||'(no locations)');
  });
}).end();
JS

echo -e "\n=== ONE-OFF RUNS (no PM2) ==="
for w in catalog customers orders; do
  echo "--- workers/${w}-sync.js ---"
  if [ -f "workers/${w}-sync.js" ]; then
    node "workers/${w}-sync.js" | tail -n 30 || true
  else
    echo "missing workers/${w}-sync.js"
  fi
done

echo -e "\n=== CHECKPOINTS (/home/data) ==="
ls -l /home/data || true
for f in /home/data/*.checkpoint.json; do [ -f "$f" ] && { echo "-> $f"; tail -n 50 "$f"; }; done

echo -e "\n=== PM2 STATUS ==="
if command -v pm2 >/dev/null 2>&1; then
  pm2 ls || true
  echo -e "\n=== PM2 RECENT LOGS (orders/customers/catalog) ==="
  pm2 logs orders-sync --lines 50 --nostream || true
  pm2 logs customers-sync --lines 50 --nostream || true
  pm2 logs catalog-sync --lines 50 --nostream || true
else
  echo "pm2 not in PATH"
fi

echo -e "\n=== DONE ==="
