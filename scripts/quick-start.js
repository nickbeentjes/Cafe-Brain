#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Louise\'s Café Intelligence Dashboard - Quick Start');
console.log('==================================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envTemplate = `# Server Configuration
PORT=5050
NODE_ENV=development

# Square API Configuration
SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv
SQUARE_LOCATION_ID=L5D18K5RBWQJH
SQUARE_ENV=production
SQUARE_VERSION=2025-07-16

# Database Configuration
# TimescaleDB (PostgreSQL)
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=cafe
TIMESCALE_USER=postgres'áamP@cific123%qzf'


# MongoDB
MONGODB_URI=mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe

# External APIs (Optional)
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Café Configuration
CAFE_LOCATION=Mewcastle,AU

# Pricing Configuration
MIN_MARKUP=3.0
PRICE_ROUNDING=0.5
PSYCH_ENDING=0.90

# Data Sync Configuration
SQ_ORDERS_BACKFILL_DAYS=30
SQ_CATALOG_TYPES=ITEM,ITEM_VARIATION,CATEGORY,MODIFIER,MODIFIER_LIST,TAX,DISCOUNT,IMAGE

# Logging
LOG_LEVEL=info
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created! Please edit it with your actual configuration.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed.\n');
}

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created.\n');
}

// Check if data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Data directory created.\n');
}

console.log('🎯 Next Steps:');
console.log('==============');
console.log('');
console.log('1. 📝 Edit the .env file with your actual configuration:');
console.log('   - Square API credentials');
console.log('   - Database connection details');
console.log('   - Optional API keys for weather and AI features');
console.log('');
console.log('2. 🗄️  Set up your databases:');
console.log('   - TimescaleDB (PostgreSQL with TimescaleDB extension)');
console.log('   - MongoDB');
console.log('');
console.log('3. 🚀 Start the application:');
console.log('   npm start');
console.log('');
console.log('4. 🌐 Access the dashboard:');
console.log('   http://localhost:5050/dashboard');
console.log('');
console.log('5. 🔧 Set up database tables and sample data:');
console.log('   npm run setup-db');
console.log('');
console.log('📚 For detailed documentation, see README.md');
console.log('');
console.log('🎉 Happy café management! ☕');


