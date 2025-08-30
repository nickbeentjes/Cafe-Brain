# Deploy API Functions Directly - No Complex Strings
Write-Host "Creating Azure Function App for Cafe Brain API..." -ForegroundColor Green

# Create storage account
Write-Host "Creating storage account..." -ForegroundColor Yellow
az storage account create --name "cafebrainapistorage" --resource-group "Bledisloe" --location "australiaeast" --sku "Standard_LRS"

# Create function app
Write-Host "Creating function app..." -ForegroundColor Yellow
az functionapp create --name "cafe-brain-api" --resource-group "Bledisloe" --consumption-plan-location "australiaeast" --runtime "node" --runtime-version "20" --functions-version "4" --storage-account "cafebrainapistorage" --os-type "Linux"

Write-Host "Function App created successfully!" -ForegroundColor Green
Write-Host "Now run: cd api-functions && npm install && func azure functionapp publish cafe-brain-api" -ForegroundColor Cyan
