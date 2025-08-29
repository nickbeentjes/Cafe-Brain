const { syncOrders } = require('../../workers/enhanced-orders-sync');
const { initializeDatabases, logger } = require('../../config/database');

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();
    
    context.log('Square Sync Function triggered:', timeStamp);
    
    try {
        // Initialize databases
        context.log('Initializing database connections...');
        const dbConnections = await initializeDatabases();
        
        if (!dbConnections.timescalePool) {
            context.log.error('TimescaleDB connection failed');
            throw new Error('Database connection failed');
        }
        
        context.log('Database connections established successfully');
        
        // Run the sync
        context.log('Starting Square transaction sync...');
        await syncOrders();
        
        context.log('Square sync completed successfully');
        
        // Return success
        context.res = {
            status: 200,
            body: {
                message: 'Square sync completed successfully',
                timestamp: timeStamp,
                success: true
            }
        };
        
    } catch (error) {
        context.log.error('Square sync failed:', error);
        
        // Return error response
        context.res = {
            status: 500,
            body: {
                message: 'Square sync failed',
                error: error.message,
                timestamp: timeStamp,
                success: false
            }
        };
        
        // Re-throw for Azure Functions error handling
        throw error;
    }
};
