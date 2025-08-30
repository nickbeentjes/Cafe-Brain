const { initializeDatabases } = require('../config/database');
const { 
  AIInsight, 
  StockRecommendation, 
  ProductionSchedule 
} = require('../models/Analytics');

async function generateAIData() {
  try {
    console.log('🤖 Generating AI Data...');
    
    // Initialize databases
    await initializeDatabases();
    
    // Generate AI Insights
    console.log('📊 Generating AI Insights...');
    const insights = [
      {
        type: 'trend',
        title: 'Coffee Sales Surge',
        description: 'Coffee sales have increased 25% this week compared to last week. Consider increasing production of coffee-related items.',
        severity: 'medium',
        category: 'sales_trend',
        actionable: true,
        data: { increase: 25, product: 'Coffee' }
      },
      {
        type: 'opportunity',
        title: 'Weather-Driven Opportunity',
        description: 'Cooler weather expected tomorrow. Hot beverages and warm food items likely to see increased demand.',
        severity: 'low',
        category: 'weather_impact',
        actionable: true,
        data: { weather: 'cool', impact: 'positive' }
      },
      {
        type: 'recommendation',
        title: 'Stock Optimization',
        description: 'Based on current sales patterns, consider reducing stock of slow-moving items and increasing fast-moving products.',
        severity: 'medium',
        category: 'inventory',
        actionable: true,
        data: { action: 'optimize_stock' }
      },
      {
        type: 'warning',
        title: 'Peak Hour Alert',
        description: 'Tomorrow\'s peak hours (8-10 AM) are expected to be 40% busier than usual. Prepare additional staff.',
        severity: 'high',
        category: 'operational',
        actionable: true,
        data: { peak_hours: '8-10 AM', increase: 40 }
      },
      {
        type: 'anomaly',
        title: 'Unusual Sales Pattern',
        description: 'SD Coffee sales dropped 30% today compared to the weekly average. Investigate potential issues.',
        severity: 'medium',
        category: 'sales_anomaly',
        actionable: true,
        data: { product: 'SD Coffee', drop: 30 }
      }
    ];
    
    for (const insight of insights) {
      await AIInsight.findOneAndUpdate(
        { title: insight.title },
        insight,
        { upsert: true, new: true }
      );
    }
    
    // Generate Stock Recommendations
    console.log('📦 Generating Stock Recommendations...');
    const stockRecommendations = [
      {
        productId: 'coffee-001',
        productName: 'Coffee Beans',
        category: 'Beverages',
        currentStock: 15,
        recommendedStock: 25,
        confidence: 0.85,
        reasoning: 'High demand expected due to weather forecast and current sales trends',
        factors: [
          { name: 'Weather', impact: 0.3, description: 'Cooler weather increases hot beverage demand' },
          { name: 'Sales Trend', impact: 0.4, description: '25% increase in coffee sales this week' },
          { name: 'Historical Data', impact: 0.15, description: 'Consistent demand pattern' }
        ],
        urgency: 'high',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      {
        productId: 'milk-001',
        productName: 'Fresh Milk',
        category: 'Dairy',
        currentStock: 8,
        recommendedStock: 12,
        confidence: 0.75,
        reasoning: 'Essential ingredient for coffee and other beverages',
        factors: [
          { name: 'Coffee Demand', impact: 0.5, description: 'Milk is used in 60% of coffee orders' },
          { name: 'Shelf Life', impact: 0.25, description: 'Fresh milk has limited shelf life' }
        ],
        urgency: 'medium',
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
      },
      {
        productId: 'bread-001',
        productName: 'Sourdough Bread',
        category: 'Bakery',
        currentStock: 5,
        recommendedStock: 8,
        confidence: 0.70,
        reasoning: 'Popular item for sandwiches and toast',
        factors: [
          { name: 'Sandwich Sales', impact: 0.4, description: 'Used in croque monsieur and other sandwiches' },
          { name: 'Customer Preference', impact: 0.3, description: 'High customer satisfaction ratings' }
        ],
        urgency: 'medium',
        validUntil: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18 hours
      }
    ];
    
    for (const rec of stockRecommendations) {
      await StockRecommendation.findOneAndUpdate(
        { productId: rec.productId },
        rec,
        { upsert: true, new: true }
      );
    }
    
    // Generate Production Schedule
    console.log('🏭 Generating Production Schedule...');
    const productionSchedules = [
      {
        productName: 'Sourdough Bread',
        category: 'Bakery',
        recommendedStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedDemand: 12,
        confidence: 0.80,
        factors: [
          { name: 'Current Stock', value: 5, impact: 'Low stock requires immediate production' },
          { name: 'Expected Demand', value: 8, impact: 'Based on historical sales data' },
          { name: 'Weather Impact', value: 'Cool', impact: 'Cooler weather increases bread demand' }
        ],
        status: 'pending'
      },
      {
        productName: 'Banana Bread',
        category: 'Bakery',
        recommendedStartTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        estimatedDemand: 8,
        confidence: 0.70,
        factors: [
          { name: 'Current Stock', value: 3, impact: 'Moderate stock level' },
          { name: 'Customer Preference', value: 'High', impact: 'Popular item with good reviews' }
        ],
        status: 'pending'
      },
      {
        productName: 'Croque Monsieur',
        category: 'Sandwiches',
        recommendedStartTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        estimatedDemand: 15,
        confidence: 0.85,
        factors: [
          { name: 'Peak Hours', value: '8-10 AM', impact: 'High demand during breakfast rush' },
          { name: 'Weather', value: 'Cool', impact: 'Warm food preferred in cooler weather' }
        ],
        status: 'pending'
      }
    ];
    
    for (const schedule of productionSchedules) {
      await ProductionSchedule.findOneAndUpdate(
        { 
          productName: schedule.productName,
          recommendedStartTime: schedule.recommendedStartTime
        },
        schedule,
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ AI Data generated successfully!');
    console.log(`📊 Created ${insights.length} AI Insights`);
    console.log(`📦 Created ${stockRecommendations.length} Stock Recommendations`);
    console.log(`🏭 Created ${productionSchedules.length} Production Schedules`);
    
  } catch (error) {
    console.error('❌ Error generating AI data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  generateAIData().then(() => {
    console.log('🎉 AI Data generation complete!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 AI Data generation failed:', error);
    process.exit(1);
  });
}

module.exports = { generateAIData };
