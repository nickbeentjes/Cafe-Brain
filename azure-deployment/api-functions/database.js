const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cafe-brain-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// PostgreSQL/TimescaleDB Connection Pool
let pgPool = null;

const getPostgresPool = () => {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.TIMESCALE_HOST,
      port: process.env.TIMESCALE_PORT,
      database: process.env.TIMESCALE_DB,
      user: process.env.TIMESCALE_USER,
      password: process.env.TIMESCALE_PASSWORD,
      ssl: false, // Set to true if using SSL
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pgPool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }
  return pgPool;
};

// MongoDB Connection
let mongoClient = null;

const getMongoClient = async () => {
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await mongoClient.connect();
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return mongoClient;
};

// Health check function
const checkConnections = async () => {
  const results = {
    postgres: false,
    mongodb: false,
    errors: []
  };

  try {
    // Test PostgreSQL
    const pool = getPostgresPool();
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    results.postgres = true;
  } catch (error) {
    results.errors.push(`PostgreSQL: ${error.message}`);
  }

  try {
    // Test MongoDB
    const client = await getMongoClient();
    await client.db('cafe').admin().ping();
    results.mongodb = true;
  } catch (error) {
    results.errors.push(`MongoDB: ${error.message}`);
  }

  return results;
};

// Close connections (for cleanup)
const closeConnections = async () => {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
};

module.exports = {
  getPostgresPool,
  getMongoClient,
  checkConnections,
  closeConnections,
  logger
};
