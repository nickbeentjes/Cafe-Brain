# Set Environment Variables Directly - No Complex Strings
Write-Host "Setting environment variables for Cafe Brain API..." -ForegroundColor Green

# Function App Environment Variables
Write-Host "Setting Function App variables..." -ForegroundColor Yellow

az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings SQUARE_LOCATION_ID="L5D18K5RBWQJH"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings SQUARE_ENV="production"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings SQUARE_VERSION="2025-07-16"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings TIMESCALE_HOST="4.198.153.55"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings TIMESCALE_PORT="5432"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings TIMESCALE_DB="cafe"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings TIMESCALE_USER="postgres"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings TIMESCALE_PASSWORD="bzchzz"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings MONGODB_URI="mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings NODE_ENV="production"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings SQ_ORDERS_BACKFILL_DAYS="30"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings WEBSITE_NODE_DEFAULT_VERSION="~20"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings PORT="8080"
az functionapp config appsettings set --name "cafe-brain-api" --resource-group "Bledisloe" --settings LOG_LEVEL="info"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "API URL: https://cafe-brain-api.azurewebsites.net" -ForegroundColor Cyan
