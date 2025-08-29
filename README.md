# Louise's Café Intelligence Dashboard

A comprehensive AI-powered business intelligence system for café management, featuring predictive analytics, natural language queries, and automated insights.

## 🚀 Features

### **AI-Powered Analytics**
- **Natural Language Queries**: Ask questions like "How many chicken and cheese did we sell last week?" or "When should I start the focaccia for tomorrow?"
- **Predictive Analytics**: Demand forecasting, customer surge prediction, and production timing recommendations
- **Weather Impact Analysis**: Correlate weather data with sales patterns
- **Automated Insights**: AI-generated business insights and anomaly detection

### **Real-Time Dashboard**
- **Revenue Overview**: Live tracking of daily/weekly revenue and transaction metrics
- **Sales Analytics**: Interactive charts showing sales trends over different time periods
- **Product Performance**: Top-selling products with revenue and quantity analysis
- **Customer Insights**: Customer behavior patterns and repeat customer rates
- **Production Schedule**: AI-recommended production timing for baked goods
- **Stock Recommendations**: Intelligent stock level suggestions based on demand patterns
- **Weather Impact**: Current weather and its predicted impact on sales

### **Smart Recommendations**
- **Stock Management**: Automated stock recommendations with confidence levels
- **Production Planning**: Optimal timing for baking and food preparation
- **Demand Forecasting**: Predict customer surges and product demand
- **Cost Optimization**: Insights for improving profitability

### **Data Integration**
- **Square POS Integration**: Automatic sync of transaction data
- **TimescaleDB**: High-performance time-series database for analytics
- **MongoDB**: Document storage for AI insights and configurations
- **Real-time Updates**: WebSocket-based live data synchronization

## 🏗️ Architecture

```
Square POS → Enhanced Sync → TimescaleDB → Analytics Engine → AI Insights
     ↓              ↓              ↓              ↓              ↓
Transaction    Data Processing   Time-series    Predictive    Dashboard
   Data         & Storage        Analytics      Models        Display
```

## 📋 Prerequisites

- Node.js 18+ 
- TimescaleDB (PostgreSQL with TimescaleDB extension)
- MongoDB
- Square Developer Account
- OpenWeather API Key (optional)
- OpenAI API Key (optional)

## 🛠️ Installation

### 1. Clone and Install
```bash
git clone <repository-url>
cd cafe-intelligence
npm install
```

### 2. Environment Configuration
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5050
NODE_ENV=production

# Square API Configuration
SQUARE_ACCESS_TOKEN=EAAAEM4OAGO-ToEf-mn8NyvOaxdJeiXejYr3bhcvjkYhyPAryCRFhsd9h3smTYOv
SQUARE_LOCATION_ID=L5D18K5RBWQJH
SQUARE_ENV=production
SQUARE_VERSION=2025-07-16

# Database Configuration
TIMESCALE_HOST=your_timescale_host
TIMESCALE_PORT=5432
TIMESCALE_DB=cafe
TIMESCALE_USER=postgres
TIMESCALE_PASSWORD=your_password

MONGODB_URI=mongodb://your_mongodb_connection_string

# External APIs
OPENWEATHER_API_KEY=your_openweather_api_key
OPENAI_API_KEY=your_openai_api_key

# Café Configuration
CAFE_LOCATION=Melbourne,AU

# Pricing Configuration
MIN_MARKUP=3.0
PRICE_ROUNDING=0.5
PSYCH_ENDING=0.90
```

### 3. Database Setup
```bash
npm run setup-db
```

### 4. Start the Application
```bash
npm start
```

The dashboard will be available at `http://localhost:5050/dashboard`

## 🎯 Usage

### **Natural Language Queries**
Ask the AI assistant questions like:
- "How many chicken and cheese did we sell last week?"
- "Please help prepare a milk order"
- "When should I start the focaccia for tomorrow?"
- "What's the weather impact on coffee sales?"

### **Dashboard Customization**
- **Widget Settings**: Click the gear icon on any widget to customize
- **Refresh Intervals**: Set automatic refresh rates for each widget
- **Layout**: Drag and drop widgets to rearrange the dashboard
- **Time Periods**: Switch between 7-day, 30-day, and 90-day views

### **Production Planning**
The system automatically:
- Analyzes historical demand patterns
- Considers weather forecasts
- Recommends optimal production start times
- Provides confidence levels for predictions

### **Stock Management**
Get intelligent recommendations for:
- Milk orders based on consumption patterns
- Ingredient quantities based on demand forecasts
- Reorder timing to minimize waste
- Safety stock levels

## 📊 API Endpoints

### **Analytics**
- `GET /api/analytics/revenue` - Revenue overview and trends
- `GET /api/analytics/sales?period=7d` - Sales data by time period
- `GET /api/analytics/products` - Top-performing products
- `GET /api/analytics/customers` - Customer insights
- `GET /api/analytics/production` - Production schedules
- `GET /api/analytics/stock` - Stock recommendations
- `GET /api/analytics/weather` - Weather data and impact
- `GET /api/analytics/insights` - AI-generated insights

### **AI Assistant**
- `POST /api/ai/query` - Natural language query processing

### **Original Features**
- `GET /api/products` - Product management
- `POST /api/products` - Add new products
- `GET /api/markers` - Production timers
- `POST /api/markers` - Create production timers

## 🔧 Development

### **Running in Development Mode**
```bash
npm run dev
```

### **Database Setup**
```bash
npm run setup-db
```

### **Running Analytics**
```bash
npm run analyze
```

### **Training Predictive Models**
```bash
npm run train-models
```

## 📈 Data Flow

1. **Square Sync**: Enhanced sync worker pulls transaction data every 5 minutes
2. **Data Processing**: Transactions are stored in TimescaleDB with analytics views
3. **AI Analysis**: Analytics engine processes data and generates insights
4. **Real-time Updates**: WebSocket connections push updates to dashboard
5. **Predictive Models**: Machine learning models generate forecasts and recommendations

## 🚀 Deployment

### **Azure App Service**
The system is designed to run on Azure App Service with:
- TimescaleDB on Azure Database for PostgreSQL
- MongoDB on Azure Cosmos DB
- Environment variables configured in App Service settings

### **PM2 Process Management**
```bash
pm2 start ecosystem.sync.config.js
pm2 save
pm2 startup
```

## 🔍 Monitoring

### **Logs**
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Real-time monitoring via PM2

### **Health Checks**
- `GET /api/health` - System health status
- Database connection monitoring
- Square API connectivity checks

## 🤖 AI Capabilities

### **Natural Language Processing**
- Intent recognition for different query types
- Entity extraction (products, timeframes, quantities)
- Context-aware responses

### **Predictive Analytics**
- Time-series forecasting for demand
- Weather correlation analysis
- Customer behavior prediction
- Anomaly detection

### **Automated Insights**
- Trend identification
- Opportunity detection
- Risk assessment
- Performance recommendations

## 📱 Mobile Responsive

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Kitchen displays

## 🔐 Security

- Rate limiting on API endpoints
- Input validation and sanitization
- Secure database connections
- Environment variable protection
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the logs for error details
- Verify environment variable configuration
- Ensure database connections are working
- Test Square API connectivity

## 🎉 What's Next

Future enhancements planned:
- Advanced machine learning models
- Integration with more POS systems
- Mobile app development
- Advanced reporting features
- Multi-location support
