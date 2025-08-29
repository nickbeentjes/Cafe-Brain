const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variable Debug Script');
console.log('=====================================\n');

// Check current environment variables
console.log('📋 Current Environment Variables:');
const squareVars = [
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_LOCATION_ID', 
  'SQUARE_ENV',
  'SQUARE_VERSION'
];

squareVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${varName.includes('TOKEN') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`   ❌ ${varName}: not set`);
  }
});

// Check for .env file
console.log('\n📁 Checking for .env file...');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('   📄 .env file contents:');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        if (key.includes('TOKEN')) {
          console.log(`      ${key}=***${value.slice(-4)}`);
        } else {
          console.log(`      ${key}=${value}`);
        }
      }
    }
  });
} else {
  console.log('   ❌ .env file not found');
}

// Check Azure Functions local settings
console.log('\n📁 Checking Azure Functions local settings...');
const localSettingsPath = path.join(process.cwd(), 'azure-deployment', 'azure-functions-sync', 'local.settings.json');
if (fs.existsSync(localSettingsPath)) {
  console.log('   ✅ local.settings.json found');
  try {
    const localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
    console.log('   📄 local.settings.json contents:');
    Object.entries(localSettings.Values || {}).forEach(([key, value]) => {
      if (key.includes('SQUARE')) {
        if (key.includes('TOKEN')) {
          console.log(`      ${key}=***${value.slice(-4)}`);
        } else {
          console.log(`      ${key}=${value}`);
        }
      }
    });
  } catch (error) {
    console.log('   ❌ Error reading local.settings.json:', error.message);
  }
} else {
  console.log('   ❌ local.settings.json not found');
}

// Check if dotenv is being loaded
console.log('\n🔧 Checking dotenv loading...');
try {
  require('dotenv').config();
  console.log('   ✅ dotenv loaded');
  
  // Check again after dotenv
  console.log('   📋 Environment variables after dotenv:');
  squareVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`      ✅ ${varName}: ${varName.includes('TOKEN') ? '***' + value.slice(-4) : value}`);
    } else {
      console.log(`      ❌ ${varName}: still not set`);
    }
  });
} catch (error) {
  console.log('   ❌ dotenv not available or error loading:', error.message);
}

// Test Square API directly
console.log('\n🧪 Testing Square API access...');
const https = require('https');

async function testSquareAPI() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  
  if (!token) {
    console.log('   ❌ No Square access token found');
    return;
  }
  
  if (!locationId) {
    console.log('   ❌ No Square location ID found');
    return;
  }
  
  console.log('   🔍 Testing Square API with current credentials...');
  
  const options = {
    hostname: 'connect.squareup.com',
    path: '/v2/locations',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Square-Version': '2025-07-16',
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Square API test successful');
          try {
            const response = JSON.parse(data);
            console.log(`   📍 Found ${response.locations?.length || 0} locations`);
            if (response.locations?.length > 0) {
              console.log(`   🎯 Current location ID matches: ${response.locations.some(loc => loc.id === locationId)}`);
            }
          } catch (e) {
            console.log('   ⚠️ Response parsing failed');
          }
        } else {
          console.log(`   ❌ Square API test failed: ${res.statusCode} - ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Square API request failed: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

testSquareAPI().then(() => {
  console.log('\n🎯 Summary:');
  console.log('   - Check if .env file exists and has correct values');
  console.log('   - Ensure dotenv is being loaded in your application');
  console.log('   - Verify Square API credentials are valid');
  console.log('   - Check if running in correct environment (development/production)');
});
