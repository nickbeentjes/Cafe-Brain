# 🧠 Cafe Brain - AI-Powered Restaurant Analytics Platform

A comprehensive restaurant management and analytics platform that integrates with Square POS to provide real-time insights, AI-powered analytics, and automated reporting.

## 🚀 Features

### Core Functionality
- **Square POS Integration** - Real-time transaction sync from Square
- **TimescaleDB Analytics** - Time-series data storage for transaction history
- **MongoDB Insights** - AI-generated analytics and reports
- **Real-time Dashboard** - Live restaurant performance monitoring
- **Automated Sync** - Background workers for continuous data synchronization

### AI-Powered Analytics
- **Daily Reports** - Automated daily sales and performance summaries
- **Anomaly Detection** - AI-powered detection of unusual transaction patterns
- **Predictive Insights** - Sales forecasting and trend analysis
- **Smart Recommendations** - AI-driven suggestions for business optimization

### Azure Integration (Coming Soon)
- **Azure AI Services** - Advanced machine learning and cognitive services
- **Azure AI Search** - Intelligent search and content discovery
- **Azure Functions** - Serverless background processing
- **Azure App Service** - Scalable web hosting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Square POS    │    │   Cafe Brain    │    │   Azure Cloud   │
│                 │    │                 │    │                 │
│ • Transactions  │───▶│ • Web App       │───▶│ • App Service   │
│ • Orders        │    │ • API Server    │    │ • Functions     │
│ • Products      │    │ • Dashboard     │    │ • AI Services   │
└─────────────────┘    └─────────────────┘    │ • AI Search     │
                                              └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │   Databases     │
                                              │                 │
                                              │ • TimescaleDB   │
                                              │ • MongoDB       │
                                              └─────────────────┘
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Databases**: PostgreSQL (TimescaleDB), MongoDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Background Jobs**: PM2 (local), Azure Functions (cloud)
- **AI/ML**: Custom analytics engine, Azure AI Services (planned)
- **Deployment**: Azure App Service, Azure Functions

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL with TimescaleDB extension
- MongoDB
- Square Developer Account

### Local Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Cafe-Brain

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and Square credentials

# Initialize databases
node scripts/setup-env.js

# Start the application
npm start
```

### Database Setup
```bash
# Test database connections
node scripts/db-diagnostic.js

# Quick database test
node scripts/quick-db-test.js

# Test Square sync
node scripts/test-square-sync.js
```

## 🚀 Azure Deployment

### Quick Deploy (Recommended)
1. Follow the [Azure Deployment Guide](DEPLOY-TO-AZURE.md)
2. Use the provided ARM template: `azure-deployment/deploy-template.json`
3. Deploy web app code: `cafe-brain-web.zip`

### Manual Deployment
```bash
# Deploy infrastructure
az deployment group create \
  --resource-group bledisloe \
  --template-file azure-deployment/deploy-template.json

# Deploy web app
az webapp deployment source config-zip \
  --resource-group bledisloe \
  --name cafe-brain-app \
  --src cafe-brain-web.zip
```

## 🔧 Configuration

### Environment Variables
```bash
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENV=production

# Database Configuration
TIMESCALE_HOST=your_postgres_host
TIMESCALE_PORT=5432
TIMESCALE_DB=cafe
TIMESCALE_USER=postgres
TIMESCALE_PASSWORD=your_password

MONGODB_URI=mongodb://user:password@host:port/database

# Application Configuration
NODE_ENV=production
SQ_ORDERS_BACKFILL_DAYS=30
```

### Square API Setup
1. Create a Square Developer account
2. Create a new application
3. Get your Access Token and Location ID
4. Configure webhook endpoints (optional)

## 📊 Usage

### Dashboard Access
- **Local**: http://localhost:3000
- **Azure**: https://your-app-name.azurewebsites.net

### Key Features
- **Real-time Analytics**: Live transaction monitoring
- **Historical Data**: Time-series analysis of sales trends
- **AI Insights**: Automated anomaly detection and recommendations
- **Export Capabilities**: Data export for external analysis

## 🔮 Future Enhancements

### Azure AI Integration (Planned)
- **Azure OpenAI Service**: Advanced natural language processing
- **Azure Cognitive Services**: Computer vision for receipt analysis
- **Azure Machine Learning**: Custom ML models for sales prediction
- **Azure AI Search**: Intelligent search across transaction history

### Advanced Features
- **Multi-location Support**: Manage multiple restaurant locations
- **Inventory Management**: Real-time inventory tracking
- **Customer Analytics**: Customer behavior and loyalty analysis
- **Mobile App**: Native mobile application
- **API Gateway**: RESTful API for third-party integrations

## 🧪 Testing

```bash
# Test database connections
npm run test:db

# Test Square API integration
npm run test:square

# Run all tests
npm test
```

## 📝 API Documentation

### Endpoints
- `GET /api/transactions` - Get transaction history
- `GET /api/analytics/daily` - Get daily analytics
- `POST /api/sync/square` - Trigger Square sync
- `GET /api/health` - Health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Azure Deployment Guide](DEPLOY-TO-AZURE.md)
- Review the [Scripts Documentation](scripts/README.md)
- Open an issue on GitHub

## 🔗 Links

- [Square Developer Documentation](https://developer.squareup.com/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
