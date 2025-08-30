#!/bin/bash

# Set Environment Variables for Cafe Brain Function App
# Run this script in Azure Cloud Shell after the Function App is deployed

FUNCTION_APP_NAME="cafe-brain-sync"
RESOURCE_GROUP="Bledisloe"

echo "🔧 Setting environment variables for Function App: $FUNCTION_APP_NAME"

# Square API Configuration
echo "Setting Square API variables..."
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        SQUARE_ACCESS_TOKEN="EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv" \
        SQUARE_LOCATION_ID="L5D18K5RBWQJH" \
        SQUARE_ENV="production" \
        SQUARE_VERSION="2025-07-16"

# Database Configuration
echo "Setting database variables..."
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        TIMESCALE_HOST="4.198.153.55" \
        TIMESCALE_PORT="5432" \
        TIMESCALE_DB="cafe" \
        TIMESCALE_USER="postgres" \
        TIMESCALE_PASSWORD="bzchzz" \
        MONGODB_URI="mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"

# Application Configuration
echo "Setting application variables..."
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        NODE_ENV="production" \
        SQ_ORDERS_BACKFILL_DAYS="30" \
        WEBSITE_NODE_DEFAULT_VERSION="~20"

echo "✅ Environment variables set successfully!"
echo "Function App URL: https://$FUNCTION_APP_NAME.azurewebsites.net"

# List all settings to verify
echo ""
echo "📋 Current environment variables:"
az functionapp config appsettings list \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "[?contains(name, 'SQUARE') || contains(name, 'TIMESCALE') || contains(name, 'MONGODB') || contains(name, 'NODE_ENV')]" \
    --output table
