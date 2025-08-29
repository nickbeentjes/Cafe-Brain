# Quick Azure Deployment for Cafe Brain
# Uses existing databases and Bledisloe resource group

param(
    [string]$SubscriptionId = "37df3adf-b3c9-4bfc-b0e5-9ddf581af7b2",
    [string]$ResourceGroupName = "bledisloe",
    [string]$Location = "East US",
    [string]$AppServiceName = "cafe-brain-app",
    [string]$FunctionAppName = "cafe-brain-sync"
)

Write-Host "🚀 Deploying Cafe Brain to Azure..." -ForegroundColor Green

# Set subscription
Write-Host "Setting subscription to Bledisloe..." -ForegroundColor Yellow
az account set --subscription $SubscriptionId

# Check if resource group exists
Write-Host "Checking resource group: $ResourceGroupName" -ForegroundColor Yellow
$rg = az group show --name $ResourceGroupName --query "name" -o tsv 2>$null
if (-not $rg) {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
}

# Create App Service Plan
Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name "plan-cafe-brain" `
    --resource-group $ResourceGroupName `
    --sku B1 `
    --is-linux

# Create App Service
Write-Host "Creating App Service: $AppServiceName" -ForegroundColor Yellow
az webapp create `
    --name $AppServiceName `
    --resource-group $ResourceGroupName `
    --plan "plan-cafe-brain" `
    --runtime "NODE|18-lts"

# Configure App Service settings
Write-Host "Configuring App Service settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $AppServiceName `
    --resource-group $ResourceGroupName `
    --settings `
        SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv" `
        SQUARE_LOCATION_ID="L5D18K5RBWQJH" `
        SQUARE_ENV="production" `
        SQUARE_VERSION="2025-07-16" `
        NODE_ENV="production" `
        SQ_ORDERS_BACKFILL_DAYS="30" `
        TIMESCALE_HOST="4.198.153.55" `
        TIMESCALE_PORT="5432" `
        TIMESCALE_DB="cafe" `
        TIMESCALE_USER="postgres" `
        TIMESCALE_PASSWORD="bzchzz" `
        MONGODB_URI="mongodb://cafeuser:Lynx%245124@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"

# Create Storage Account for Function App
Write-Host "Creating Storage Account..." -ForegroundColor Yellow
$storageAccount = "cafebrain" + (Get-Random -Maximum 9999)
az storage account create `
    --name $storageAccount `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku Standard_LRS

# Create Function App
Write-Host "Creating Function App: $FunctionAppName" -ForegroundColor Yellow
az functionapp create `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --storage-account $storageAccount `
    --consumption-plan-location $Location `
    --runtime node `
    --runtime-version 18 `
    --functions-version 4

# Configure Function App settings
Write-Host "Configuring Function App settings..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroupName `
    --settings `
        SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv" `
        SQUARE_LOCATION_ID="L5D18K5RBWQJH" `
        SQUARE_ENV="production" `
        SQUARE_VERSION="2025-07-16" `
        NODE_ENV="production" `
        SQ_ORDERS_BACKFILL_DAYS="30" `
        TIMESCALE_HOST="4.198.153.55" `
        TIMESCALE_PORT="5432" `
        TIMESCALE_DB="cafe" `
        TIMESCALE_USER="postgres" `
        TIMESCALE_PASSWORD="bzchzz" `
        MONGODB_URI="mongodb://cafeuser:Lynx%245124@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"

Write-Host "✅ Azure resources created successfully!" -ForegroundColor Green
Write-Host "App Service URL: https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Function App: $FunctionAppName" -ForegroundColor Cyan

Write-Host "📦 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy web app code: az webapp deployment source config-zip --src cafe-brain-web.zip" -ForegroundColor White
Write-Host "2. Deploy function code: func azure functionapp publish" $FunctionAppName -ForegroundColor White
