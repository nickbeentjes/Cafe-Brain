const { getPostgresPool, getMongoClient, logger } = require('../database');

module.exports = async function (context, req) {
  const { method, url } = req;
  const path = url.split('/').slice(-1)[0]; // Get the last part of the URL
  
  logger.info(`Orders API called: ${method} ${url}`);

  try {
    // CORS headers
    context.res = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };

    // Handle OPTIONS requests for CORS
    if (method === 'OPTIONS') {
      context.res.status = 200;
      return;
    }

    // Route handling
    switch (method) {
      case 'GET':
        if (path === 'recent') {
          return await getRecentOrders(context);
        } else if (path === 'analytics') {
          return await getOrderAnalytics(context);
        } else if (path === 'summary') {
          return await getOrderSummary(context);
        } else {
          return await getAllOrders(context);
        }
        break;

      case 'POST':
        if (path === 'sync') {
          return await syncOrders(context, req.body);
        } else {
          return await createOrder(context, req.body);
        }
        break;

      default:
        context.res.status = 405;
        context.res.body = { error: 'Method not allowed' };
        return;
    }

  } catch (error) {
    logger.error('Orders API error:', error);
    context.res.status = 500;
    context.res.body = { 
      error: 'Internal server error',
      message: error.message 
    };
  }
};

// Get all orders
async function getAllOrders(context) {
  const pool = getPostgresPool();
  const query = `
    SELECT 
      o.id,
      o.square_order_id,
      o.customer_id,
      o.total_amount,
      o.status,
      o.created_at,
      o.updated_at,
      c.name as customer_name,
      c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 100
  `;

  const result = await pool.query(query);
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: result.rows,
    count: result.rows.length
  };
}

// Get recent orders (last 24 hours)
async function getRecentOrders(context) {
  const pool = getPostgresPool();
  const query = `
    SELECT 
      o.id,
      o.square_order_id,
      o.customer_id,
      o.total_amount,
      o.status,
      o.created_at,
      c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY o.created_at DESC
  `;

  const result = await pool.query(query);
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: result.rows,
    count: result.rows.length
  };
}

// Get order analytics
async function getOrderAnalytics(context) {
  const pool = getPostgresPool();
  
  // Daily revenue for last 7 days
  const dailyQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue
    FROM orders 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  // Hourly distribution for today
  const hourlyQuery = `
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour
  `;

  const [dailyResult, hourlyResult] = await Promise.all([
    pool.query(dailyQuery),
    pool.query(hourlyQuery)
  ]);

  context.res.status = 200;
  context.res.body = {
    success: true,
    data: {
      daily: dailyResult.rows,
      hourly: hourlyResult.rows
    }
  };
}

// Get order summary
async function getOrderSummary(context) {
  const pool = getPostgresPool();
  
  const query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM orders 
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;

  const result = await pool.query(query);
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: result.rows[0]
  };
}

// Sync orders from Square
async function syncOrders(context, body) {
  // This would integrate with your existing Square sync logic
  // For now, return a placeholder
  context.res.status = 200;
  context.res.body = {
    success: true,
    message: 'Order sync initiated',
    data: { syncId: Date.now() }
  };
}

// Create new order
async function createOrder(context, body) {
  const { square_order_id, customer_id, total_amount, status = 'pending' } = body;
  
  if (!square_order_id || !customer_id || !total_amount) {
    context.res.status = 400;
    context.res.body = { error: 'Missing required fields' };
    return;
  }

  const pool = getPostgresPool();
  const query = `
    INSERT INTO orders (square_order_id, customer_id, total_amount, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [square_order_id, customer_id, total_amount, status]);
  
  context.res.status = 201;
  context.res.body = {
    success: true,
    data: result.rows[0]
  };
}
