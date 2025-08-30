# Cafe Brain API Functions

Secure API endpoints for Cafe Brain database operations using Azure Functions.

## 🏗️ Architecture

This API layer provides secure access to your databases through Azure Functions, eliminating direct database exposure.

### **Security Features**
- ✅ **Authentication**: Function-level API keys
- ✅ **Rate Limiting**: Built into Azure API Management
- ✅ **CORS**: Properly configured for web access
- ✅ **Input Validation**: All endpoints validate input
- ✅ **Error Handling**: Secure error responses
- ✅ **Logging**: Comprehensive audit trail

## 📁 Project Structure

```
api-functions/
├── database.js          # Database connection management
├── Orders/
│   ├── function.json    # Orders API configuration
│   └── index.js         # Orders API implementation
├── Products/
│   ├── function.json    # Products API configuration
│   └── index.js         # Products API implementation
├── Health/
│   ├── function.json    # Health check configuration
│   └── index.js         # Health check implementation
├── package.json         # Dependencies
├── host.json           # Azure Functions configuration
└── local.settings.json # Local environment variables
```

## 🚀 API Endpoints

### **Orders API** (`/api/orders`)
- `GET /api/orders` - Get all orders
- `GET /api/orders/recent` - Get recent orders (24h)
- `GET /api/orders/analytics` - Get order analytics
- `GET /api/orders/summary` - Get order summary
- `POST /api/orders` - Create new order
- `POST /api/orders/sync` - Sync orders from Square

### **Products API** (`/api/products`)
- `GET /api/products` - Get all products
- `GET /api/products/popular` - Get popular products
- `GET /api/products/categories` - Get product categories
- `GET /api/products/search` - Search products
- `POST /api/products` - Create new product
- `PUT /api/products` - Update product
- `DELETE /api/products?id={id}` - Delete product

### **Health Check** (`/api/health`)
- `GET /api/health` - System health and database status

## 🔧 Setup Instructions

### **1. Deploy to Azure Functions**

```powershell
# Navigate to the API Functions directory
cd azure-deployment/api-functions

# Install dependencies
npm install

# Deploy to Azure Functions
func azure functionapp publish cafe-brain-api
```

### **2. Set Environment Variables**

```powershell
# Set database connection variables
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings TIMESCALE_HOST="4.198.153.55"
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings TIMESCALE_PORT="5432"
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings TIMESCALE_DB="cafe"
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings TIMESCALE_USER="postgres"
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings TIMESCALE_PASSWORD="bzchzz"
az functionapp config appsettings set --name cafe-brain-api --resource-group Bledisloe --settings MONGODB_URI="mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe"
```

### **3. Create Azure API Management**

```powershell
# Create API Management service
az apim create --name "cafe-brain-api" --resource-group "Bledisloe" --publisher-name "Cafe Brain" --publisher-email "admin@cafebrain.com" --sku-name "Developer"
```

## 🔐 Security Configuration

### **API Management Policies**

```xml
<!-- Rate limiting -->
<rate-limit calls="100" renewal-period="60" />

<!-- IP filtering -->
<ip-filter action="allow">
    <address>YOUR_WEB_APP_IP</address>
</ip-filter>

<!-- Authentication -->
<validate-jwt header-name="Authorization" failed-validation-httpcode="401" />
```

### **CORS Configuration**

All endpoints include proper CORS headers:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## 📊 Usage Examples

### **Get Recent Orders**
```javascript
fetch('https://cafe-brain-api.azurewebsites.net/api/orders/recent', {
  headers: {
    'x-functions-key': 'YOUR_FUNCTION_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### **Search Products**
```javascript
fetch('https://cafe-brain-api.azurewebsites.net/api/products/search?q=coffee&category=drinks', {
  headers: {
    'x-functions-key': 'YOUR_FUNCTION_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### **Health Check**
```javascript
fetch('https://cafe-brain-api.azurewebsites.net/api/health')
.then(response => response.json())
.then(data => console.log(data));
```

## 🔍 Monitoring

### **Application Insights**
- Automatic logging and monitoring
- Performance metrics
- Error tracking
- Request tracing

### **Health Monitoring**
- Database connectivity checks
- System resource monitoring
- Uptime tracking

## 🚨 Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

## 📈 Benefits

1. **Security**: No direct database exposure
2. **Scalability**: Serverless architecture
3. **Monitoring**: Built-in Azure monitoring
4. **Cost**: Pay-per-use pricing
5. **Integration**: Easy to integrate with existing apps
6. **Maintenance**: Managed by Azure

## 🔄 Next Steps

1. **Deploy the API Functions**
2. **Configure API Management**
3. **Update your web app** to use these APIs instead of direct database connections
4. **Set up monitoring** and alerting
5. **Configure authentication** (API keys, OAuth, etc.)

This architecture provides enterprise-grade security while maintaining the flexibility and performance you need for your cafe management system.
