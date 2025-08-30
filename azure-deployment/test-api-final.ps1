# Test Cafe Brain API - Final Clean Version
# This script tests the deployed API endpoints

Write-Output "Testing Cafe Brain API endpoints..."

$apiUrl = "https://cafe-brain-api.azurewebsites.net"

Write-Output "Testing health endpoint..."
try {
    $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method Get
    Write-Output "Health check: SUCCESS"
    Write-Output "Status: $($healthResponse.status)"
    Write-Output "PostgreSQL: $($healthResponse.databases.postgres.status)"
    Write-Output "MongoDB: $($healthResponse.databases.mongodb.status)"
} catch {
    Write-Output "Health check: FAILED - $($_.Exception.Message)"
}

Write-Output ""
Write-Output "Testing orders endpoint..."
try {
    $ordersResponse = Invoke-RestMethod -Uri "$apiUrl/api/orders" -Method Get
    Write-Output "Orders API: SUCCESS"
    Write-Output "Orders count: $($ordersResponse.count)"
} catch {
    Write-Output "Orders API: FAILED - $($_.Exception.Message)"
}

Write-Output ""
Write-Output "Testing products endpoint..."
try {
    $productsResponse = Invoke-RestMethod -Uri "$apiUrl/api/products" -Method Get
    Write-Output "Products API: SUCCESS"
    Write-Output "Products count: $($productsResponse.count)"
} catch {
    Write-Output "Products API: FAILED - $($_.Exception.Message)"
}

Write-Output ""
Write-Output "API testing completed!"
