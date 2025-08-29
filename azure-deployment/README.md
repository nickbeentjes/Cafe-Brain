# Azure Deployment Guide for Cafe Brain

This guide will help you deploy Cafe Brain to Azure using a hybrid approach with App Service and Azure Functions.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Service   │    │ Azure Functions │    │   Azure Logic   │
│   (Web App)     │    │   (Sync Jobs)   │    │     Apps        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Azure Data    │
                    │   Services      │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ PostgreSQL  │ │
                    │ │(TimescaleDB)│ │
                    │ └─────────────┘ │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │  Cosmos DB  │ │
                    │ │ (MongoDB)   │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI** installed and logged in
2. **PowerShell** (for deployment script)
3. **Azure Functions Core Tools** (for local testing)
4. **Git** for code deployment

### Step 1: Deploy Azure Infrastructure

```powershell
# Run the deployment script
.\azure-deploy.ps1 `
  -ResourceGroupName "cafe-brain-rg" `
  -Location "East US" `
  -AppServiceName "cafe-brain-app" `
  -FunctionAppName "cafe-brain-sync" `
  -PostgreSQLServerName "cafe-brain-postgres" `
  -CosmosDBAccountName "cafe-brain-cosmos" `
  -PostgreSQLAdminUsername "postgres" `
  -PostgreSQLAdminPassword "YourSecurePassword123!"
```

### Step 2: Configure Environment Variables

After deployment, set these additional environment variables in Azure Portal:

**App Service Settings:**
```
SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv
SQUARE_LOCATION_ID=L5D18K5RBWQJH
SQUARE_ENV=production
SQUARE_VERSION=2025-07-16
```

**Function App Settings:**
```
SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv
SQUARE_LOCATION_ID=L5D18K5RBWQJH
SQUARE_ENV=production
SQUARE_VERSION=2025-07-16
SQ_ORDERS_BACKFILL_DAYS=1
```

### Step 3: Deploy Application Code

#### Deploy App Service (Web App)

```bash
# From your project root
az webapp deployment source config-local-git --name cafe-brain-app --resource-group cafe-brain-rg

# Get the deployment URL
az webapp deployment list-publishing-credentials --name cafe-brain-app --resource-group cafe-brain-rg

# Deploy via Git
git remote add azure <deployment-url>
git push azure main
```

#### Deploy Azure Functions

```bash
# Navigate to functions directory
cd azure-deployment/azure-functions-sync

# Deploy to Azure
func azure functionapp publish cafe-brain-sync
```

## 🔧 Manual Deployment Steps

If you prefer to create resources manually:

### 1. Create Resource Group
```bash
az group create --name cafe-brain-rg --location "East US"
```

### 2. Create PostgreSQL Database
```bash
# Create server
az postgres server create \
  --resource-group cafe-brain-rg \
  --name cafe-brain-postgres \
  --location "East US" \
  --admin-user postgres \
  --admin-password "YourSecurePassword123!" \
  --sku-name GP_Gen5_2

# Create database
az postgres db create \
  --resource-group cafe-brain-rg \
  --server-name cafe-brain-postgres \
  --name cafe

# Enable TimescaleDB extension
az postgres flexible-server parameter set \
  --resource-group cafe-brain-rg \
  --server-name cafe-brain-postgres \
  --name shared_preload_libraries \
  --value timescaledb
```

### 3. Create Cosmos DB
```bash
az cosmosdb create \
  --resource-group cafe-brain-rg \
  --name cafe-brain-cosmos \
  --kind MongoDB \
  --locations regionName="East US" failoverPriority=0 isZoneRedundant=false

# Create database and collection
az cosmosdb mongodb database create \
  --resource-group cafe-brain-rg \
  --account-name cafe-brain-cosmos \
  --name cafe

az cosmosdb mongodb collection create \
  --resource-group cafe-brain-rg \
  --account-name cafe-brain-cosmos \
  --database-name cafe \
  --name analytics
```

