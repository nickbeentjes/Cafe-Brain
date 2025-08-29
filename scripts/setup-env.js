const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🔧 Database Environment Setup');
  console.log('=============================\n');
  
  const envVars = {};
  
  console.log('PostgreSQL/TimescaleDB Configuration:');
  console.log('--------------------------------------');
  
  envVars.TIMESCALE_HOST = await question('PostgreSQL Host (default: 4.198.153.55): ') || '4.198.153.55';
  envVars.TIMESCALE_PORT = await question('PostgreSQL Port (default: 5432): ') || '5432';
  envVars.TIMESCALE_DB = await question('PostgreSQL Database (default: cafe): ') || 'cafe';
  envVars.TIMESCALE_USER = await question('PostgreSQL Username (default: postgres): ') || 'postgres';
  envVars.TIMESCALE_PASSWORD = await question('PostgreSQL Password (leave empty if none): ') || 'bzchzz';
  
  console.log('\nMongoDB Configuration:');
  console.log('---------------------');
  
  const mongoHost = await question('MongoDB Host (default: 4.198.153.55): ') || '4.198.153.55';
  const mongoPort = await question('MongoDB Port (default: 9017): ') || '9017';
  const mongoDB = await question('MongoDB Database (default: cafe): ') || 'cafe';
  
  envVars.MONGODB_URI = `mongodb://${mongoHost}:${mongoPort}/${mongoDB}`;
  
  console.log('\nOther Configuration:');
  console.log('-------------------');
  
  envVars.NODE_ENV = await question('NODE_ENV (default: development): ') || 'development';
  
  // Generate .env file content
  const envContent = `# Database Configuration
# PostgreSQL/TimescaleDB
TIMESCALE_HOST=${envVars.TIMESCALE_HOST}
TIMESCALE_PORT=${envVars.TIMESCALE_PORT}
TIMESCALE_DB=${envVars.TIMESCALE_DB}
TIMESCALE_USER=${envVars.TIMESCALE_USER}
${envVars.TIMESCALE_PASSWORD ? `TIMESCALE_PASSWORD=${envVars.TIMESCALE_PASSWORD}` : '# TIMESCALE_PASSWORD='}

# MongoDB
MONGODB_URI=${envVars.MONGODB_URI}

# Environment
NODE_ENV=${envVars.NODE_ENV}

# Square API (if needed)
SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv
SQUARE_LOCATION_ID=L5D18K5RBWQJH
`;

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Environment file created: ${envPath}`);
    console.log('\n📋 Generated configuration:');
    console.log(envContent);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Review the .env file above');
    console.log('2. Run: node scripts/quick-db-test.js');
    console.log('3. Run: node scripts/db-diagnostic.js (for detailed diagnostics)');
    
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
  
  rl.close();
}

// Run setup if executed directly
if (require.main === module) {
  setupEnvironment()
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { setupEnvironment };
