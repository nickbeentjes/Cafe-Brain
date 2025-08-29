const moment = require('moment-timezone');
const axios = require('axios');
const { getTimescalePool } = require('../config/database');
const { 
  Analytics, 
  AIInsight, 
  PredictiveModel, 
  StockRecommendation, 
  ProductionSchedule,
  WeatherImpact,
  QueryLog 
} = require('../models/Analytics');

class AIAnalyticsEngine {
  constructor() {
    this.weatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.location = process.env.CAFE_LOCATION || 'Newcastle,AU';
  }

  // Natural Language Query Processing
  async processQuery(query, userId = 'louise') {
    try {
      // Log the query
      const queryLog = new QueryLog({
        query,
        userId,
        timestamp: new Date()
      });

      // Analyze intent using NLP
      const intent = await this.analyzeIntent(query);
      queryLog.intent = intent.type;

      // Process based on intent
      let response;
      switch (intent.type) {
        case 'sales_query':
          response = await this.handleSalesQuery(query, intent);
          break;
        case 'stock_query':
          response = await this.handleStockQuery(query, intent);
          break;
        case 'production_query':
          response = await this.handleProductionQuery(query, intent);
          break;
        case 'weather_query':
          response = await this.handleWeatherQuery(query, intent);
          break;
        case 'general_insight':
          response = await this.handleGeneralInsight(query, intent);
          break;
        default:
          response = "I'm not sure how to help with that. Try asking about sales, stock levels, production timing, or weather impact.";
      }

      queryLog.response = response;
      queryLog.confidence = intent.confidence;
      queryLog.success = true;
      await queryLog.save();

      return response;

    } catch (error) {
      console.error('Error processing query:', error);
      return "I'm having trouble processing that request right now. Please try again.";
    }
  }

  // Intent analysis using simple NLP
  async analyzeIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Sales-related queries
    if (lowerQuery.includes('sell') || lowerQuery.includes('sold') || 
        lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      return { type: 'sales_query', confidence: 0.9, entities: this.extractEntities(query) };
    }
    
    // Stock-related queries
    if (lowerQuery.includes('stock') || lowerQuery.includes('inventory') || 
        lowerQuery.includes('order') || lowerQuery.includes('milk')) {
      return { type: 'stock_query', confidence: 0.8, entities: this.extractEntities(query) };
    }
    
    // Production-related queries
    if (lowerQuery.includes('focaccia') || lowerQuery.includes('bake') || 
        lowerQuery.includes('cook') || lowerQuery.includes('start')) {
      return { type: 'production_query', confidence: 0.9, entities: this.extractEntities(query) };
    }
    
    // Weather-related queries
    if (lowerQuery.includes('weather') || lowerQuery.includes('rain') || 
        lowerQuery.includes('temperature')) {
      return { type: 'weather_query', confidence: 0.8, entities: this.extractEntities(query) };
    }
    
