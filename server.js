const { SquareClient, SquareEnvironment } = require('square');
const { initializeDatabases, getTimescalePool, getMongoConnection, logger } = require('./config/database');
const AIAnalyticsEngine = require('./services/AIAnalyticsEngine');

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

// Initialize AI Analytics Engine
const aiEngine = new AIAnalyticsEngine();

// Square configuration
const SQUARE_ENV = 'production';
const squareClient = new SquareClient({ 
  token: process.env.SQUARE_ACCESS_TOKEN, 
  environment: (process.env.SQUARE_ENV||"production").toLowerCase()==="sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production, 
  version: process.env.SQUARE_VERSION || "2025-07-16" 
});
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

function toMoney(value){ return { amount: Math.round((value || 0) * 100), currency: 'AUD' }; }

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Config
const PORT = process.env.PORT || 5050;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MIN_MARKUP = parseFloat(process.env.MIN_MARKUP || "3.0");
const PRICE_ROUNDING = parseFloat(process.env.PRICE_ROUNDING || "0.5");
const PSYCH_ENDING = parseFloat(process.env.PSYCH_ENDING || "0.90");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  markers: path.join(DATA_DIR, 'markers.json')
};

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Pricing helper
function suggestPrice(cogs, opts = {}) {
  const minMarkup = opts.minMarkup ?? MIN_MARKUP;
  const target = cogs * minMarkup;
  const rounded = Math.round(target / PRICE_ROUNDING) * PRICE_ROUNDING;
  let price = rounded;
  if (!Number.isNaN(PSYCH_ENDING)) {
    const dollars = Math.floor(price);
    price = dollars + PSYCH_ENDING;
    if (price < target) {
      price += PRICE_ROUNDING;
    }
  }
  return Math.round(price * 100) / 100;
}

// Basic COGS parser
function estimateCogsFromText(text) {
  const parts = text.split(/[,;+]/).map(p => p.trim()).filter(Boolean);
  let cogs = 0;
  for (const p of parts) {
    const m = p.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?\s*([a-zA-Z ]+)(?:@\$?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(g|kg|ml|l))?)?/i);
    if (!m) continue;
    let qty = parseFloat(m[1]);
    let unit = (m[2] || '').toLowerCase();
    const name = m[3].trim().toLowerCase();
    let unitCost = m[4] ? parseFloat(m[4]) : null;
    let unitCostUnit = (m[5] || '').toLowerCase();

    let grams = 0;
    if (unit === 'kg') grams = qty * 1000;
    else if (unit === 'g' || unit === '') grams = qty;
    else if (unit === 'l') grams = qty * 1000;
    else if (unit === 'ml') grams = qty;

    if (unitCost != null) {
      if (unitCostUnit === 'kg' || unitCostUnit === 'l') unitCost = unitCost / 1000;
      cogs += grams * unitCost;
    } else {
      let defaultPerGram = 0.02;
      if (/(rocket|lettuce|spinach|greens)/.test(name)) defaultPerGram = 0.01;
      if (/(truffle|pesto|aioli|mayo|sauce|cheese)/.test(name)) defaultPerGram = 0.03;
      cogs += grams * defaultPerGram;
    }
  }
  return Math.round(cogs * 100) / 100;
}

// Quick add parser
function parseQuickAdd(text) {
  const nameMatch = text.match(/called\s+([a-z0-9 \-\_]+)/i);
  const priceMatch = text.match(/\$\s?(\d+(?:\.\d+)?)/i);
  const fav = /fav(ou?rite)?|add to fav/i.test(text);
  const category = /coffee|drink|food|sandwich|toastie/i.test(text) ? (text.match(/coffee|drink|food|sandwich|toastie/i)[0].toLowerCase()) : 'food';
  const name = nameMatch ? nameMatch[1].trim() : (text.match(/new\s+([a-z0-9 \-\_]+)/i)?.[1]?.trim() || 'New Item');
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;
  return { name, price, favourite: fav, category };
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => res.json({ok: true, now: new Date().toISOString()}));

