# Set Environment Variables for Cafe Brain Azure Resources
# Run this script after the resources are deployed

param(
    [string]$FunctionAppName = "cafe-brain-sync",
    [string]$WebAppName = "cafe-brain-app",
    [string]$ResourceGroupName = "Bledisloe"
)

Write-Host "🔧 Setting environment variables for Cafe Brain Azure Resources" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Square API Configuration
Write-Host "`n📡 Setting Square API variables..." -ForegroundColor Yellow
$squareSettings = @{
    "SQUARE_ACCESS_TOKEN" = "EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv"
    "SQUARE_LOCATION_ID" = "L5D18K5RBWQJH"
    "SQUARE_ENV" = "production"
    "SQUARE_VERSION" = "2025-07-16"
}

# Database Configuration
Write-Host "🗄️ Setting database variables..." -ForegroundColor Yellow
$dbSettings = @{
    "TIMESCALE_HOST" = "4.198.153.55"
    "TIMESCALE_PORT" = "5432"
    "TIMESCALE_DB" = "cafe"
    "TIMESCALE_USER" = "postgres"
    "TIMESCALE_PASSWORD" = "bzchzz"
    "MONGODB_URI" = "mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256`&authSource=cafe"
}

# Application Configuration
Write-Host "⚙️ Setting application variables..." -ForegroundColor Yellow
$appSettings = @{
    "NODE_ENV" = "production"
    "SQ_ORDERS_BACKFILL_DAYS" = "30"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "PORT" = "8080"
    "LOG_LEVEL" = "info"
}

# Combine all settings
$allSettings = $squareSettings + $dbSettings + $appSettings

# Set Function App Environment Variables
Write-Host "`n🔧 Setting Function App environment variables..." -ForegroundColor Cyan
try {
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --settings $allSettings
    
    Write-Host "✅ Function App environment variables set successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Function App environment variables: $($_.Exception.Message)" -ForegroundColor Red
}

# Set Web App Environment Variables
Write-Host "`n🌐 Setting Web App environment variables..." -ForegroundColor Cyan
try {
    az webapp config appsettings set `
        --name $WebAppName `
        --resource-group $ResourceGroupName `
        --settings $allSettings
    
    Write-Host "✅ Web App environment variables set successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Web App environment variables: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Environment Variables Summary:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Write-Host "`n📡 Square API:" -ForegroundColor Cyan
$squareSettings.GetEnumerator() | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor White
}

Write-Host "`n🗄️ Database:" -ForegroundColor Cyan
$dbSettings.GetEnumerator() | ForEach-Object {
    if ($_.Key -eq "TIMESCALE_PASSWORD" -or $_.Key -eq "MONGODB_URI") {
        Write-Host "   $($_.Key): ***" -ForegroundColor White
    } else {
        Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor White
    }
}

Write-Host "`n⚙️ Application:" -ForegroundColor Cyan
$appSettings.GetEnumerator() | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor White
}

Write-Host "`n🔗 Resource URLs:" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "Web App: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Function App: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan

Write-Host "`n✅ Environment variables configuration completed!" -ForegroundColor Green
Write-Host "🚀 Your Cafe Brain application should now be ready to run!" -ForegroundColor Green

# Optional: List current settings to verify
Write-Host "`n📋 Verifying Function App settings..." -ForegroundColor Yellow
try {
    az functionapp config appsettings list `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --output table
} catch {
    Write-Host "⚠️ Could not verify Function App settings" -ForegroundColor Yellow
}

Write-Host "`n📋 Verifying Web App settings..." -ForegroundColor Yellow
try { 
    az webapp config appsettings list `
        --name $WebAppName `
        --resource-group $ResourceGroupName `
        --output table
} catch {
    Write-Host "⚠️ Could not verify Web App settings" -ForegroundColor Yellow
}
