# Set Environment Variables for Cafe Brain Azure Resources (Fixed)
# Run this script after the resources are deployed

param(
    [string]$FunctionAppName = "cafe-brain-sync",
    [string]$WebAppName = "cafe-brain-app",
    [string]$ResourceGroupName = "Bledisloe"
)

Write-Host "🔧 Setting environment variables for Cafe Brain Azure Resources" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Set Function App Environment Variables
Write-Host ""
Write-Host "🔧 Setting Function App environment variables..." -ForegroundColor Cyan

# Square API Configuration
Write-Host "Setting Square API variables..." -ForegroundColor Yellow
az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings SQUARE_LOCATION_ID="L5D18K5RBWQJH"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings SQUARE_ENV="production"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings SQUARE_VERSION="2025-07-16"

# Database Configuration
Write-Host "Setting database variables..." -ForegroundColor Yellow
az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings TIMESCALE_HOST="4.198.153.55"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings TIMESCALE_PORT="5432"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings TIMESCALE_DB="cafe"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings TIMESCALE_USER="postgres"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings TIMESCALE_PASSWORD="bzchzz"

# MongoDB URI with proper escaping
$mongoUri = "mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"
az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings MONGODB_URI="$mongoUri"

# Application Configuration
Write-Host "Setting application variables..." -ForegroundColor Yellow
az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings NODE_ENV="production"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings SQ_ORDERS_BACKFILL_DAYS="30"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings WEBSITE_NODE_DEFAULT_VERSION="~20"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings PORT="8080"

az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroupName --settings LOG_LEVEL="info"

Write-Host "✅ Function App environment variables set successfully!" -ForegroundColor Green

# Set Web App Environment Variables
Write-Host ""
Write-Host "🌐 Setting Web App environment variables..." -ForegroundColor Cyan

# Square API Configuration
Write-Host "Setting Square API variables..." -ForegroundColor Yellow
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings SQUARE_LOCATION_ID="L5D18K5RBWQJH"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings SQUARE_ENV="production"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings SQUARE_VERSION="2025-07-16"

# Database Configuration
Write-Host "Setting database variables..." -ForegroundColor Yellow
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings TIMESCALE_HOST="4.198.153.55"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings TIMESCALE_PORT="5432"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings TIMESCALE_DB="cafe"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings TIMESCALE_USER="postgres"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings TIMESCALE_PASSWORD="bzchzz"

# MongoDB URI with proper escaping
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings MONGODB_URI="$mongoUri"

# Application Configuration
Write-Host "Setting application variables..." -ForegroundColor Yellow
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings NODE_ENV="production"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings SQ_ORDERS_BACKFILL_DAYS="30"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings WEBSITE_NODE_DEFAULT_VERSION="~20"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings PORT="8080"

az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroupName --settings LOG_LEVEL="info"

Write-Host "✅ Web App environment variables set successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Environment Variables Summary:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "📡 Square API:" -ForegroundColor Cyan
Write-Host "   SQUARE_ACCESS_TOKEN: EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv" -ForegroundColor White
Write-Host "   SQUARE_LOCATION_ID: L5D18K5RBWQJH" -ForegroundColor White
Write-Host "   SQUARE_ENV: production" -ForegroundColor White
Write-Host "   SQUARE_VERSION: 2025-07-16" -ForegroundColor White

Write-Host ""
Write-Host "🗄️ Database:" -ForegroundColor Cyan
Write-Host "   TIMESCALE_HOST: 4.198.153.55" -ForegroundColor White
Write-Host "   TIMESCALE_PORT: 5432" -ForegroundColor White
Write-Host "   TIMESCALE_DB: cafe" -ForegroundColor White
Write-Host "   TIMESCALE_USER: postgres" -ForegroundColor White
Write-Host "   TIMESCALE_PASSWORD: ***" -ForegroundColor White
Write-Host "   MONGODB_URI: ***" -ForegroundColor White

Write-Host ""
Write-Host "⚙️ Application:" -ForegroundColor Cyan
Write-Host "   NODE_ENV: production" -ForegroundColor White
Write-Host "   SQ_ORDERS_BACKFILL_DAYS: 30" -ForegroundColor White
Write-Host "   WEBSITE_NODE_DEFAULT_VERSION: ~20" -ForegroundColor White
Write-Host "   PORT: 8080" -ForegroundColor White
Write-Host "   LOG_LEVEL: info" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Resource URLs:" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "Web App: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Function App: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Environment variables configuration completed!" -ForegroundColor Green
Write-Host "🚀 Your Cafe Brain application should now be ready to run!" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. Test the environment variables: .\azure-deployment\test-env-vars-simple.ps1" -ForegroundColor White
Write-Host "2. Test the applications by visiting the URLs above" -ForegroundColor White
Write-Host "3. Check application logs if there are issues" -ForegroundColor White
