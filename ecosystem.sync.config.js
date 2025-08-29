module.exports = {
  apps: [
    // Enhanced Square data sync with analytics
    { 
      name: "enhanced-orders-sync", 
      script: "workers/enhanced-orders-sync.js", 
      env: { 
        NODE_ENV: "production",
        SQ_ORDERS_BACKFILL_DAYS: "1825"
      }, 
      cron_restart: "*/5 * * * *",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    },
    
    // Original sync workers (keeping for compatibility)
    { 
      name: "catalog-sync", 
      script: "workers/catalog-sync.js", 
      env: { NODE_ENV: "production" }, 
      cron_restart: "*/10 * * * *",
      instances: 1,
      autorestart: true,
      watch: false
    },
    
    { 
      name: "customers-sync", 
      script: "workers/customers-sync.js", 
      env: { NODE_ENV: "production" }, 
      cron_restart: "*/10 * * * *",
      instances: 1,
      autorestart: true,
      watch: false
    },
    
    { 
      name: "orders-sync", 
      script: "workers/orders-sync.js", 
      env: { 
        NODE_ENV: "production", 
        SQ_ORDERS_BACKFILL_DAYS: "1825" 
      }, 
      cron_restart: "*/5 * * * *",
      instances: 1,
      autorestart: true,
      watch: false
    },
    
    // Analytics processing service
    {
      name: "analytics-processor",
      script: "services/analytics-processor.js",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M"
    },
    
    // AI Insights service
    {
      name: "ai-insights",
      script: "services/ai-insights-service.js",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M"
    }
  ]
};
