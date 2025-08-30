#!/bin/bash

# Test Environment Variables for Cafe Brain Azure Resources
# This script verifies that all environment variables are properly set

FUNCTION_APP_NAME=${1:-"cafe-brain-sync"}
WEB_APP_NAME=${2:-"cafe-brain-app"}
RESOURCE_GROUP_NAME=${3:-"Bledisloe"}

echo "🧪 Testing Environment Variables for Cafe Brain"
echo "==============================================="

# Expected environment variables
expected_vars=(
    "SQUARE_ACCESS_TOKEN"
    "SQUARE_LOCATION_ID"
    "SQUARE_ENV"
    "SQUARE_VERSION"
    "TIMESCALE_HOST"
    "TIMESCALE_PORT"
    "TIMESCALE_DB"
    "TIMESCALE_USER"
    "TIMESCALE_PASSWORD"
    "MONGODB_URI"
    "NODE_ENV"
    "SQ_ORDERS_BACKFILL_DAYS"
    "WEBSITE_NODE_DEFAULT_VERSION"
    "PORT"
    "LOG_LEVEL"
)

# Function to check if variable exists in settings
check_vars() {
    local resource_type=$1
    local resource_name=$2
    local settings_json=$3
    
    echo ""
    echo "🔧 Testing $resource_type Environment Variables..."
    
    # Count found variables
    found_count=0
    missing_vars=()
    
    for var in "${expected_vars[@]}"; do
        if echo "$settings_json" | jq -e ".[] | select(.name == \"$var\")" > /dev/null; then
            echo "✅ $var"
            ((found_count++))
        else
            echo "❌ $var (missing)"
            missing_vars+=("$var")
        fi
    done
    
    echo "Found $found_count environment variables in $resource_type"
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo ""
        echo "⚠️ Missing variables in $resource_type: ${missing_vars[*]}"
    else
        echo ""
        echo "✅ All environment variables found in $resource_type!"
    fi
}

# Test Function App Environment Variables
echo ""
echo "🔧 Testing Function App Environment Variables..."
if function_settings=$(az functionapp config appsettings list \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --output json 2>/dev/null); then
    
    check_vars "Function App" "$FUNCTION_APP_NAME" "$function_settings"
else
    echo "❌ Failed to test Function App environment variables"
fi

# Test Web App Environment Variables
echo ""
echo "🌐 Testing Web App Environment Variables..."
if web_settings=$(az webapp config appsettings list \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --output json 2>/dev/null); then
    
    check_vars "Web App" "$WEB_APP_NAME" "$web_settings"
else
    echo "❌ Failed to test Web App environment variables"
fi

# Test resource availability
echo ""
echo "🔍 Testing Resource Availability..."

# Test Function App
echo "Checking Function App status..."
if function_status=$(az functionapp show \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query "state" \
    --output tsv 2>/dev/null); then
    
    if [ "$function_status" = "Running" ]; then
        echo "✅ Function App is running"
    else
        echo "⚠️ Function App status: $function_status"
    fi
else
    echo "❌ Could not check Function App status"
fi

# Test Web App
echo "Checking Web App status..."
if web_status=$(az webapp show \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query "state" \
    --output tsv 2>/dev/null); then
    
    if [ "$web_status" = "Running" ]; then
        echo "✅ Web App is running"
    else
        echo "⚠️ Web App status: $web_status"
    fi
else
    echo "❌ Could not check Web App status"
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo "Function App: https://$FUNCTION_APP_NAME.azurewebsites.net"
echo "Web App: https://$WEB_APP_NAME.azurewebsites.net"

echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. If any variables are missing, run: ./azure-deployment/set-env-vars.sh"
echo "2. Test the applications by visiting the URLs above"
echo "3. Check application logs if there are issues"
