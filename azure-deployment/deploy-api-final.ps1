# Deploy Cafe Brain API Functions - Final Clean Version
# This script creates the Azure Function App and deploys the API

Write-Output "Creating Azure Function App for Cafe Brain API..."

# Create storage account
Write-Output "Creating storage account..."
az storage account create --name "cafebrainapistorage" --resource-group "Bledisloe" --location "australiaeast" --sku "Standard_LRS"

# Create function app
Write-Output "Creating function app..."
az functionapp create --name "cafe-brain-api" --resource-group "Bledisloe" --consumption-plan-location "australiaeast" --runtime "node" --runtime-version "20" --functions-version "4" --storage-account "cafebrainapistorage" --os-type "Linux"

Write-Output "Function App created successfully!"
Write-Output "Next steps:"
Write-Output "1. cd azure-deployment/api-functions"
Write-Output "2. npm install"
Write-Output "3. func azure functionapp publish cafe-brain-api"
Write-Output "4. cd .."
Write-Output "5. .\set-env-vars-final.ps1"
