# Test Cafe Brain Function App Deployment
# Run this script to verify everything is working

param(
    [string]$FunctionAppName = "cafe-brain-sync",
    [string]$ResourceGroupName = "Bledisloe"
)

Write-Host "🧪 Testing Cafe Brain Function App: $FunctionAppName" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Test 1: Check Function App Status
Write-Host "`n1️⃣ Checking Function App Status..." -ForegroundColor Yellow
try {
    $appStatus = az functionapp show --name $FunctionAppName --resource-group $ResourceGroupName --query "state" -o tsv
    if ($appStatus -eq "Running") {
        Write-Host "✅ Function App is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Function App status: $appStatus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking Function App status" -ForegroundColor Red
}

# Test 2: Check Environment Variables
Write-Host "`n2️⃣ Checking Environment Variables..." -ForegroundColor Yellow
try {
    $envVars = az functionapp config appsettings list --name $FunctionAppName --resource-group $ResourceGroupName --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB')]" -o json | ConvertFrom-Json
    
    $requiredVars = @(
        "SQUARE_ACCESS_TOKEN",
        "SQUARE_LOCATION_ID", 
        "TIMESCALE_HOST",
        "TIMESCALE_DB",
        "MONGODB_URI"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        $found = $envVars | Where-Object { $_.name -eq $var }
        if ($found) {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "❌ $var is missing" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠️ Missing variables: $($missingVars -join ', ')" -ForegroundColor Yellow
        Write-Host "Run the set-env-vars.ps1 script to configure them" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error checking environment variables" -ForegroundColor Red
}

# Test 3: Check Function App URL
Write-Host "`n3️⃣ Checking Function App URL..." -ForegroundColor Yellow
try {
    $appUrl = "https://$FunctionAppName.azurewebsites.net"
    Write-Host "Function App URL: $appUrl" -ForegroundColor Cyan
    
    # Test if the URL is accessible
    $response = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Function App URL is accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Function App URL returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Function App URL might not be ready yet (this is normal for new deployments)" -ForegroundColor Yellow
}

# Test 4: Check GitHub Integration
Write-Host "`n4️⃣ Checking GitHub Integration..." -ForegroundColor Yellow
try {
    $sourceControl = az functionapp deployment source show --name $FunctionAppName --resource-group $ResourceGroupName --query "repoUrl" -o tsv
    if ($sourceControl -like "*github.com/nickbeentjes/Cafe-Brain*") {
        Write-Host "✅ GitHub integration is configured" -ForegroundColor Green
        Write-Host "Repository: $sourceControl" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ GitHub integration not found or incorrect" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking GitHub integration" -ForegroundColor Red
}

# Test 5: Check Function App Logs
Write-Host "`n5️⃣ Checking Recent Logs..." -ForegroundColor Yellow
try {
    Write-Host "Fetching recent logs (last 10 entries)..." -ForegroundColor Cyan
    az webapp log tail --name $FunctionAppName --resource-group $ResourceGroupName --provider docker --lines 10
} catch {
    Write-Host "⚠️ Could not fetch logs (Function App might still be starting)" -ForegroundColor Yellow
}

# Test 6: Test Database Connections (if possible)
Write-Host "`n6️⃣ Testing Database Connections..." -ForegroundColor Yellow
Write-Host "Note: Database connection tests require the Function App to be running" -ForegroundColor Cyan
Write-Host "This will be tested when the sync function runs" -ForegroundColor Cyan

# Test 7: Check Azure Resources
Write-Host "`n7️⃣ Checking Azure Resources..." -ForegroundColor Yellow
try {
    $resources = az resource list --resource-group $ResourceGroupName --query "[?contains(name, 'cafe-brain')].{Name:name, Type:type, Status:provisioningState}" -o table
    Write-Host "Related resources:" -ForegroundColor Cyan
    Write-Host $resources
} catch {
    Write-Host "❌ Error checking Azure resources" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 Test Summary:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "Function App: $FunctionAppName" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Cyan
Write-Host "URL: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. If environment variables are missing, run: .\azure-deployment\set-env-vars.ps1" -ForegroundColor White
Write-Host "2. Wait for the Function App to fully deploy (can take 5-10 minutes)" -ForegroundColor White
Write-Host "3. Check the Function App logs for any errors" -ForegroundColor White
Write-Host "4. Test the sync functionality by triggering a manual run" -ForegroundColor White

Write-Host "`n🔍 Manual Testing:" -ForegroundColor Yellow
Write-Host "Visit: https://$FunctionAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Check Application Insights for detailed monitoring" -ForegroundColor Cyan
