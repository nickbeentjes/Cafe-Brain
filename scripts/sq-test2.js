// scripts/sq-smoke-new.js
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: (process.env.SQUARE_ENV || 'production').toLowerCase() === 'sandbox'
    ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

(async () => {
  const beginTime = new Date(Date.now() - 7 * 24 * 3600e3).toISOString();
  let pager = await client.payments.list({ beginTime, sortOrder: 'DESC', limit: 2 });
  let total = 0, pages = 0;
  for await (const p of pager) {
    total++; if (pages < 3) console.log('sample payment:', p.id);
    // auto-pagination handles the cursor
  }
  console.log(`[DONE] iterated payments: ${total}`);
})();

