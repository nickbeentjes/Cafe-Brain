const https = require('https');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const { initializeDatabases, getTimescalePool, getMongoConnection, logger } = require('../config/database');
const { Analytics, AIInsight } = require('../models/Analytics');

// Configuration
const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) {
  logger.error('Missing SQUARE_ACCESS_TOKEN');
  process.exit(1);
}

const env = (process.env.SQUARE_ENV || 'production').toLowerCase();
const host = env === 'sandbox' ? 'connect.squareupsandbox.com' : 'connect.squareup.com';
const squareVersion = process.env.SQUARE_VERSION || '2025-07-16';
const locId = process.env.SQUARE_LOCATION_ID || '';
const BACKFILL_DAYS = Number(process.env.SQ_ORDERS_BACKFILL_DAYS || 365 * 5);

const headers = {
  'Authorization': `Bearer ${token}`,
  'Square-Version': squareVersion,
  'Content-Type': 'application/json'
};

// HTTP request helper
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path,
      method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Load checkpoint
function loadCheckpoint() {
  try {
    const checkpointPath = path.join(process.cwd(), 'data', 'orders.checkpoint.json');
    if (fs.existsSync(checkpointPath)) {
      return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    }
  } catch (error) {
    logger.error('Error loading checkpoint:', error);
  }
  return null;
}

// Save checkpoint
function saveCheckpoint(checkpoint) {
  try {
    const checkpointPath = path.join(process.cwd(), 'data', 'orders.checkpoint.json');
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    logger.error('Error saving checkpoint:', error);
  }
}

