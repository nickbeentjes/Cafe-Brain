const { Pool } = require('pg');
const mongoose = require('mongoose');
const winston = require('winston');

// Configure logging for diagnostics
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Test configurations
const testConfigs = {
  postgres: [
    {
      name: 'Default Local PostgreSQL',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'cafe',
        user: 'postgres',
        password: 'bzchzz',        
        ssl: false,
        connectionTimeoutMillis: 5000,
      }
    },
    {
      name: 'TimescaleDB Local',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'cafe',
        user: 'postgres',
        password: 'bzchzz',
        ssl: false,
        connectionTimeoutMillis: 5000,
      }
    },
    {
      name: 'Environment Variables PostgreSQL',
      config: {
        host: process.env.TIMESCALE_HOST || process.env.POSTGRES_HOST || '4.198.153.55',
        port: process.env.TIMESCALE_PORT || process.env.POSTGRES_PORT || 5432,
        database: process.env.TIMESCALE_DB || process.env.POSTGRES_DB || 'cafe',
        user: process.env.TIMESCALE_USER || process.env.POSTGRES_USER || 'postgres',
        password: process.env.TIMESCALE_PASSWORD || process.env.POSTGRES_PASSWORD || 'bzchzz',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
      }
    }
  ],
  mongodb: [
    {
      name: 'Default Local MongoDB',
      uri: 'mongodb://cafeuser:Lynx%245124@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      }
    },
    {
      name: 'Environment Variables MongoDB',
      uri: process.env.MONGODB_URI || 'mongodb://cafeuser:Lynx%245124@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      }
    }
  ]
};

