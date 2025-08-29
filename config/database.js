const { Pool } = require('pg');
const mongoose = require('mongoose');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cafe-brain' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// TimescaleDB (PostgreSQL) Configuration
const timescaleConfig = {
  host: process.env.TIMESCALE_HOST || process.env.POSTGRES_HOST || '4.198.153.55',
  port: process.env.TIMESCALE_PORT || process.env.POSTGRES_PORT || 5432,
  database: process.env.TIMESCALE_DB || process.env.POSTGRES_DB || 'cafe',
  user: process.env.TIMESCALE_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.TIMESCALE_PASSWORD || process.env.POSTGRES_PASSWORD || 'bzchzz',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// MongoDB Configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://cafeuser:Lynx%245124@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Add retry logic
    retryWrites: true,
    retryReads: true,
    // Better error handling
    bufferCommands: false,
    bufferMaxEntries: 0,
  }
};

// Initialize connections
let timescalePool = null;
let mongoConnection = null;

async function initializeDatabases() {
  try {
    // For development, skip database connections entirely
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_DB === 'true') {
      logger.info('Running in development mode - using file storage only');
      timescalePool = null;
      mongoConnection = null;
      return { timescalePool: null, mongoConnection: null };
    }

    // Try to initialize TimescaleDB
    try {
      timescalePool = new Pool(timescaleConfig);
      
      // Test TimescaleDB connection
      const client = await timescalePool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('TimescaleDB connected successfully');

      // Setup TimescaleDB tables and hypertables
      await setupTimescaleTables();
    } catch (timescaleError) {
      logger.warn('TimescaleDB connection failed, running in file-only mode:', timescaleError.message);
      timescalePool = null;
    }

    // Try to initialize MongoDB
    try {
      await mongoose.connect(mongoConfig.uri, mongoConfig.options);
      mongoConnection = mongoose.connection;
      
      // Test the connection
      await mongoConnection.db.admin().ping();
      logger.info('MongoDB connected successfully');
      
      // Log connection details
      logger.info(`MongoDB URI: ${mongoConfig.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      logger.info(`MongoDB Database: ${mongoConnection.db.databaseName}`);
    } catch (mongoError) {
      logger.warn('MongoDB connection failed, running in file-only mode:', mongoError.message);
      logger.warn('MongoDB Error details:', mongoError.stack);
      mongoConnection = null;
    }
    
    return { timescalePool, mongoConnection: mongoose.connection };
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function setupTimescaleTables() {
  const client = await timescalePool.connect();
  
  try {
    // Create transactions table with TimescaleDB hypertable
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY,
        square_id VARCHAR(255) UNIQUE,
        customer_id VARCHAR(255),
        location_id VARCHAR(255),
        total_amount DECIMAL(10,2),
        tax_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2),
        payment_method VARCHAR(100),
        status VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        metadata JSONB
      )
    `);

    // Try to convert to hypertable if TimescaleDB is available
    try {
      await client.query(`
        SELECT create_hypertable('transactions', 'created_at', 
          if_not_exists => TRUE, 
          migrate_data => TRUE
        )
      `);
      logger.info('TimescaleDB hypertable created successfully');
    } catch (hypertableError) {
      logger.warn('TimescaleDB not available, using regular PostgreSQL table:', hypertableError.message);
      // Create a regular index on created_at for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
        ON transactions (created_at)
      `);
    }

    // Create transaction items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id UUID PRIMARY KEY,
        transaction_id UUID REFERENCES transactions(id),
        product_id VARCHAR(255),
        product_name VARCHAR(255),
        category VARCHAR(100),
        quantity INTEGER,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        modifiers JSONB,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        sku VARCHAR(100),
        price DECIMAL(10,2),
        cogs DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create analytics views
    await client.query(`
      CREATE OR REPLACE VIEW daily_sales AS
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM transactions 
      WHERE status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    await client.query(`
      CREATE OR REPLACE VIEW hourly_sales AS
      SELECT 
        DATE(created_at) as date,
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue
      FROM transactions 
      WHERE status = 'COMPLETED'
      GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY date DESC, hour
    `);

    logger.info('TimescaleDB tables and views created successfully');
  } catch (error) {
    logger.error('Error setting up TimescaleDB tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function closeConnections() {
  if (timescalePool) {
    await timescalePool.end();
    logger.info('TimescaleDB connection closed');
  }
  if (mongoConnection) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeConnections();
  process.exit(0);
});

module.exports = {
  initializeDatabases,
  closeConnections,
  getTimescalePool: () => timescalePool,
  getMongoConnection: () => mongoose.connection,
  logger
};
