#!/bin/bash

# Set Environment Variables for Cafe Brain Azure Resources
# Run this script after the resources are deployed

FUNCTION_APP_NAME=${1:-"cafe-brain-sync"}
WEB_APP_NAME=${2:-"cafe-brain-app"}
RESOURCE_GROUP_NAME=${3:-"Bledisloe"}

echo "🔧 Setting environment variables for Cafe Brain Azure Resources"
echo "================================================================="

# Square API Configuration
echo ""
echo "📡 Setting Square API variables..."
SQUARE_SETTINGS=(
    "SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv"
    "SQUARE_LOCATION_ID=L5D18K5RBWQJH"
    "SQUARE_ENV=production"
    "SQUARE_VERSION=2025-07-16"
)

# Database Configuration
echo "🗄️ Setting database variables..."
DB_SETTINGS=(
    "TIMESCALE_HOST=4.198.153.55"
    "TIMESCALE_PORT=5432"
    "TIMESCALE_DB=cafe"
    "TIMESCALE_USER=postgres"
    "TIMESCALE_PASSWORD=bzchzz"
    "MONGODB_URI=mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"
)

# Application Configuration
echo "⚙️ Setting application variables..."
APP_SETTINGS=(
    "NODE_ENV=production"
    "SQ_ORDERS_BACKFILL_DAYS=30"
    "WEBSITE_NODE_DEFAULT_VERSION=~20"
    "PORT=8080"
    "LOG_LEVEL=info"
)

# Combine all settings
ALL_SETTINGS=("${SQUARE_SETTINGS[@]}" "${DB_SETTINGS[@]}" "${APP_SETTINGS[@]}")

# Set Function App Environment Variables
echo ""
echo "🔧 Setting Function App environment variables..."
if az functionapp config appsettings set \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --settings "${ALL_SETTINGS[@]}"; then
    echo "✅ Function App environment variables set successfully!"
else
    echo "❌ Failed to set Function App environment variables"
    exit 1
fi

# Set Web App Environment Variables
echo ""
echo "🌐 Setting Web App environment variables..."
if az webapp config appsettings set \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --settings "${ALL_SETTINGS[@]}"; then
    echo "✅ Web App environment variables set successfully!"
else
    echo "❌ Failed to set Web App environment variables"
    exit 1
fi

echo ""
echo "📋 Environment Variables Summary:"
echo "================================="

echo ""
echo "📡 Square API:"
for setting in "${SQUARE_SETTINGS[@]}"; do
    echo "   $setting"
done

echo ""
echo "🗄️ Database:"
for setting in "${DB_SETTINGS[@]}"; do
    if [[ "$setting" == *"PASSWORD"* ]] || [[ "$setting" == *"MONGODB_URI"* ]]; then
        echo "   ${setting%%=*}: ***"
    else
        echo "   $setting"
    fi
done

echo ""
echo "⚙️ Application:"
for setting in "${APP_SETTINGS[@]}"; do
    echo "   $setting"
done

echo ""
echo "🔗 Resource URLs:"
echo "================="
echo "Web App: https://$WEB_APP_NAME.azurewebsites.net"
echo "Function App: https://$FUNCTION_APP_NAME.azurewebsites.net"

echo ""
echo "✅ Environment variables configuration completed!"
echo "🚀 Your Cafe Brain application should now be ready to run!"

# Optional: List current settings to verify
echo ""
echo "📋 Verifying Function App settings..."
if az functionapp config appsettings list \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB') || contains(name, 'NODE_ENV')]" \
    --output table; then
    echo "✅ Function App settings verified"
else
    echo "⚠️ Could not verify Function App settings"
fi

echo ""
echo "📋 Verifying Web App settings..."
if az webapp config appsettings list \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB') || contains(name, 'NODE_ENV')]" \
    --output table; then
    echo "✅ Web App settings verified"
else
    echo "⚠️ Could not verify Web App settings"
fi
