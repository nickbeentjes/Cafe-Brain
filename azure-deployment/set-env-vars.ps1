# Set Environment Variables for Cafe Brain Function App
# Run this script after the Function App is deployed

param(
    [string]$FunctionAppName = "cafe-brain-sync",
    [string]$ResourceGroupName = "Bledisloe"
)

Write-Host "🔧 Setting environment variables for Function App: $FunctionAppName" -ForegroundColor Green

# Square API Configuration
Write-Host "Setting Square API variables..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --settings `
        SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv" `
        SQUARE_LOCATION_ID="L5D18K5RBWQJH" `
        SQUARE_ENV="production" `
        SQUARE_VERSION="2025-07-16"

# Database Configuration
Write-Host "Setting database variables..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --settings `
        TIMESCALE_HOST="4.198.153.55" `
        TIMESCALE_PORT="5432" `
        TIMESCALE_DB="cafe" `
        TIMESCALE_USER="postgres" `
        TIMESCALE_PASSWORD="bzchzz" `
        MONGODB_URI="mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"

# Application Configuration
Write-Host "Setting application variables..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --settings `
        NODE_ENV="production" `
        SQ_ORDERS_BACKFILL_DAYS="30" `
        WEBSITE_NODE_DEFAULT_VERSION="~20"

Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host "Function App URL: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan

# Optional: List all settings to verify
Write-Host "`n📋 Current environment variables:" -ForegroundColor Yellow
az functionapp config appsettings list `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB') || contains(name, 'NODE_ENV')]" `
    --output table
