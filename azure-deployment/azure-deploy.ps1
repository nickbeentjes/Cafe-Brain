# Azure Deployment Script for Cafe Brain
# This script creates all necessary Azure resources

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$FunctionAppName,
    
    [Parameter(Mandatory=$true)]
    [string]$PostgreSQLServerName,
    
    [Parameter(Mandatory=$true)]
    [string]$CosmosDBAccountName,
    
    [Parameter(Mandatory=$true)]
    [string]$PostgreSQLAdminUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$PostgreSQLAdminPassword
)

Write-Host "🚀 Starting Azure deployment for Cafe Brain..." -ForegroundColor Green

# 1. Create Resource Group
Write-Host "📦 Creating Resource Group..." -ForegroundColor Yellow
New-AzResourceGroup -Name $ResourceGroupName -Location $Location -Force

# 2. Create PostgreSQL Database with TimescaleDB
Write-Host "🐘 Creating PostgreSQL Database..." -ForegroundColor Yellow
$postgresParams = @{
    ResourceGroupName = $ResourceGroupName
    ServerName = $PostgreSQLServerName
    Location = $Location
    AdministratorLogin = $PostgreSQLAdminUsername
    AdministratorLoginPassword = $PostgreSQLAdminPassword
    SkuName = "GP_Gen5_2"
    Version = "11"
}

$postgresServer = New-AzPostgreSqlServer @postgresParams

# Create database
New-AzPostgreSqlDatabase -ResourceGroupName $ResourceGroupName -ServerName $PostgreSQLServerName -Name "cafe"

# Enable TimescaleDB extension
$query = "CREATE EXTENSION IF NOT EXISTS timescaledb;"
Invoke-AzPostgreSqlFlexibleServerQuery -ResourceGroupName $ResourceGroupName -ServerName $PostgreSQLServerName -Query $query

# 3. Create Cosmos DB Account (MongoDB API)
Write-Host "🍃 Creating Cosmos DB Account..." -ForegroundColor Yellow
$cosmosParams = @{
    ResourceGroupName = $ResourceGroupName
    Name = $CosmosDBAccountName
    Location = $Location
    ApiKind = "MongoDB"
    DefaultConsistencyLevel = "Session"
    EnableAutomaticFailover = $true
}

New-AzCosmosDBAccount @cosmosParams

# Create database and collection
New-AzCosmosDBMongoDBDatabase -ResourceGroupName $ResourceGroupName -AccountName $CosmosDBAccountName -Name "cafe"
New-AzCosmosDBMongoDBCollection -ResourceGroupName $ResourceGroupName -AccountName $CosmosDBAccountName -DatabaseName "cafe" -Name "analytics"

# 4. Create App Service Plan
Write-Host "🏗️ Creating App Service Plan..." -ForegroundColor Yellow
$appServicePlan = New-AzAppServicePlan -ResourceGroupName $ResourceGroupName -Name "$AppServiceName-plan" -Location $Location -Tier "Basic" -WorkerSize "Small"

# 5. Create App Service
Write-Host "🌐 Creating App Service..." -ForegroundColor Yellow
$appService = New-AzWebApp -ResourceGroupName $ResourceGroupName -Name $AppServiceName -Location $Location -AppServicePlan $appServicePlan.Name

# 6. Create Function App
Write-Host "⚡ Creating Function App..." -ForegroundColor Yellow
$functionApp = New-AzFunctionApp -ResourceGroupName $ResourceGroupName -Name $FunctionAppName -Location $Location -StorageAccountName "$FunctionAppName-storage" -AppServicePlan $appServicePlan.Name -Runtime "node" -RuntimeVersion "18"

# 7. Configure App Settings
Write-Host "⚙️ Configuring App Settings..." -ForegroundColor Yellow

# Get connection strings
$postgresConnectionString = "Server=$($postgresServer.FullyQualifiedDomainName);Database=cafe;Port=5432;User Id=$PostgreSQLAdminUsername@$PostgreSQLServerName;Password=$PostgreSQLAdminPassword;Ssl Mode=Require;"
$cosmosConnectionString = (Get-AzCosmosDBAccountKey -ResourceGroupName $ResourceGroupName -Name $CosmosDBAccountName).PrimaryMongoDBConnectionString

# App Service settings
$appSettings = @{
    "TIMESCALE_HOST" = $postgresServer.FullyQualifiedDomainName
    "TIMESCALE_PORT" = "5432"
    "TIMESCALE_DB" = "cafe"
    "TIMESCALE_USER" = "$PostgreSQLAdminUsername@$PostgreSQLServerName"
    "TIMESCALE_PASSWORD" = $PostgreSQLAdminPassword
    "MONGODB_URI" = $cosmosConnectionString
    "NODE_ENV" = "production"
    "WEBSITE_NODE_DEFAULT_VERSION" = "18.17.0"
}

Set-AzWebApp -ResourceGroupName $ResourceGroupName -Name $AppServiceName -AppSettings $appSettings

# Function App settings
$functionSettings = @{
    "TIMESCALE_HOST" = $postgresServer.FullyQualifiedDomainName
    "TIMESCALE_PORT" = "5432"
    "TIMESCALE_DB" = "cafe"
    "TIMESCALE_USER" = "$PostgreSQLAdminUsername@$PostgreSQLServerName"
    "TIMESCALE_PASSWORD" = $PostgreSQLAdminPassword
    "MONGODB_URI" = $cosmosConnectionString
    "NODE_ENV" = "production"
    "FUNCTIONS_WORKER_RUNTIME" = "node"
}

Set-AzFunctionAppSetting -ResourceGroupName $ResourceGroupName -Name $FunctionAppName -AppSetting $functionSettings

Write-Host "✅ Azure deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   App Service: https://$AppServiceName.azurewebsites.net"
Write-Host "   Function App: https://$FunctionAppName.azurewebsites.net"
Write-Host "   PostgreSQL Server: $($postgresServer.FullyQualifiedDomainName)"
Write-Host "   Cosmos DB Account: $CosmosDBAccountName"
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Set your Square API credentials in App Settings"
Write-Host "   2. Deploy your code to the App Service"
Write-Host "   3. Deploy the Azure Functions"
Write-Host "   4. Test the database connections"