// Store transaction in TimescaleDB
async function storeTransaction(timescalePool, transaction) {
  const client = await timescalePool.connect();
  
  try {
    // Insert main transaction
    await client.query(`
      INSERT INTO transactions (
        id, square_id, customer_id, location_id, total_amount, 
        tax_amount, discount_amount, payment_method, status, 
        created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (square_id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        tax_amount = EXCLUDED.tax_amount,
        discount_amount = EXCLUDED.discount_amount,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        metadata = EXCLUDED.metadata
    `, [
      transaction.id,
      transaction.square_id,
      transaction.customer_id,
      transaction.location_id,
      transaction.total_amount,
      transaction.tax_amount,
      transaction.discount_amount,
      transaction.payment_method,
      transaction.status,
      transaction.created_at,
      transaction.updated_at,
      JSON.stringify(transaction.metadata)
    ]);

    // Insert transaction items
    for (const item of transaction.items) {
      await client.query(`
        INSERT INTO transaction_items (
          id, transaction_id, product_id, product_name, category,
          quantity, unit_price, total_price, modifiers, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          quantity = EXCLUDED.quantity,
          unit_price = EXCLUDED.unit_price,
          total_price = EXCLUDED.total_price,
          modifiers = EXCLUDED.modifiers
      `, [
        item.id,
        transaction.id,
        item.product_id,
        item.product_name,
        item.category,
        item.quantity,
        item.unit_price,
        item.total_price,
        JSON.stringify(item.modifiers),
        transaction.created_at
      ]);
    }

    logger.info(`Stored transaction ${transaction.square_id} with ${transaction.items.length} items`);
  } catch (error) {
    logger.error('Error storing transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Generate analytics insights
async function generateInsights(mongoConnection, transaction) {
  try {
    // Calculate basic metrics
    const totalRevenue = transaction.total_amount;
    const itemCount = transaction.items.length;
    const avgItemValue = totalRevenue / itemCount;

    // Create analytics record
    const analytics = new Analytics({
      date: new Date(transaction.created_at),
      type: 'hourly',
      metrics: {
        totalRevenue,
        transactionCount: 1,
        averageTransactionValue: totalRevenue,
        uniqueCustomers: transaction.customer_id ? 1 : 0,
        topProducts: transaction.items.map(item => ({
          productName: item.product_name,
          quantity: item.quantity,
          revenue: item.total_price
        }))
      }
    });

    await analytics.save();

    // Check for anomalies or opportunities
    await checkForInsights(mongoConnection, transaction);

  } catch (error) {
    logger.error('Error generating insights:', error);
  }
}

// Check for AI insights
async function checkForInsights(mongoConnection, transaction) {
  try {
    // Get recent transactions for comparison
    const recentTransactions = await Analytics.find({
      date: { $gte: moment().subtract(7, 'days').toDate() }
    }).sort({ date: -1 }).limit(100);

    if (recentTransactions.length < 10) return; // Need more data

    const avgTransactionValue = recentTransactions.reduce((sum, t) => sum + t.metrics.averageTransactionValue, 0) / recentTransactions.length;
    
    // Check for high-value transaction anomaly
    if (transaction.total_amount > avgTransactionValue * 2) {
      const insight = new AIInsight({
        type: 'anomaly',
        title: 'High-Value Transaction Detected',
        description: `Transaction value $${transaction.total_amount} is significantly above average of $${avgTransactionValue.toFixed(2)}`,
        severity: 'medium',
        category: 'sales',
        data: {
          transactionId: transaction.square_id,
          value: transaction.total_amount,
          average: avgTransactionValue
        }
      });
      await insight.save();
    }

    // Check for popular product combinations
    const productNames = transaction.items.map(item => item.product_name).sort();
    const combination = productNames.join(' + ');
    
    // This could be expanded to track popular combinations over time
    logger.info(`Product combination: ${combination}`);

  } catch (error) {
    logger.error('Error checking for insights:', error);
  }
}

// Main sync function
async function syncOrders() {
  let timescalePool, mongoConnection;
  
  try {
    // Initialize databases
    const dbConnections = await initializeDatabases();
    timescalePool = dbConnections.timescalePool;
    mongoConnection = dbConnections.mongoConnection;

    // Load checkpoint
    const checkpoint = loadCheckpoint();
    const beginTime = checkpoint?.lastSync || moment().subtract(BACKFILL_DAYS, 'days').toISOString();
    
    logger.info(`Starting sync from ${beginTime}`);

    let cursor, total = 0, pages = 0;
    const newCheckpoint = { lastSync: new Date().toISOString(), processedCount: 0 };

    do {
      // Build API path
      let path = `/v2/payments?begin_time=${encodeURIComponent(beginTime)}&sort_order=DESC&limit=100`;
      if (locId) path += `&location_id=${encodeURIComponent(locId)}`;
      if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;

      const response = await makeRequest(path);
      const payments = response.payments || [];
      
      total += payments.length;
      pages += 1;
      
      logger.info(`Page ${pages}: Processing ${payments.length} payments`);

      // Process each payment
      for (const payment of payments) {
        try {
          // Transform Square payment to our format
          const transaction = {
            id: uuidv4(),
            square_id: payment.id,
            customer_id: payment.customer_id || null,
            location_id: payment.location_id,
            total_amount: (payment.total_money?.amount || 0) / 100,
            tax_amount: (payment.tax_money?.amount || 0) / 100,
            discount_amount: (payment.discount_money?.amount || 0) / 100,
            payment_method: payment.payment_method || 'unknown',
            status: payment.status,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            metadata: {
              receipt_url: payment.receipt_url,
              order_id: payment.order_id,
              reference_id: payment.reference_id
            },
            items: []
          };

          // Extract line items if available
          if (payment.order_id) {
            try {
              const orderResponse = await makeRequest(`/v2/orders/${payment.order_id}`);
              const order = orderResponse.order;
              
              if (order && order.line_items) {
                transaction.items = order.line_items.map((item, index) => ({
                  id: uuidv4(),
                  product_id: item.catalog_object_id,
                  product_name: item.name,
                  category: item.item_type || 'unknown',
                  quantity: parseInt(item.quantity) || 1,
                  unit_price: (item.base_price_money?.amount || 0) / 100,
                  total_price: (item.total_money?.amount || 0) / 100,
                  modifiers: item.modifiers || []
                }));
              }
            } catch (orderError) {
              logger.warn(`Could not fetch order details for ${payment.order_id}:`, orderError.message);
            }
          }

          // Store in TimescaleDB
          await storeTransaction(timescalePool, transaction);
          
          // Generate analytics insights
          await generateInsights(mongoConnection, transaction);
          
          newCheckpoint.processedCount++;

        } catch (error) {
          logger.error(`Error processing payment ${payment.id}:`, error);
        }
      }

      cursor = response.cursor;
      
      // Save checkpoint periodically
      if (pages % 10 === 0) {
        saveCheckpoint(newCheckpoint);
      }

    } while (cursor);

    // Final checkpoint save
    saveCheckpoint(newCheckpoint);
    
    logger.info(`Sync completed: ${total} payments processed across ${pages} pages`);
    
    // Generate daily analytics summary
    await generateDailySummary(mongoConnection);

  } catch (error) {
    logger.error('Sync failed:', error);
    throw error;
  }
}

// Generate daily analytics summary
async function generateDailySummary(mongoConnection) {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    // Get today's analytics
    const todayAnalytics = await Analytics.find({
      date: { $gte: today.toDate(), $lt: moment().endOf('day').toDate() }
    });

    if (todayAnalytics.length > 0) {
      const summary = {
        date: today.toDate(),
        type: 'daily',
        metrics: {
          totalRevenue: todayAnalytics.reduce((sum, a) => sum + a.metrics.totalRevenue, 0),
          transactionCount: todayAnalytics.reduce((sum, a) => sum + a.metrics.transactionCount, 0),
          averageTransactionValue: 0,
          uniqueCustomers: 0
        }
      };

      if (summary.metrics.transactionCount > 0) {
        summary.metrics.averageTransactionValue = summary.metrics.totalRevenue / summary.metrics.transactionCount;
      }

      // Save daily summary
      const dailyAnalytics = new Analytics(summary);
      await dailyAnalytics.save();
      
      logger.info(`Daily summary generated: $${summary.metrics.totalRevenue.toFixed(2)} from ${summary.metrics.transactionCount} transactions`);
    }

  } catch (error) {
    logger.error('Error generating daily summary:', error);
  }
}

// Run the sync
if (require.main === module) {
  syncOrders()
    .then(() => {
      logger.info('Enhanced orders sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Enhanced orders sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncOrders };

