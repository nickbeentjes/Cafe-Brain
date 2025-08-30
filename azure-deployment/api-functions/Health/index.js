const { checkConnections, logger } = require('../database');

module.exports = async function (context, req) {
  logger.info('Health check requested');

  try {
    // CORS headers
    context.res = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };

    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
      context.res.status = 200;
      return;
    }

    // Check database connections
    const dbStatus = await checkConnections();
    
    // System status
    const systemStatus = {
      timestamp: new Date().toISOString(),
      service: 'cafe-brain-api',
      version: '1.0.0',
      status: dbStatus.postgres && dbStatus.mongodb ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      databases: {
        postgres: {
          status: dbStatus.postgres ? 'connected' : 'disconnected',
          host: process.env.TIMESCALE_HOST,
          database: process.env.TIMESCALE_DB
        },
        mongodb: {
          status: dbStatus.mongodb ? 'connected' : 'disconnected',
          database: 'cafe'
        }
      }
    };

    // Set response status based on health
    if (systemStatus.status === 'healthy') {
      context.res.status = 200;
    } else {
      context.res.status = 503; // Service Unavailable
      systemStatus.errors = dbStatus.errors;
    }

    context.res.body = systemStatus;

  } catch (error) {
    logger.error('Health check error:', error);
    context.res.status = 500;
    context.res.body = {
      timestamp: new Date().toISOString(),
      service: 'cafe-brain-api',
      status: 'unhealthy',
      error: error.message
    };
  }
};
