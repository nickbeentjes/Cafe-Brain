const mongoose = require('mongoose');

// Analytics Data Schema
const AnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  type: { type: String, required: true, enum: ['daily', 'hourly', 'weekly', 'monthly'] },
  metrics: {
    totalRevenue: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    averageTransactionValue: { type: Number, default: 0 },
    uniqueCustomers: { type: Number, default: 0 },
    topProducts: [{
      productName: String,
      quantity: Number,
      revenue: Number
    }],
    peakHours: [{
      hour: Number,
      transactionCount: Number,
      revenue: Number
    }]
  },
  weather: {
    temperature: Number,
    conditions: String,
    humidity: Number,
    windSpeed: Number
  },
  events: [{
    name: String,
    type: String,
    impact: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Predictive Models Schema
const PredictiveModelSchema = new mongoose.Schema({
  modelType: { 
    type: String, 
    required: true, 
    enum: ['demand_forecast', 'customer_surge', 'production_timing', 'stock_recommendation'] 
  },
  productCategory: String,
  modelVersion: { type: String, required: true },
  accuracy: { type: Number, default: 0 },
  lastTrained: { type: Date, default: Date.now },
  parameters: mongoose.Schema.Types.Mixed,
  predictions: [{
    date: Date,
    predictedValue: Number,
    confidence: Number,
    actualValue: Number
  }]
});

// AI Insights Schema
const AIInsightSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['trend', 'anomaly', 'opportunity', 'warning', 'recommendation'] 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  category: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  actionable: { type: Boolean, default: true },
  actionTaken: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

// Natural Language Queries Schema
const QueryLogSchema = new mongoose.Schema({
  query: { type: String, required: true },
  intent: { type: String, required: true },
  response: { type: String, required: true },
  confidence: { type: Number, default: 0 },
  userId: String,
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
});

// Dashboard Configuration Schema
const DashboardConfigSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  layout: [{
    widgetId: String,
    widgetType: String,
    position: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    config: mongoose.Schema.Types.Mixed
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Stock Recommendations Schema
const StockRecommendationSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  currentStock: { type: Number, default: 0 },
  recommendedStock: { type: Number, required: true },
  confidence: { type: Number, default: 0 },
  reasoning: { type: String, required: true },
  factors: [{
    name: String,
    impact: Number,
    description: String
  }],
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  validUntil: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Production Schedule Schema
const ProductionScheduleSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  recommendedStartTime: { type: Date, required: true },
  estimatedDemand: { type: Number, required: true },
  confidence: { type: Number, default: 0 },
  factors: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    impact: String
  }],
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Weather Impact Analysis Schema
const WeatherImpactSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  weatherData: {
    temperature: Number,
    conditions: String,
    humidity: Number,
    windSpeed: Number,
    precipitation: Number
  },
  salesImpact: {
    totalRevenue: Number,
    transactionCount: Number,
    averageTransactionValue: Number,
    productCategoryImpacts: [{
      category: String,
      revenueChange: Number,
      transactionChange: Number
    }]
  },
  correlation: {
    temperatureCorrelation: Number,
    precipitationCorrelation: Number,
    conditionsImpact: mongoose.Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Analytics: mongoose.model('Analytics', AnalyticsSchema),
  PredictiveModel: mongoose.model('PredictiveModel', PredictiveModelSchema),
  AIInsight: mongoose.model('AIInsight', AIInsightSchema),
  QueryLog: mongoose.model('QueryLog', QueryLogSchema),
  DashboardConfig: mongoose.model('DashboardConfig', DashboardConfigSchema),
  StockRecommendation: mongoose.model('StockRecommendation', StockRecommendationSchema),
  ProductionSchedule: mongoose.model('ProductionSchedule', ProductionScheduleSchema),
  WeatherImpact: mongoose.model('WeatherImpact', WeatherImpactSchema)
};

