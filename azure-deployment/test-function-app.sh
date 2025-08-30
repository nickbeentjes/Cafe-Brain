#!/bin/bash

# Test Cafe Brain Function App Deployment
# Run this script in Azure Cloud Shell to verify everything is working

FUNCTION_APP_NAME="cafe-brain-sync"
RESOURCE_GROUP="Bledisloe"

echo "🧪 Testing Cafe Brain Function App: $FUNCTION_APP_NAME"
echo "================================================="

# Test 1: Check Function App Status
echo ""
echo "1️⃣ Checking Function App Status..."
APP_STATUS=$(az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --query "state" -o tsv 2>/dev/null)
if [ "$APP_STATUS" = "Running" ]; then
    echo "✅ Function App is running"
else
    echo "⚠️ Function App status: $APP_STATUS"
fi

# Test 2: Check Environment Variables
echo ""
echo "2️⃣ Checking Environment Variables..."
ENV_VARS=$(az functionapp config appsettings list --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB')]" -o json 2>/dev/null)

REQUIRED_VARS=("SQUARE_ACCESS_TOKEN" "SQUARE_LOCATION_ID" "TIMESCALE_HOST" "TIMESCALE_DB" "MONGODB_URI")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "\"name\": \"$var\""; then
        echo "✅ $var is set"
    else
        echo "❌ $var is missing"
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️ Missing variables: ${MISSING_VARS[*]}"
    echo "Run the set-env-vars.sh script to configure them"
fi

# Test 3: Check Function App URL
echo ""
echo "3️⃣ Checking Function App URL..."
APP_URL="https://$FUNCTION_APP_NAME.azurewebsites.net"
echo "Function App URL: $APP_URL"

# Test if the URL is accessible
if curl -s --head "$APP_URL" | head -n 1 | grep "HTTP/1.[01] [23].." > /dev/null; then
    echo "✅ Function App URL is accessible"
else
    echo "⚠️ Function App URL might not be ready yet (this is normal for new deployments)"
fi

# Test 4: Check GitHub Integration
echo ""
echo "4️⃣ Checking GitHub Integration..."
SOURCE_CONTROL=$(az functionapp deployment source show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --query "repoUrl" -o tsv 2>/dev/null)
if [[ "$SOURCE_CONTROL" == *"github.com/nickbeentjes/Cafe-Brain"* ]]; then
    echo "✅ GitHub integration is configured"
    echo "Repository: $SOURCE_CONTROL"
else
    echo "⚠️ GitHub integration not found or incorrect"
fi

# Test 5: Check Function App Logs
echo ""
echo "5️⃣ Checking Recent Logs..."
echo "Fetching recent logs (last 10 entries)..."
az webapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --provider docker --lines 10 2>/dev/null || echo "⚠️ Could not fetch logs (Function App might still be starting)"

# Test 6: Test Database Connections
echo ""
echo "6️⃣ Testing Database Connections..."
echo "Note: Database connection tests require the Function App to be running"
echo "This will be tested when the sync function runs"

# Test 7: Check Azure Resources
echo ""
echo "7️⃣ Checking Azure Resources..."
echo "Related resources:"
az resource list --resource-group $RESOURCE_GROUP --query "[?contains(name, 'cafe-brain')].{Name:name, Type:type, Status:provisioningState}" -o table 2>/dev/null || echo "❌ Error checking Azure resources"

# Summary
echo ""
echo "📊 Test Summary:"
echo "==============="
echo "Function App: $FUNCTION_APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "URL: $APP_URL"

echo ""
echo "🎯 Next Steps:"
echo "1. If environment variables are missing, run: ./azure-deployment/set-env-vars.sh"
echo "2. Wait for the Function App to fully deploy (can take 5-10 minutes)"
echo "3. Check the Function App logs for any errors"
echo "4. Test the sync functionality by triggering a manual run"

echo ""
echo "🔍 Manual Testing:"
echo "Visit: $APP_URL"
echo "Check Application Insights for detailed monitoring"