async function testPostgreSQLConnection(config, name) {
  logger.info(`\n🔍 Testing PostgreSQL: ${name}`);
  logger.info(`   Host: ${config.host}:${config.port}`);
  logger.info(`   Database: ${config.database}`);
  logger.info(`   User: ${config.user}`);
  logger.info(`   SSL: ${config.ssl ? 'enabled' : 'disabled'}`);
  
  const pool = new Pool(config);
  
  try {
    // Test basic connection
    logger.info('   Testing connection...');
    const client = await pool.connect();
    logger.info('   ✅ Connection successful!');
    
    // Test query execution
    logger.info('   Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    logger.info(`   ✅ Query successful! Current time: ${result.rows[0].current_time}`);
    logger.info(`   ✅ PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Test database existence
    logger.info('   Testing database access...');
    const dbResult = await client.query('SELECT current_database() as current_db');
    logger.info(`   ✅ Connected to database: ${dbResult.rows[0].current_db}`);
    
    // Test table creation (if needed)
    logger.info('   Testing table operations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        test_time TIMESTAMPTZ DEFAULT NOW(),
        message TEXT
      )
    `);
    logger.info('   ✅ Table operations successful!');
    
    // Clean up test table
    await client.query('DROP TABLE IF EXISTS test_connection');
    logger.info('   ✅ Cleanup successful!');
    
    client.release();
    await pool.end();
    
    return { success: true, name, config };
  } catch (error) {
    logger.error(`   ❌ PostgreSQL test failed: ${error.message}`);
    logger.error(`   Error details: ${error.stack}`);
    
    // Provide helpful suggestions
    if (error.code === 'ECONNREFUSED') {
      logger.error('   💡 Suggestion: PostgreSQL server is not running or not accessible');
      logger.error('   💡 Try: sudo systemctl start postgresql (Linux) or start PostgreSQL service (Windows)');
    } else if (error.code === '28P01') {
      logger.error('   💡 Suggestion: Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      logger.error('   💡 Suggestion: Database does not exist - create it first');
    }
    
    await pool.end();
    return { success: false, name, config, error: error.message };
  }
}

async function testMongoDBConnection(uri, options, name) {
  logger.info(`\n🔍 Testing MongoDB: ${name}`);
  logger.info(`   URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  logger.info(`   Options: ${JSON.stringify(options, null, 2)}`);
  
  try {
    // Test connection
    logger.info('   Testing connection...');
    await mongoose.connect(uri, options);
    logger.info('   ✅ Connection successful!');
    
    // Test database operations
    logger.info('   Testing database operations...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    logger.info(`   ✅ Found ${collections.length} collections`);
    
    // Test collection creation and insertion
    logger.info('   Testing collection operations...');
    const testCollection = db.collection('test_connection');
    await testCollection.insertOne({
      test_time: new Date(),
      message: 'Connection test successful'
    });
    logger.info('   ✅ Insert operation successful!');
    
    // Test query
    const result = await testCollection.findOne({});
    logger.info(`   ✅ Query operation successful! Found document: ${result._id}`);
    
    // Clean up
    await testCollection.deleteOne({ _id: result._id });
    logger.info('   ✅ Cleanup successful!');
    
    await mongoose.connection.close();
    
    return { success: true, name, uri, options };
  } catch (error) {
    logger.error(`   ❌ MongoDB test failed: ${error.message}`);
    logger.error(`   Error details: ${error.stack}`);
    
    // Provide helpful suggestions
    if (error.name === 'MongoNetworkError') {
      logger.error('   💡 Suggestion: MongoDB server is not running or not accessible');
      logger.error('   💡 Try: sudo systemctl start mongod (Linux) or start MongoDB service (Windows)');
    } else if (error.name === 'MongoServerSelectionError') {
      logger.error('   💡 Suggestion: Cannot reach MongoDB server - check host/port');
    } else if (error.name === 'MongoParseError') {
      logger.error('   💡 Suggestion: Invalid connection string format');
    }
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    return { success: false, name, uri, options, error: error.message };
  }
}

async function runDiagnostics() {
  logger.info('🚀 Starting Database Connection Diagnostics');
  logger.info('==========================================');
  
  // Display environment info
  logger.info(`\n📋 Environment Information:`);
  logger.info(`   Node.js version: ${process.version}`);
  logger.info(`   Platform: ${process.platform}`);
  logger.info(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  logger.info(`   Current working directory: ${process.cwd()}`);
  
  // Display environment variables
  logger.info(`\n🔧 Database Environment Variables:`);
  const dbEnvVars = [
    'TIMESCALE_HOST', 'TIMESCALE_PORT', 'TIMESCALE_DB', 'TIMESCALE_USER', 'TIMESCALE_PASSWORD',
    'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD',
    'MONGODB_URI'
  ];
  
  dbEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      logger.info(`   ${varName}: ${varName.includes('PASSWORD') ? '***' : value}`);
    } else {
      logger.info(`   ${varName}: not set`);
    }
  });
  
  // Test PostgreSQL connections
  logger.info(`\n🐘 PostgreSQL Connection Tests`);
  logger.info(`============================`);
  
  const postgresResults = [];
  for (const testConfig of testConfigs.postgres) {
    const result = await testPostgreSQLConnection(testConfig.config, testConfig.name);
    postgresResults.push(result);
  }
  
  // Test MongoDB connections
  logger.info(`\n🍃 MongoDB Connection Tests`);
  logger.info(`==========================`);
  
  const mongoResults = [];
  for (const testConfig of testConfigs.mongodb) {
    const result = await testMongoDBConnection(testConfig.uri, testConfig.options, testConfig.name);
    mongoResults.push(result);
  }
  
  // Summary
  logger.info(`\n📊 Test Summary`);
  logger.info(`===============`);
  
  const successfulPostgres = postgresResults.filter(r => r.success);
  const successfulMongo = mongoResults.filter(r => r.success);
  
  logger.info(`PostgreSQL: ${successfulPostgres.length}/${postgresResults.length} successful`);
  logger.info(`MongoDB: ${successfulMongo.length}/${mongoResults.length} successful`);
  
  if (successfulPostgres.length > 0) {
    logger.info(`\n✅ Working PostgreSQL configurations:`);
    successfulPostgres.forEach(result => {
      logger.info(`   - ${result.name}`);
    });
  }
  
  if (successfulMongo.length > 0) {
    logger.info(`\n✅ Working MongoDB configurations:`);
    successfulMongo.forEach(result => {
      logger.info(`   - ${result.name}`);
    });
  }
  
  if (successfulPostgres.length === 0 && successfulMongo.length === 0) {
    logger.error(`\n❌ No database connections are working!`);
    logger.error(`Please check:`);
    logger.error(`1. Database servers are running`);
    logger.error(`2. Connection credentials are correct`);
    logger.error(`3. Network connectivity`);
    logger.error(`4. Firewall settings`);
  }
  
  return {
    postgres: postgresResults,
    mongodb: mongoResults,
    summary: {
      postgresSuccess: successfulPostgres.length,
      postgresTotal: postgresResults.length,
      mongoSuccess: successfulMongo.length,
      mongoTotal: mongoResults.length
    }
  };
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics()
    .then(results => {
      logger.info('\n🎉 Diagnostics completed!');
      process.exit(0);
    })
    .catch(error => {
      logger.error('💥 Diagnostics failed:', error);
      process.exit(1);
    });
}

module.exports = { runDiagnostics, testPostgreSQLConnection, testMongoDBConnection };
