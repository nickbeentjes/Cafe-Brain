const { syncOrders } = require('../../workers/enhanced-orders-sync');
const { initializeDatabases, logger } = require('../../config/database');
const { AIAnalyticsEngine } = require('../../services/AIAnalyticsEngine');

class AISyncAgent {
  constructor() {
    this.aiEngine = new AIAnalyticsEngine();
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.alertThresholds = {
      highValueTransaction: 100, // $100
      unusualPattern: 0.8, // 80% confidence
      rapidTransactions: 10 // 10 transactions in 5 minutes
    };
  }

  async initialize() {
    try {
      logger.info('🤖 Initializing AI Sync Agent...');
      
      // Initialize databases
      this.dbConnections = await initializeDatabases();
      
      if (!this.dbConnections.timescalePool) {
        throw new Error('Database connection failed');
      }
      
      logger.info('✅ AI Agent initialized successfully');
      return true;
    } catch (error) {
      logger.error('❌ AI Agent initialization failed:', error);
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('AI Agent is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting AI Sync Agent...');

    // Start continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performSync();
    }, this.syncInterval);

    // Perform initial sync
    await this.performSync();
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    logger.info('🛑 AI Sync Agent stopped');
  }

  async performSync() {
    try {
      logger.info('🔄 AI Agent performing sync...');
      
      const startTime = Date.now();
      const previousCount = await this.getTransactionCount();
      
      // Perform the sync
      await syncOrders();
      
      const endTime = Date.now();
      const newCount = await this.getTransactionCount();
      const newTransactions = newCount - previousCount;
      
      this.lastSyncTime = new Date();
      
      logger.info(`✅ Sync completed in ${endTime - startTime}ms. New transactions: ${newTransactions}`);
      
      // If new transactions were found, analyze them
      if (newTransactions > 0) {
        await this.analyzeNewTransactions(newTransactions);
      }
      
      // Generate real-time insights
      await this.generateRealTimeInsights();
      
    } catch (error) {
      logger.error('❌ AI Agent sync failed:', error);
      await this.handleSyncError(error);
    }
  }

  async analyzeNewTransactions(newTransactionCount) {
    try {
      logger.info(`🔍 Analyzing ${newTransactionCount} new transactions...`);
      
      // Get recent transactions for analysis
      const recentTransactions = await this.getRecentTransactions(10);
      
      for (const transaction of recentTransactions) {
        await this.analyzeTransaction(transaction);
      }
      
      // Check for patterns
      await this.detectPatterns(recentTransactions);
      
    } catch (error) {
      logger.error('Error analyzing transactions:', error);
    }
  }

  async analyzeTransaction(transaction) {
    try {
      // Check for high-value transactions
      if (transaction.total_amount > this.alertThresholds.highValueTransaction) {
        await this.triggerHighValueAlert(transaction);
      }
      
      // Check for unusual patterns
      const anomalyScore = await this.aiEngine.detectAnomaly(transaction);
      if (anomalyScore > this.alertThresholds.unusualPattern) {
        await this.triggerAnomalyAlert(transaction, anomalyScore);
      }
      
      // Generate personalized insights
      const insights = await this.aiEngine.generateInsights(transaction);
      await this.storeInsights(insights);
      
    } catch (error) {
      logger.error('Error analyzing transaction:', error);
    }
  }

  async detectPatterns(transactions) {
    try {
      // Check for rapid transaction patterns
      if (transactions.length >= this.alertThresholds.rapidTransactions) {
        await this.triggerRapidTransactionAlert(transactions);
      }
      
      // Check for product combinations
      const combinations = await this.analyzeProductCombinations(transactions);
      await this.storeProductInsights(combinations);
      
      // Check for time-based patterns
      const timePatterns = await this.analyzeTimePatterns(transactions);
      await this.storeTimeInsights(timePatterns);
      
    } catch (error) {
      logger.error('Error detecting patterns:', error);
    }
  }

  async generateRealTimeInsights() {
    try {
      // Generate hourly analytics
      const hourlyInsights = await this.aiEngine.generateHourlyAnalytics();
      await this.storeAnalytics(hourlyInsights);
      
      // Generate predictive insights
      const predictions = await this.aiEngine.generatePredictions();
      await this.storePredictions(predictions);
      
      // Generate recommendations
      const recommendations = await this.aiEngine.generateRecommendations();
      await this.storeRecommendations(recommendations);
      
    } catch (error) {
      logger.error('Error generating real-time insights:', error);
    }
  }

  async triggerHighValueAlert(transaction) {
    const alert = {
      type: 'high_value_transaction',
      severity: 'medium',
      title: 'High-Value Transaction Detected',
      description: `Transaction value $${transaction.total_amount} is above threshold`,
      data: {
        transactionId: transaction.square_id,
        amount: transaction.total_amount,
        timestamp: transaction.created_at
      },
      timestamp: new Date()
    };
    
    await this.storeAlert(alert);
    logger.info(`🚨 High-value alert triggered: $${transaction.total_amount}`);
  }

  async triggerAnomalyAlert(transaction, score) {
    const alert = {
      type: 'anomaly_detected',
      severity: 'high',
      title: 'Unusual Transaction Pattern Detected',
      description: `Anomaly score: ${(score * 100).toFixed(1)}%`,
      data: {
        transactionId: transaction.square_id,
        anomalyScore: score,
        timestamp: transaction.created_at
      },
      timestamp: new Date()
    };
    
    await this.storeAlert(alert);
    logger.info(`🚨 Anomaly alert triggered: ${(score * 100).toFixed(1)}%`);
  }

  async triggerRapidTransactionAlert(transactions) {
    const alert = {
      type: 'rapid_transactions',
      severity: 'medium',
      title: 'Rapid Transaction Activity Detected',
      description: `${transactions.length} transactions in short period`,
      data: {
        transactionCount: transactions.length,
        timeSpan: '5 minutes',
        transactions: transactions.map(t => t.square_id)
      },
      timestamp: new Date()
    };
    
    await this.storeAlert(alert);
    logger.info(`🚨 Rapid transaction alert triggered: ${transactions.length} transactions`);
  }

  async handleSyncError(error) {
    const alert = {
      type: 'sync_error',
      severity: 'high',
      title: 'Square Sync Failed',
      description: error.message,
      data: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      },
      timestamp: new Date()
    };
    
    await this.storeAlert(alert);
    logger.error('🚨 Sync error alert triggered');
  }

  // Database helper methods
  async getTransactionCount() {
    const client = await this.dbConnections.timescalePool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM transactions');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async getRecentTransactions(limit = 10) {
    const client = await this.dbConnections.timescalePool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM transactions 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async storeAlert(alert) {
    // Store in MongoDB for real-time access
    if (this.dbConnections.mongoConnection) {
      const Alert = this.dbConnections.mongoConnection.model('Alert', {
        type: String,
        severity: String,
        title: String,
        description: String,
        data: Object,
        timestamp: Date,
        acknowledged: { type: Boolean, default: false }
      });
      
      await new Alert(alert).save();
    }
  }

  async storeInsights(insights) {
    if (this.dbConnections.mongoConnection) {
      const Insight = this.dbConnections.mongoConnection.model('Insight', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new Insight(insights).save();
    }
  }

  async storeAnalytics(analytics) {
    if (this.dbConnections.mongoConnection) {
      const Analytics = this.dbConnections.mongoConnection.model('Analytics', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new Analytics(analytics).save();
    }
  }

  async storePredictions(predictions) {
    if (this.dbConnections.mongoConnection) {
      const Prediction = this.dbConnections.mongoConnection.model('Prediction', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new Prediction(predictions).save();
    }
  }

  async storeRecommendations(recommendations) {
    if (this.dbConnections.mongoConnection) {
      const Recommendation = this.dbConnections.mongoConnection.model('Recommendation', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new Recommendation(recommendations).save();
    }
  }

  async storeProductInsights(insights) {
    if (this.dbConnections.mongoConnection) {
      const ProductInsight = this.dbConnections.mongoConnection.model('ProductInsight', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new ProductInsight(insights).save();
    }
  }

  async storeTimeInsights(insights) {
    if (this.dbConnections.mongoConnection) {
      const TimeInsight = this.dbConnections.mongoConnection.model('TimeInsight', {
        type: String,
        data: Object,
        timestamp: Date
      });
      
      await new TimeInsight(insights).save();
    }
  }

  // Analysis helper methods
  async analyzeProductCombinations(transactions) {
    const combinations = {};
    
    for (const transaction of transactions) {
      const items = transaction.items || [];
      const productNames = items.map(item => item.product_name).sort();
      const combination = productNames.join(' + ');
      
      if (combination) {
        combinations[combination] = (combinations[combination] || 0) + 1;
      }
    }
    
    return Object.entries(combinations)
      .map(([combination, count]) => ({ combination, count }))
      .sort((a, b) => b.count - a.count);
  }

  async analyzeTimePatterns(transactions) {
    const hourlyDistribution = {};
    
    for (const transaction of transactions) {
      const hour = new Date(transaction.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    }
    
    return {
      hourlyDistribution,
      peakHour: Object.entries(hourlyDistribution)
        .sort((a, b) => b[1] - a[1])[0]
    };
  }
}

// Export for use in Azure Functions
module.exports = { AISyncAgent };

// If running directly, start the agent
if (require.main === module) {
  const agent = new AISyncAgent();
  
  agent.initialize()
    .then(success => {
      if (success) {
        return agent.start();
      }
    })
    .catch(error => {
      logger.error('Failed to start AI Agent:', error);
      process.exit(1);
    });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down AI Agent...');
    await agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down AI Agent...');
    await agent.stop();
    process.exit(0);
  });
}