// AI Analytics API Routes
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const response = await aiEngine.processQuery(query, req.body.userId || 'louise');
    res.json({ success: true, response });
  } catch (error) {
    logger.error('AI query error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Analytics API Routes
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const pool = await getTimescalePool();
    
    // Get today's date in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's revenue
    const todayResult = await pool.query(`
      SELECT COALESCE(SUM(total_money_amount), 0) as today_revenue,
             COUNT(*) as today_transactions
      FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
    `, [today, tomorrow]);
    
    // Get week's revenue (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekResult = await pool.query(`
      SELECT COALESCE(SUM(total_money_amount), 0) as week_revenue,
             COUNT(*) as week_transactions
      FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
    `, [weekAgo, tomorrow]);
    
    // Get average transaction value
    const avgResult = await pool.query(`
      SELECT COALESCE(AVG(total_money_amount), 0) as avg_transaction
      FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
    `, [weekAgo, tomorrow]);
    
    // Get historical data for chart
    const historyResult = await pool.query(`
      SELECT DATE(created_at) as date,
             COALESCE(SUM(total_money_amount), 0) as revenue
      FROM transactions 
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `, [weekAgo, tomorrow]);
    
    res.json({
      today: parseFloat(todayResult.rows[0]?.today_revenue || 0),
      week: parseFloat(weekResult.rows[0]?.week_revenue || 0),
      avgTransaction: parseFloat(avgResult.rows[0]?.avg_transaction || 0),
      history: historyResult.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue)
      }))
    });
  } catch (error) {
    logger.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

app.get('/api/analytics/sales', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const timescalePool = getTimescalePool();
    if (!timescalePool) {
      // Return mock data when database is not available
      return res.json([]);
    }
    
    const client = await timescalePool.connect();
    
    let days = 7;
    if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await client.query(`
      SELECT DATE(created_at) as date, COUNT(*) as transactions, SUM(total_amount) as revenue
      FROM transactions 
      WHERE created_at >= $1 AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate.toISOString()]);
    
    client.release();
    
    res.json(result.rows.map(row => ({
      date: row.date,
      transactions: parseInt(row.transactions),
      revenue: parseFloat(row.revenue || 0)
    })));
  } catch (error) {
    logger.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

app.get('/api/analytics/products', async (req, res) => {
  try {
    const timescalePool = getTimescalePool();
    if (!timescalePool) {
      // Return mock data when database is not available
      return res.json([]);
    }
    
    const client = await timescalePool.connect();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const result = await client.query(`
      SELECT 
        ti.product_name as name,
        ti.category,
        SUM(ti.quantity) as quantity,
        SUM(ti.total_price) as revenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.created_at >= $1 AND t.status = 'COMPLETED'
      GROUP BY ti.product_name, ti.category
      ORDER BY revenue DESC
      LIMIT 10
    `, [weekAgo.toISOString()]);
    
    client.release();
    
    res.json(result.rows.map(row => ({
      name: row.name,
      category: row.category,
      quantity: parseInt(row.quantity),
      revenue: parseFloat(row.revenue || 0)
    })));
  } catch (error) {
    logger.error('Products analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product data' });
  }
});

