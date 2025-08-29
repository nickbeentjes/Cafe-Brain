// scripts/sq-smoke.js
const { Client, Environment, ApiError } = require('square');

const requireEnv = k => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

const accessToken = requireEnv('SQUARE_ACCESS_TOKEN');
const envName = (process.env.SQUARE_ENV || 'production').toLowerCase();
const environment = envName === 'sandbox' ? Environment.Sandbox : Environment.Production;

const client = new Client({ accessToken, environment });

(async () => {
  try {
    // 1) Locations
    const locRes = await client.locationsApi.listLocations();
    const locs = locRes.result.locations || [];
    console.log(`[OK] Locations: ${locs.length}`);
    if (locs[0]) console.log(`     First location: ${locs[0].id} — ${locs[0].name}`);

    // 2) Payments (last 24h) with pagination
  //  const beginTime = new Date(Date.now() - 24 * 3600e3).toISOString();
   
// last 30 days instead of 24h
const beginTime = new Date(Date.now() - 30 * 24 * 3600e3).toISOString();

	  let cursor = undefined;
    let total = 0;
    let pages = 0;

    do {
     // const payRes = aw// BEFORE (wrong for legacy SDK):
// const payRes = await client.paymentsApi.listPayments({ beginTime, sortOrder: 'DESC', limit: 2, cursor });

// AFTER (legacy signature: beginTime, endTime, sortOrder, cursor, locationId, total, last4, cardBrand, limit, isOfflinePayment, offlineBeginTime, offlineEndTime)
	
// good: only pass what we use (beginTime, endTime, sortOrder, cursor)
const payRes = await client.paymentsApi.listPayments(
  beginTime,          // RFC3339
  undefined,          // endTime
  'DESC',             // sortOrder
  cursor              // cursor
);

const { payments = [] } = payRes.result;
      total += payments.length;
      pages += 1;
      if (payments[0]) console.log(`     Page ${pages}: got ${payments.length}, sample payment ${payments[0].id}`);
      cursor = payRes.result.cursor;
    } while (cursor);

    console.log(`[OK] Payments last 24h: ${total} across ${pages} page(s)`);
    console.log('[DONE] Square smoke tests passed.');
  } catch (err) {
    if (err instanceof ApiError) {
      console.error('[Square API Error]', err.statusCode, JSON.stringify(err.result, null, 2));
    } else {
      console.error('[Error]', err.message);
    }
    process.exit(1);
  }
})();

