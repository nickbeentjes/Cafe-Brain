# Test Environment Variables for Cafe Brain Azure Resources
# This script verifies that all environment variables are properly set

param(
    [string]$FunctionAppName = "cafe-brain-sync",
    [string]$WebAppName = "cafe-brain-app",
    [string]$ResourceGroupName = "Bledisloe"
)

Write-Host "🧪 Testing Environment Variables for Cafe Brain" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Expected environment variables
$expectedVars = @(
    "SQUARE_ACCESS_TOKEN",
    "SQUARE_LOCATION_ID", 
    "SQUARE_ENV",
    "SQUARE_VERSION",
    "TIMESCALE_HOST",
    "TIMESCALE_PORT",
    "TIMESCALE_DB",
    "TIMESCALE_USER",
    "TIMESCALE_PASSWORD",
    "MONGODB_URI",
    "NODE_ENV",
    "SQ_ORDERS_BACKFILL_DAYS",
    "WEBSITE_NODE_DEFAULT_VERSION",
    "PORT",
    "LOG_LEVEL"
)

# Test Function App Environment Variables
Write-Host "`n🔧 Testing Function App Environment Variables..." -ForegroundColor Cyan
try {
    $functionSettings = az functionapp config appsettings list `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --output json | ConvertFrom-Json

    $functionVars = $functionSettings | Where-Object { $expectedVars -contains $_.name }
    
    Write-Host "Found $($functionVars.Count) environment variables in Function App" -ForegroundColor Yellow
    
    $missingVars = @()
    foreach ($var in $expectedVars) {
        $found = $functionVars | Where-Object { $_.name -eq $var }
        if ($found) {
            Write-Host "✅ $var" -ForegroundColor Green
        } else {
            Write-Host "❌ $var (missing)" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`n⚠️ Missing variables in Function App: $($missingVars -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ All environment variables found in Function App!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to test Function App environment variables: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Web App Environment Variables
Write-Host "`n🌐 Testing Web App Environment Variables..." -ForegroundColor Cyan
try {
    $webSettings = az webapp config appsettings list `
        --name $WebAppName `
        --resource-group $ResourceGroupName `
        --output json | ConvertFrom-Json

    $webVars = $webSettings | Where-Object { $expectedVars -contains $_.name }
    
    Write-Host "Found $($webVars.Count) environment variables in Web App" -ForegroundColor Yellow
    
    $missingVars = @()
    foreach ($var in $expectedVars) {
        $found = $webVars | Where-Object { $_.name -eq $var }
        if ($found) {
            Write-Host "✅ $var" -ForegroundColor Green
        } else {
            Write-Host "❌ $var (missing)" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`n⚠️ Missing variables in Web App: $($missingVars -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ All environment variables found in Web App!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to test Web App environment variables: $($_.Exception.Message)" -ForegroundColor Red
}

# Test resource availability
Write-Host "`n🔍 Testing Resource Availability..." -ForegroundColor Cyan

# Test Function App
try {
    $functionStatus = az functionapp show `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --query "state" `
        --output tsv
    
    if ($functionStatus -eq "Running") {
        Write-Host "✅ Function App is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Function App status: $functionStatus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check Function App status" -ForegroundColor Red
}

# Test Web App
try {
    $webStatus = az webapp show `
        --name $WebAppName `
        --resource-group $ResourceGroupName `
        --query "state" `
        --output tsv
    
    if ($webStatus -eq "Running") {
        Write-Host "✅ Web App is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Web App status: $webStatus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check Web App status" -ForegroundColor Red
}

Write-Host "`n🎯 Summary:" -ForegroundColor Yellow
Write-Host "===========" -ForegroundColor Yellow
Write-Host "Function App: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Web App: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. If any variables are missing, run: .\azure-deployment\set-env-vars.ps1" -ForegroundColor White
Write-Host "2. Test the applications by visiting the URLs above" -ForegroundColor White
Write-Host "3. Check application logs if there are issues" -ForegroundColor White
