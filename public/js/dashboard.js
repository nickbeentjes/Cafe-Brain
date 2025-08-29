// Dashboard JavaScript
class Dashboard {
  constructor() {
    this.socket = io();
    this.charts = {};
    this.currentPeriod = '7d';
    this.refreshIntervals = {};
    this.currentWidget = null;
    
    this.initializeEventListeners();
    this.initializeSocket();
    this.updateTime();
    this.loadDashboardData();
    
    // Update time every second
    setInterval(() => this.updateTime(), 1000);
  }

  initializeEventListeners() {
    // AI Assistant
    document.getElementById('aiToggle').addEventListener('click', () => {
      const content = document.getElementById('aiContent');
      const icon = document.querySelector('#aiToggle i');
      content.classList.toggle('active');
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');
    });

    document.getElementById('aiSubmit').addEventListener('click', () => {
      this.processAIQuery();
    });

    document.getElementById('aiInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.processAIQuery();
      }
    });

    // Example queries
    document.querySelectorAll('.example-query').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('aiInput').value = btn.dataset.query;
        this.processAIQuery();
      });
    });

    // Time period selector
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPeriod = btn.dataset.period;
        this.updateSalesChart();
      });
    });

    // Widget controls
    document.querySelectorAll('.widget-refresh').forEach(btn => {
      btn.addEventListener('click', () => {
        const widgetId = btn.dataset.widget;
        this.refreshWidget(widgetId);
      });
    });

    document.querySelectorAll('.widget-settings').forEach(btn => {
      btn.addEventListener('click', () => {
        const widgetId = btn.dataset.widget;
        this.openWidgetSettings(widgetId);
      });
    });

    // Modal controls
    document.getElementById('modalClose').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveWidgetSettings();
    });

    document.getElementById('resetWidget').addEventListener('click', () => {
      this.resetWidgetSettings();
    });

    // Close modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target.id === 'settingsModal') {
        this.closeModal();
      }
    });
  }

  initializeSocket() {
    this.socket.on('connect', () => {
      this.updateStatus('online');
    });

    this.socket.on('disconnect', () => {
      this.updateStatus('offline');
    });

    // Listen for real-time updates
    this.socket.on('analytics:update', (data) => {
      this.handleAnalyticsUpdate(data);
    });

    this.socket.on('insights:new', (insight) => {
      this.addNewInsight(insight);
    });
  }

  updateStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.className = `status-dot ${status}`;
    statusText.textContent = status === 'online' ? 'Connected' : 'Disconnected';
  }

  updateTime() {
    const timeDisplay = document.getElementById('timeDisplay');
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString();
  }

  async processAIQuery() {
    const input = document.getElementById('aiInput');
    const query = input.value.trim();
    
    if (!query) return;

    const responseDiv = document.getElementById('aiResponse');
    const submitBtn = document.getElementById('aiSubmit');
    
    // Show loading state
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
    responseDiv.classList.add('active');
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.success) {
        responseDiv.textContent = data.response;
      } else {
        responseDiv.textContent = 'Sorry, I encountered an error. Please try again.';
      }
    } catch (error) {
      responseDiv.textContent = 'Sorry, I\'m having trouble connecting right now.';
    } finally {
      submitBtn.disabled = false;
      input.value = '';
    }
  }

  async loadDashboardData() {
    await Promise.all([
      this.loadRevenueData(),
      this.loadSalesData(),
      this.loadProductData(),
      this.loadCustomerData(),
      this.loadProductionData(),
      this.loadStockData(),
      this.loadWeatherData(),
      this.loadInsightsData()
    ]);
  }

  async loadRevenueData() {
    try {
      const response = await fetch('/api/analytics/revenue');
      const data = await response.json();
      
      document.getElementById('todayRevenue').textContent = `$${data.today.toFixed(2)}`;
      document.getElementById('weekRevenue').textContent = `$${data.week.toFixed(2)}`;
      document.getElementById('avgTransaction').textContent = `$${data.avgTransaction.toFixed(2)}`;
      
      this.createRevenueChart(data.history);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  }

  async loadSalesData() {
    try {
      const response = await fetch(`/api/analytics/sales?period=${this.currentPeriod}`);
      const data = await response.json();
      this.createSalesChart(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  }

  async loadProductData() {
    try {
      const response = await fetch('/api/analytics/products');
      const data = await response.json();
      this.updateProductList(data);
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  }

  async loadCustomerData() {
    try {
      const response = await fetch('/api/analytics/customers');
      const data = await response.json();
      
      document.getElementById('uniqueCustomers').textContent = data.uniqueToday;
      document.getElementById('repeatCustomers').textContent = `${(data.repeatRate * 100).toFixed(1)}%`;
      
      this.createCustomerChart(data.history);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  }

  async loadProductionData() {
    try {
      const response = await fetch('/api/analytics/production');
      const data = await response.json();
      this.updateScheduleList(data);
    } catch (error) {
      console.error('Error loading production data:', error);
    }
  }

  async loadStockData() {
    try {
      const response = await fetch('/api/analytics/stock');
      const data = await response.json();
      this.updateStockList(data);
    } catch (error) {
      console.error('Error loading stock data:', error);
    }
  }

  async loadWeatherData() {
    try {
      const response = await fetch('/api/analytics/weather');
      const data = await response.json();
      this.updateWeatherInfo(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  }

  async loadInsightsData() {
    try {
      const response = await fetch('/api/analytics/insights');
      const data = await response.json();
      this.updateInsightsList(data);
    } catch (error) {
      console.error('Error loading insights data:', error);
    }
  }

  createRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }

    this.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.revenue),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            }
          }
        }
      }
    });
  }

  createSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    if (this.charts.sales) {
      this.charts.sales.destroy();
    }

    this.charts.sales = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Transactions',
          data: data.map(d => d.transactions),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createCustomerChart(data) {
    const ctx = document.getElementById('customerChart').getContext('2d');
    
    if (this.charts.customers) {
      this.charts.customers.destroy();
    }

    this.charts.customers = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['New Customers', 'Returning Customers'],
        datasets: [{
          data: [data.newCustomers, data.returningCustomers],
          backgroundColor: ['#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  updateProductList(products) {
    const container = document.getElementById('productList');
    
    if (products.length === 0) {
      container.innerHTML = '<div class="no-data">No product data available</div>';
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-name">${product.name}</div>
          <div class="list-item-details">${product.category}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-value">${product.quantity} sold</div>
          <div class="list-item-subtitle">$${product.revenue.toFixed(2)}</div>
        </div>
      </div>
    `).join('');
  }

  updateScheduleList(schedules) {
    const container = document.getElementById('scheduleList');
    
    if (schedules.length === 0) {
      container.innerHTML = '<div class="no-data">No production tasks scheduled</div>';
      return;
    }

    container.innerHTML = schedules.map(schedule => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-name">${schedule.productName}</div>
          <div class="list-item-details">Start: ${new Date(schedule.recommendedStartTime).toLocaleTimeString()}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-value">${schedule.estimatedDemand} units</div>
          <div class="list-item-subtitle">${(schedule.confidence * 100).toFixed(0)}% confidence</div>
        </div>
      </div>
    `).join('');
  }

  updateStockList(recommendations) {
    const container = document.getElementById('stockList');
    
    if (recommendations.length === 0) {
      container.innerHTML = '<div class="no-data">All stock levels look good</div>';
      return;
    }

    container.innerHTML = recommendations.map(rec => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-name">${rec.productName}</div>
          <div class="list-item-details">${rec.reasoning}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-value">${rec.recommendedStock} units</div>
          <div class="list-item-subtitle">${rec.urgency} priority</div>
        </div>
      </div>
    `).join('');
  }

  updateWeatherInfo(weather) {
    const container = document.getElementById('weatherInfo');
    
    container.innerHTML = `
      <div class="weather-current">
        <div class="weather-main">
          <i class="fas fa-${this.getWeatherIcon(weather.conditions)}"></i>
          <span class="weather-temp">${weather.temperature}°C</span>
        </div>
        <div class="weather-details">
          <div>${weather.conditions}</div>
          <div>Humidity: ${weather.humidity}%</div>
          <div>Wind: ${weather.windSpeed} km/h</div>
        </div>
      </div>
      ${weather.impact ? `
        <div class="weather-impact">
          <strong>Sales Impact:</strong> ${weather.impact}
        </div>
      ` : ''}
    `;
  }

  updateInsightsList(insights) {
    const container = document.getElementById('insightsList');
    
    if (insights.length === 0) {
      container.innerHTML = '<div class="no-data">No insights available</div>';
      return;
    }

    container.innerHTML = insights.map(insight => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-name">${insight.title}</div>
          <div class="list-item-details">${insight.description}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-value">${insight.type}</div>
          <div class="list-item-subtitle">${insight.severity}</div>
        </div>
      </div>
    `).join('');
  }

  getWeatherIcon(conditions) {
    const conditionMap = {
      'Clear': 'sun',
      'Clouds': 'cloud',
      'Rain': 'cloud-rain',
      'Snow': 'snowflake',
      'Thunderstorm': 'bolt',
      'Drizzle': 'cloud-rain',
      'Mist': 'smog',
      'Fog': 'smog'
    };
    return conditionMap[conditions] || 'cloud';
  }

  async refreshWidget(widgetId) {
    const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
    const refreshBtn = widget.querySelector('.widget-refresh i');
    
    refreshBtn.classList.add('fa-spin');
    
    try {
      switch (widgetId) {
        case 'revenue':
          await this.loadRevenueData();
          break;
        case 'sales':
          await this.loadSalesData();
          break;
        case 'products':
          await this.loadProductData();
          break;
        case 'customers':
          await this.loadCustomerData();
          break;
        case 'production':
          await this.loadProductionData();
          break;
        case 'stock':
          await this.loadStockData();
          break;
        case 'weather':
          await this.loadWeatherData();
          break;
        case 'insights':
          await this.loadInsightsData();
          break;
      }
    } catch (error) {
      console.error(`Error refreshing widget ${widgetId}:`, error);
    } finally {
      refreshBtn.classList.remove('fa-spin');
    }
  }

  openWidgetSettings(widgetId) {
    this.currentWidget = widgetId;
    document.getElementById('settingsModal').classList.add('active');
  }

  closeModal() {
    document.getElementById('settingsModal').classList.remove('active');
    this.currentWidget = null;
  }

  saveWidgetSettings() {
    // Save widget settings to localStorage or API
    const refreshInterval = document.getElementById('refreshInterval').value;
    
    if (this.currentWidget) {
      const settings = {
        refreshInterval: parseInt(refreshInterval),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`widget_${this.currentWidget}`, JSON.stringify(settings));
      
      // Set up refresh interval
      if (this.refreshIntervals[this.currentWidget]) {
        clearInterval(this.refreshIntervals[this.currentWidget]);
      }
      
      this.refreshIntervals[this.currentWidget] = setInterval(() => {
        this.refreshWidget(this.currentWidget);
      }, refreshInterval * 1000);
    }
    
    this.closeModal();
  }

  resetWidgetSettings() {
    if (this.currentWidget) {
      localStorage.removeItem(`widget_${this.currentWidget}`);
      
      if (this.refreshIntervals[this.currentWidget]) {
        clearInterval(this.refreshIntervals[this.currentWidget]);
        delete this.refreshIntervals[this.currentWidget];
      }
    }
    
    this.closeModal();
  }

  updateSalesChart() {
    this.loadSalesData();
  }

  handleAnalyticsUpdate(data) {
    // Handle real-time analytics updates
    if (data.type === 'revenue') {
      this.loadRevenueData();
    } else if (data.type === 'sales') {
      this.loadSalesData();
    }
  }

  addNewInsight(insight) {
    const container = document.getElementById('insightsList');
    const insightElement = document.createElement('div');
    insightElement.className = 'list-item';
    insightElement.innerHTML = `
      <div class="list-item-left">
        <div class="list-item-name">${insight.title}</div>
        <div class="list-item-details">${insight.description}</div>
      </div>
      <div class="list-item-right">
        <div class="list-item-value">${insight.type}</div>
        <div class="list-item-subtitle">${insight.severity}</div>
      </div>
    `;
    
    container.insertBefore(insightElement, container.firstChild);
    
    // Remove oldest insight if more than 5
    if (container.children.length > 5) {
      container.removeChild(container.lastChild);
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