app.get('/api/analytics/customers', async (req, res) => {
  try {
    const timescalePool = getTimescalePool();
    if (!timescalePool) {
      // Return mock data when database is not available
      return res.json({
        uniqueToday: 0,
        repeatRate: 0,
        history: {
          newCustomers: 0,
          returningCustomers: 0
        }
      });
    }
    
    const client = await timescalePool.connect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get unique customers today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayResult = await client.query(`
      SELECT COUNT(DISTINCT customer_id) as unique_customers
      FROM transactions 
      WHERE created_at >= $1 AND created_at < $2 AND customer_id IS NOT NULL
    `, [today, tomorrow]);
    
    // Get repeat customer rate
    const repeatResult = await client.query(`
      WITH customer_visits AS (
        SELECT customer_id, COUNT(*) as visits
        FROM transactions 
        WHERE created_at >= $1 AND status = 'COMPLETED' AND customer_id IS NOT NULL
        GROUP BY customer_id
      )
      SELECT 
        COUNT(CASE WHEN visits > 1 THEN 1 END)::float / COUNT(*) as repeat_rate
      FROM customer_visits
    `, [weekAgo.toISOString()]);
    
    client.release();
    
    res.json({
      uniqueToday: parseInt(todayResult.rows[0]?.unique_customers || 0),
      repeatRate: parseFloat(repeatResult.rows[0]?.repeat_rate || 0),
      history: {
        newCustomers: 50,
        returningCustomers: 30
      }
    });
  } catch (error) {
    logger.error('Customers analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

app.get('/api/analytics/production', async (req, res) => {
  try {
    const { ProductionSchedule } = require('./models/Analytics');
    
    const schedules = await ProductionSchedule.find({
      status: 'pending',
      recommendedStartTime: { $gte: new Date() }
    }).sort({ recommendedStartTime: 1 }).limit(5);
    
    res.json(schedules);
  } catch (error) {
    logger.error('Production analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch production data' });
  }
});

app.get('/api/analytics/stock', async (req, res) => {
  try {
    const { StockRecommendation } = require('./models/Analytics');
    
    const recommendations = await StockRecommendation.find({
      urgency: { $in: ['high', 'medium'] },
      validUntil: { $gte: new Date() }
    }).sort({ urgency: -1, createdAt: -1 }).limit(5);
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Stock analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.get('/api/analytics/weather', async (req, res) => {
  try {
    const weatherData = await aiEngine.getWeatherData();
    const weatherImpact = await aiEngine.analyzeWeatherImpact();
    
    res.json({
      ...weatherData,
      impact: weatherImpact?.description
    });
  } catch (error) {
    logger.error('Weather analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/analytics/insights', async (req, res) => {
  try {
    const { AIInsight } = require('./models/Analytics');
    
    const insights = await AIInsight.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(5);
    
    res.json(insights);
  } catch (error) {
    logger.error('Insights analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch insights data' });
  }
});

// Original API routes (keeping existing functionality)
app.get('/api/products', (req, res)=> {
  const db = readJSON(FILES.products, { products: [] });
  res.json(db.products);
});

app.post('/api/products', (req, res)=> {
  const db = readJSON(FILES.products, { products: [] });
  const { name, category = 'food', favourite = false, sku, cogs, price, quickAddText, ingredientsText } = req.body;

  let finalName = name;
  let finalFav = favourite;
  let finalCategory = category;
  let finalCOGS = typeof cogs === 'number' ? cogs : null;
  let finalPrice = typeof price === 'number' ? price : null;

  if (quickAddText) {
    const q = parseQuickAdd(quickAddText);
    finalName = finalName || q.name;
    finalFav = finalFav || q.favourite;
    finalCategory = finalCategory || q.category;
    if (!finalPrice && q.price) finalPrice = q.price;
  }

  if (!finalCOGS && ingredientsText) {
    finalCOGS = estimateCogsFromText(ingredientsText);
  }

  if (!finalPrice && finalCOGS != null) {
    finalPrice = suggestPrice(finalCOGS);
  }

  if (!finalName) return res.status(400).json({error:"Missing name"});

  const item = {
    id: uuidv4(),
    name: finalName,
    category: finalCategory,
    favourite: !!finalFav,
    sku: sku || null,
    cogs: typeof finalCOGS === 'number' ? finalCOGS : null,
    price: typeof finalPrice === 'number' ? finalPrice : null,
    createdAt: new Date().toISOString()
  };
  db.products.push(item);
  writeJSON(FILES.products, db);
  io.emit('products:update', item);
  res.json({saved:true, item});
});

app.post('/api/price/suggest', (req, res)=> {
  const { cogs, minMarkup } = req.body;
  if (typeof cogs !== 'number') return res.status(400).json({ error: "cogs required" });
  const price = suggestPrice(cogs, { minMarkup });
  res.json({ cogs, price, minMarkup: minMarkup ?? MIN_MARKUP });
});

// Prep markers
app.get('/api/markers', (req, res)=> {
  const db = readJSON(FILES.markers, { markers: [] });
  res.json(db.markers);
});

app.post('/api/markers', (req, res)=> {
  const db = readJSON(FILES.markers, { markers: [] });
  const { label, minutes = 5 } = req.body;
  const marker = { id: uuidv4(), label: label || 'Prep', minutes, start: Date.now() };
  db.markers.push(marker);
  writeJSON(FILES.markers, db);
  io.emit('markers:update', marker);
  res.json({ saved: true, marker });
});

app.delete('/api/markers/:id', (req, res)=> {
  const db = readJSON(FILES.markers, { markers: [] });
  const before = db.markers.length;
  db.markers = db.markers.filter(m => m.id !== req.params.id);
  writeJSON(FILES.markers, db);
  res.json({ deleted: before - db.markers.length });
});

// Orders
app.post('/api/orders', (req, res)=> {
  const db = readJSON(FILES.orders, { orders: [] });
  const { items = [], note } = req.body;
  const order = { id: uuidv4(), items, note: note || '', createdAt: new Date().toISOString(), status: 'new' };
  db.orders.push(order);
  writeJSON(FILES.orders, db);
  io.emit('orders:new', order);
  res.json({ saved: true, order });
});

app.get('/api/orders', (req, res)=> {
  const db = readJSON(FILES.orders, { orders: [] });
  res.json(db.orders);
});

// Square integration functions
async function upsertSquareItem({ name, price, sku, category }) {
  const idempotencyKey = uuidv4();
  const catalogObject = {
    type: 'ITEM',
    id: '#tmp-' + idempotencyKey,
    itemData: {
      name,
      categoryId: undefined,
      variations: [{
        type: 'ITEM_VARIATION',
        id: '#var-' + idempotencyKey,
        itemVariationData: {
          name: 'Regular',
          pricingType: 'FIXED_PRICING',
          priceMoney: toMoney(price || 0),
          sku: sku || undefined
        }
      }]
    }
  };
  const { catalogApi } = squareClient;
  const res = await catalogApi.upsertCatalogObject({ idempotencyKey, object: catalogObject });
  return res.result;
}

app.post('/api/square/sync-product/:id', async (req, res) => {
  try {
    if (!process.env.SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) return res.status(400).json({ error:'Square not configured' });
    const db = readJSON(FILES.products, { products: [] });
    const p = db.products.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error:'not found' });
    if (!p.price) return res.status(400).json({ error:'product has no price' });
    const out = await upsertSquareItem({ name:p.name, price:p.price, sku:p.sku, category:p.category });
    res.json({ synced:true, square: out });
  } catch(e){ logger.error(e); res.status(500).json({ error:e.message }); }
});

app.get('/api/square/import-products', async (req, res) => {
  try {
    if (!process.env.SQUARE_ACCESS_TOKEN) return res.status(400).json({ error:'Square not configured' });
    const { catalogApi } = squareClient;
    const resp = await catalogApi.listCatalog(undefined, 'ITEM');
    const items = (resp.result.objects || []).map(o => {
      const v = o.itemData?.variations?.[0]?.itemVariationData;
      const amt = v?.priceMoney?.amount ?? null;
      const price = (amt != null) ? amt/100 : null;
      return {
        id: o.id,
        name: o.itemData?.name || 'Unnamed',
        category: 'square',
        favourite: false,
        sku: v?.sku || null,
        cogs: null,
        price,
        createdAt: new Date().toISOString(),
        source: 'square'
      };
    });
    const db = readJSON(FILES.products, { products: [] });
    const existingNames = new Set(db.products.map(p => p.name.toLowerCase()));
    for (const it of items) { if (!existingNames.has(it.name.toLowerCase())) db.products.push(it); }
    writeJSON(FILES.products, db);
    res.json({ imported: items.length, totalLocal: db.products.length });
  } catch (e) { logger.error(e); res.status(500).json({ error: e.message }); }
});

async function createSquareOrder({ items }) {
  const { ordersApi } = squareClient;
  const lineItems = items.map(i => ({
    name: i.name,
    quantity: String(i.qty || 1),
    basePriceMoney: toMoney(i.price || 0)
  }));
  const res = await ordersApi.createOrder({
    order: { locationId: SQUARE_LOCATION_ID, lineItems },
    idempotencyKey: uuidv4()
  });
  return res.result;
}

app.post('/api/orders/square', async (req,res) => {
  try {
    if (!process.env.SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) return res.status(400).json({ error:'Square not configured' });
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error:'items required' });
    const sq = await createSquareOrder({ items });
    res.json({ ok:true, square: sq });
  } catch(e){ logger.error(e); res.status(500).json({ error: e.message }); }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Error handling
app.use((req,res,next)=> next(createError(404)));
app.use((err, req, res, next)=> {
  logger.error('Error:', err);
  res.status(err.status || 500).json({error: err.message || 'Server error'});
});

// Socket.IO connection handling
io.on('connection', (socket)=>{
  logger.info('Client connected:', socket.id);
  socket.emit('hello', {msg:'connected'});
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Scheduled tasks
cron.schedule('0 6 * * *', async () => {
  // Daily report generation at 6 AM
  try {
    const report = await aiEngine.generateDailyReport();
    logger.info('Daily report generated:', report);
  } catch (error) {
    logger.error('Error generating daily report:', error);
  }
});

cron.schedule('*/5 * * * *', async () => {
  // Update analytics every 5 minutes
  try {
    io.emit('analytics:update', { type: 'refresh', timestamp: new Date() });
  } catch (error) {
    logger.error('Error updating analytics:', error);
  }
});

// Initialize databases and start server
async function startServer() {
  try {
    await initializeDatabases();
    logger.info('Databases initialized successfully');
    
    server.listen(PORT, () => {
      logger.info(`Café Intelligence Dashboard listening on http://localhost:${PORT}`);
      logger.info(`Dashboard available at http://localhost:${PORT}/dashboard`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

