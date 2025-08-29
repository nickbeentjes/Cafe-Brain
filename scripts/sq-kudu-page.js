const https = require('https');

const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) { console.error('Missing SQUARE_ACCESS_TOKEN'); process.exit(1); }

const locId = process.env.SQUARE_LOCATION_ID || 'L5D18K5RBWQJH'; // your prod loc
const beginTime = new Date(Date.now() - 90*24*3600e3).toISOString(); // last 90 days
const headers = {
  'Authorization': `Bearer ${token}`,
  'Square-Version': '2025-07-16',
  'Content-Type': 'application/json'
};

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'connect.squareup.com', path, method: 'GET', headers }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  // sanity: locations
  const locs = await get('/v2/locations');
  const have = (locs.locations || []).map(l => l.id);
  console.log('[OK] locations visible:', have.join(', '));
  if (!have.includes(locId)) console.warn(`[WARN] target location ${locId} not in list (check token/env)`);

  // payments paging
  let cursor, total = 0, pages = 0;
  do {
    let path = `/v2/payments?begin_time=${encodeURIComponent(beginTime)}&sort_order=DESC&limit=100`;
    if (locId) path += `&location_id=${encodeURIComponent(locId)}`;
    if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;
    const res = await get(path);
    const list = res.payments || [];
    total += list.length; pages += 1;
    if (list[0]) console.log(`page ${pages}: ${list.length} (sample ${list[0].id})`);
    else console.log(`page ${pages}: 0`);
    cursor = res.cursor;
  } while (cursor);

  console.log(`[DONE] payments last 90d: ${total} across ${pages} page(s)`);
})().catch(e => { console.error('[ERR]', e.message); process.exit(1); });