### 4. Create App Service
```bash
# Create App Service Plan
az appservice plan create \
  --resource-group cafe-brain-rg \
  --name cafe-brain-plan \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group cafe-brain-rg \
  --plan cafe-brain-plan \
  --name cafe-brain-app \
  --runtime "NODE|18-lts"
```

### 5. Create Function App
```bash
# Create storage account
az storage account create \
  --resource-group cafe-brain-rg \
  --name cafe-brain-storage \
  --location "East US" \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group cafe-brain-rg \
  --consumption-plan-location "East US" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name cafe-brain-sync \
  --storage-account cafe-brain-storage
```

## 📊 Monitoring and Logs

### App Service Logs
```bash
# Stream logs
az webapp log tail --name cafe-brain-app --resource-group cafe-brain-rg

# Download logs
az webapp log download --name cafe-brain-app --resource-group cafe-brain-rg
```

### Function App Logs
```bash
# Stream logs
az functionapp logs tail --name cafe-brain-sync --resource-group cafe-brain-rg

# View in Azure Portal
# Go to Function App > Functions > SquareSyncFunction > Monitor
```

## 🔄 Sync Scheduling

The Azure Function runs every 5 minutes using a timer trigger. You can modify the schedule in `function.json`:

```json
{
  "schedule": "0 */5 * * * *"  // Every 5 minutes
}
```

Common schedules:
- `"0 */5 * * * *"` - Every 5 minutes
- `"0 */15 * * * *"` - Every 15 minutes
- `"0 0 */1 * * *"` - Every hour
- `"0 0 6 * * *"` - Daily at 6 AM

## 💰 Cost Optimization

### Development/Testing
- **App Service**: B1 (Basic) - ~$13/month
- **Function App**: Consumption Plan - Pay per execution
- **PostgreSQL**: Basic tier - ~$25/month
- **Cosmos DB**: Serverless - Pay per request

### Production
- **App Service**: S1 (Standard) - ~$73/month
- **Function App**: Premium Plan - ~$20/month
- **PostgreSQL**: General Purpose - ~$100/month
- **Cosmos DB**: Provisioned throughput - ~$50/month

**Total**: ~$243/month for production setup

## 🔒 Security Best Practices

1. **Use Azure Key Vault** for sensitive configuration
2. **Enable SSL/TLS** for all connections
3. **Use Managed Identity** for database connections
4. **Configure Network Security Groups** to restrict access
5. **Enable Azure Security Center** monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check firewall rules
   - Verify connection strings
   - Ensure SSL is enabled

2. **Function Not Triggering**
   - Check timer schedule syntax
   - Verify Function App is running
   - Check application settings

3. **Square API Errors**
   - Verify access token is valid
   - Check location ID
   - Ensure API permissions

### Debug Commands

```bash
# Test database connection
az postgres flexible-server execute \
  --resource-group cafe-brain-rg \
  --name cafe-brain-postgres \
  --database cafe \
  --querytext "SELECT version();"

# Check Function App status
az functionapp show --name cafe-brain-sync --resource-group cafe-brain-rg

# View recent executions
az functionapp logs tail --name cafe-brain-sync --resource-group cafe-brain-rg
```

## 📈 Scaling

### Auto-scaling
- **App Service**: Configure auto-scale rules based on CPU/memory
- **Function App**: Automatically scales based on load
- **PostgreSQL**: Scale up/down as needed
- **Cosmos DB**: Auto-scale throughput

### Manual Scaling
```bash
# Scale App Service Plan
az appservice plan update \
  --resource-group cafe-brain-rg \
  --name cafe-brain-plan \
  --sku S2

# Scale PostgreSQL
az postgres flexible-server update \
  --resource-group cafe-brain-rg \
  --name cafe-brain-postgres \
  --sku-name GP_Gen5_4
```

## 🎯 Next Steps

1. **Set up monitoring** with Application Insights
2. **Configure alerts** for sync failures
3. **Set up CI/CD** pipeline for automated deployments
4. **Implement backup** strategies for databases
5. **Add custom domains** and SSL certificates