    return { type: 'general_insight', confidence: 0.5, entities: this.extractEntities(query) };
  }

  // Extract entities from query
  extractEntities(query) {
    const entities = {
      products: [],
      timeframes: [],
      quantities: []
    };

    // Extract product names
    const productKeywords = ['coffee', 'focaccia', 'sandwich', 'croissant', 'milk', 'chicken', 'cheese'];
    productKeywords.forEach(product => {
      if (query.toLowerCase().includes(product)) {
        entities.products.push(product);
      }
    });

    // Extract timeframes
    const timeKeywords = ['today', 'yesterday', 'week', 'month', 'last week', 'this week'];
    timeKeywords.forEach(time => {
      if (query.toLowerCase().includes(time)) {
        entities.timeframes.push(time);
      }
    });

    return entities;
  }

  // Handle sales queries
  async handleSalesQuery(query, intent) {
    const timescalePool = getTimescalePool();
    const client = await timescalePool.connect();
    
    try {
      const entities = intent.entities;
      let timeframe = 'week';
      let products = [];

      // Determine timeframe
      if (entities.timeframes.length > 0) {
        timeframe = entities.timeframes[0];
      }

      // Determine products
      if (entities.products.length > 0) {
        products = entities.products;
      }

      // Build query based on intent
      let sqlQuery = '';
      let params = [];

      if (products.length > 0) {
        // Query specific products
        sqlQuery = `
          SELECT 
            ti.product_name,
            SUM(ti.quantity) as total_quantity,
            SUM(ti.total_price) as total_revenue
          FROM transaction_items ti
          JOIN transactions t ON ti.transaction_id = t.id
          WHERE ti.product_name ILIKE ANY($1)
          AND t.created_at >= $2
          AND t.status = 'COMPLETED'
          GROUP BY ti.product_name
          ORDER BY total_revenue DESC
        `;
        params = [products.map(p => `%${p}%`), this.getTimeframeDate(timeframe)];
      } else {
        // Query overall sales
        sqlQuery = `
          SELECT 
            DATE(t.created_at) as date,
            COUNT(*) as transaction_count,
            SUM(t.total_amount) as total_revenue,
            AVG(t.total_amount) as avg_transaction
          FROM transactions t
          WHERE t.created_at >= $1
          AND t.status = 'COMPLETED'
          GROUP BY DATE(t.created_at)
          ORDER BY date DESC
          LIMIT 7
        `;
        params = [this.getTimeframeDate(timeframe)];
      }

      const result = await client.query(sqlQuery, params);
      
      if (result.rows.length === 0) {
        return `No sales data found for ${timeframe}.`;
      }

      // Format response
      if (products.length > 0) {
        const productData = result.rows;
        let response = `Sales for ${products.join(', ')} in the last ${timeframe}:\n`;
        productData.forEach(row => {
          response += `• ${row.product_name}: ${row.total_quantity} sold, $${row.total_revenue.toFixed(2)} revenue\n`;
        });
        return response;
      } else {
        const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0);
        const avgTransaction = result.rows.reduce((sum, row) => sum + parseFloat(row.avg_transaction), 0) / result.rows.length;
        return `Sales summary for the last ${timeframe}:\n• Total revenue: $${totalRevenue.toFixed(2)}\n• Average transaction: $${avgTransaction.toFixed(2)}\n• Days with data: ${result.rows.length}`;
      }

    } catch (error) {
      console.error('Error handling sales query:', error);
      return "I'm having trouble accessing sales data right now.";
    } finally {
      client.release();
    }
  }

  // Handle stock queries
  async handleStockQuery(query, intent) {
    try {
      const entities = intent.entities;
      
      if (entities.products.includes('milk')) {
        // Generate milk order recommendation
        const recommendation = await this.generateStockRecommendation('milk');
        return `Milk order recommendation:\n${recommendation.reasoning}\n\nRecommended stock: ${recommendation.recommendedStock} units`;
      }

      // General stock insights
      const stockInsights = await StockRecommendation.find({
        urgency: { $in: ['high', 'medium'] }
      }).sort({ createdAt: -1 }).limit(5);

      if (stockInsights.length === 0) {
        return "All stock levels look good at the moment!";
      }

      let response = "Stock recommendations:\n";
      stockInsights.forEach(insight => {
        response += `• ${insight.productName}: ${insight.reasoning}\n`;
      });

      return response;

    } catch (error) {
      console.error('Error handling stock query:', error);
      return "I'm having trouble accessing stock data right now.";
    }
  }

  // Handle production queries
  async handleProductionQuery(query, intent) {
    try {
      const entities = intent.entities;
      
      if (entities.products.includes('focaccia')) {
        const schedule = await this.generateProductionSchedule('focaccia');
        return `Focaccia production schedule:\n• Recommended start time: ${moment(schedule.recommendedStartTime).format('HH:mm')}\n• Estimated demand: ${schedule.estimatedDemand} units\n• Confidence: ${(schedule.confidence * 100).toFixed(1)}%`;
      }

      // General production insights
      const productionSchedules = await ProductionSchedule.find({
        status: 'pending'
      }).sort({ recommendedStartTime: 1 });

      if (productionSchedules.length === 0) {
        return "No production tasks scheduled at the moment.";
      }

      let response = "Production schedule:\n";
      productionSchedules.forEach(schedule => {
        response += `• ${schedule.productName}: Start at ${moment(schedule.recommendedStartTime).format('HH:mm')}\n`;
      });

      return response;

    } catch (error) {
      console.error('Error handling production query:', error);
      return "I'm having trouble accessing production data right now.";
    }
  }

  // Handle weather queries
  async handleWeatherQuery(query, intent) {
    try {
      const weatherData = await this.getWeatherData();
      const weatherImpact = await this.analyzeWeatherImpact();
      
      let response = `Current weather: ${weatherData.conditions}, ${weatherData.temperature}°C\n\n`;
      
      if (weatherImpact) {
        response += `Weather impact on sales:\n• ${weatherImpact.description}\n`;
      }

      return response;

    } catch (error) {
      console.error('Error handling weather query:', error);
      return "I'm having trouble accessing weather data right now.";
    }
  }

  // Handle general insights
  async handleGeneralInsight(query, intent) {
    try {
      // Get recent insights
      const insights = await AIInsight.find({
        createdAt: { $gte: moment().subtract(7, 'days').toDate() }
      }).sort({ createdAt: -1 }).limit(3);

      if (insights.length === 0) {
        return "No recent insights to share. Business is running smoothly!";
      }

      let response = "Recent insights:\n";
      insights.forEach(insight => {
        response += `• ${insight.title}: ${insight.description}\n`;
      });

      return response;

    } catch (error) {
      console.error('Error handling general insight:', error);
      return "I'm having trouble accessing insights right now.";
    }
  }

  // Generate stock recommendations
  async generateStockRecommendation(productName) {
    try {
      // Get historical demand for the product
      const timescalePool = getTimescalePool();
      const client = await timescalePool.connect();
      
      const result = await client.query(`
        SELECT 
          AVG(ti.quantity) as avg_daily_demand,
          STDDEV(ti.quantity) as demand_variability
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE ti.product_name ILIKE $1
        AND t.created_at >= $2
        AND t.status = 'COMPLETED'
      `, [`%${productName}%`, moment().subtract(30, 'days').toDate()]);

      client.release();

      if (result.rows.length === 0) {
        return {
          productName,
          recommendedStock: 10,
          reasoning: "No historical data available, using default recommendation",
          confidence: 0.3
        };
      }

      const avgDemand = result.rows[0].avg_daily_demand || 5;
      const variability = result.rows[0].demand_variability || 2;
      
      // Calculate recommended stock (3 days worth + safety stock)
      const recommendedStock = Math.ceil(avgDemand * 3 + variability * 2);
      
      const reasoning = `Based on average daily demand of ${avgDemand.toFixed(1)} units over the last 30 days`;

      // Save recommendation
      const recommendation = new StockRecommendation({
        productId: productName,
        productName,
        category: 'food',
        recommendedStock,
        reasoning,
        confidence: 0.7,
        validUntil: moment().add(1, 'day').toDate()
      });
      await recommendation.save();

      return recommendation;

    } catch (error) {
      console.error('Error generating stock recommendation:', error);
      throw error;
    }
  }

  // Generate production schedule
  async generateProductionSchedule(productName) {
    try {
      // Get historical demand patterns
      const timescalePool = getTimescalePool();
      const client = await timescalePool.connect();
      
      const result = await client.query(`
        SELECT 
          EXTRACT(HOUR FROM t.created_at) as hour,
          AVG(ti.quantity) as avg_demand
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE ti.product_name ILIKE $1
        AND t.created_at >= $2
        AND t.status = 'COMPLETED'
        GROUP BY EXTRACT(HOUR FROM t.created_at)
        ORDER BY avg_demand DESC
        LIMIT 3
      `, [`%${productName}%`, moment().subtract(30, 'days').toDate()]);

      client.release();

      if (result.rows.length === 0) {
        return {
          productName,
          recommendedStartTime: moment().add(2, 'hours').toDate(),
          estimatedDemand: 10,
          confidence: 0.3
        };
      }

      // Find peak demand hour
      const peakHour = result.rows[0].hour;
      const estimatedDemand = Math.ceil(result.rows[0].avg_demand * 1.5); // 50% buffer
      
      // Calculate start time (2 hours before peak for baking)
      const tomorrow = moment().add(1, 'day');
      const startTime = tomorrow.hour(peakHour - 2).minute(0).second(0);
      
      const schedule = new ProductionSchedule({
        productName,
        category: 'baked_goods',
        recommendedStartTime: startTime.toDate(),
        estimatedDemand,
        confidence: 0.7,
        factors: [
          { name: 'Peak Hour', value: peakHour, impact: 'High demand period' },
          { name: 'Historical Average', value: result.rows[0].avg_demand, impact: 'Based on 30-day average' }
        ]
      });
      await schedule.save();

      return schedule;

    } catch (error) {
      console.error('Error generating production schedule:', error);
      throw error;
    }
  }

  // Get weather data
  async getWeatherData() {
    if (!this.weatherApiKey) {
      return { temperature: 20, conditions: 'Unknown', humidity: 50 };
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&appid=${this.weatherApiKey}&units=metric`
      );

      return {
        temperature: response.data.main.temp,
        conditions: response.data.weather[0].main,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return { temperature: 20, conditions: 'Unknown', humidity: 50 };
    }
  }

  // Analyze weather impact on sales
  async analyzeWeatherImpact() {
    try {
      const weatherData = await this.getWeatherData();
      
      // Get recent sales data
      const timescalePool = getTimescalePool();
      const client = await timescalePool.connect();
      
      const result = await client.query(`
        SELECT 
          AVG(t.total_amount) as avg_revenue,
          COUNT(*) as transaction_count
        FROM transactions t
        WHERE t.created_at >= $1
        AND t.status = 'COMPLETED'
      `, [moment().subtract(7, 'days').toDate()]);

      client.release();

      if (result.rows.length === 0) {
        return null;
      }

      const avgRevenue = result.rows[0].avg_revenue;
      let impact = '';

      // Simple weather impact analysis
      if (weatherData.conditions.toLowerCase().includes('rain')) {
        impact = 'Rainy weather typically increases coffee sales by 15-20%';
      } else if (weatherData.temperature > 25) {
        impact = 'Hot weather may increase cold drink sales';
      } else if (weatherData.temperature < 10) {
        impact = 'Cold weather typically increases hot drink and food sales';
      } else {
        impact = 'Mild weather conditions - normal sales patterns expected';
      }

      return {
        description: impact,
        weatherData,
        avgRevenue
      };

    } catch (error) {
      console.error('Error analyzing weather impact:', error);
      return null;
    }
  }

  // Generate daily report
  async generateDailyReport() {
    try {
      const timescalePool = getTimescalePool();
      const client = await timescalePool.connect();
      
      // Get yesterday's data
      const yesterday = moment().subtract(1, 'day').startOf('day');
      
      const result = await client.query(`
        SELECT 
          COUNT(*) as transaction_count,
          SUM(t.total_amount) as total_revenue,
          AVG(t.total_amount) as avg_transaction,
          COUNT(DISTINCT t.customer_id) as unique_customers
        FROM transactions t
        WHERE DATE(t.created_at) = $1
        AND t.status = 'COMPLETED'
      `, [yesterday.format('YYYY-MM-DD')]);

      client.release();

      const data = result.rows[0];
      const weatherData = await this.getWeatherData();
      
      // Generate insights
      const insights = [];
      
      if (data.transaction_count > 0) {
        insights.push(`Yesterday's revenue: $${data.total_revenue.toFixed(2)} from ${data.transaction_count} transactions`);
        insights.push(`Average transaction value: $${data.avg_transaction.toFixed(2)}`);
        insights.push(`Unique customers: ${data.unique_customers}`);
      }

      // Weather forecast for today
      insights.push(`Today's weather: ${weatherData.conditions}, ${weatherData.temperature}°C`);

      // Stock recommendations
      const stockRecommendations = await StockRecommendation.find({
        urgency: { $in: ['high', 'medium'] },
        validUntil: { $gte: new Date() }
      }).limit(3);

      if (stockRecommendations.length > 0) {
        insights.push('Stock recommendations:');
        stockRecommendations.forEach(rec => {
          insights.push(`• ${rec.productName}: ${rec.reasoning}`);
        });
      }

      // Production schedule
      const productionSchedules = await ProductionSchedule.find({
        status: 'pending',
        recommendedStartTime: { $gte: new Date() }
      }).sort({ recommendedStartTime: 1 }).limit(3);

      if (productionSchedules.length > 0) {
        insights.push('Production schedule:');
        productionSchedules.forEach(schedule => {
          insights.push(`• ${schedule.productName}: Start at ${moment(schedule.recommendedStartTime).format('HH:mm')}`);
        });
      }

      return insights.join('\n');

    } catch (error) {
      console.error('Error generating daily report:', error);
      return "Unable to generate daily report at this time.";
    }
  }

  // Helper method to get timeframe date
  getTimeframeDate(timeframe) {
    switch (timeframe) {
      case 'today':
        return moment().startOf('day').toDate();
      case 'yesterday':
        return moment().subtract(1, 'day').startOf('day').toDate();
      case 'week':
        return moment().subtract(7, 'days').toDate();
      case 'month':
        return moment().subtract(30, 'days').toDate();
      default:
        return moment().subtract(7, 'days').toDate();
    }
  }
}

module.exports = AIAnalyticsEngine;

