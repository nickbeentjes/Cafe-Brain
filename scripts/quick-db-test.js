const { runDiagnostics } = require('./db-diagnostic');

async function quickTest() {
  console.log('🔍 Quick Database Connection Test');
  console.log('==================================\n');
  
  try {
    const results = await runDiagnostics();
    
    console.log('\n📊 Quick Summary:');
    console.log(`PostgreSQL: ${results.summary.postgresSuccess}/${results.summary.postgresTotal} working`);
    console.log(`MongoDB: ${results.summary.mongoSuccess}/${results.summary.mongoTotal} working`);
    
    if (results.summary.postgresSuccess > 0 || results.summary.mongoSuccess > 0) {
      console.log('\n✅ At least one database connection is working!');
      return true;
    } else {
      console.log('\n❌ No database connections are working.');
      return false;
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

// Run quick test if executed directly
if (require.main === module) {
  quickTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { quickTest };
