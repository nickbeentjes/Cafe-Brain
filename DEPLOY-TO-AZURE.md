# Quick Azure Deployment for Cafe Brain

## 🚀 Deploy via Azure Portal (Fastest Method)

Since Azure CLI isn't configured, here's the fastest way to deploy:

### Step 1: Deploy Infrastructure
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Bledisloe** resource group
3. Click **+ Create** → **Template deployment (deploy using custom template)**
4. Click **Build your own template in the editor**
5. Copy and paste the contents of `azure-deployment/deploy-template.json`
6. Click **Save**
7. Fill in parameters:
   - **App Service Name**: `cafe-brain-app-[yourname]` (must be globally unique)
   - **Function App Name**: `cafe-brain-sync-[yourname]` (must be globally unique)
8. Click **Review + Create** → **Create**

### Step 2: Deploy Web App Code
1. After infrastructure is created, go to your App Service
2. Go to **Deployment Center**
3. Choose **ZIP Deploy**
4. Upload the `cafe-brain-web.zip` file we created
5. Click **Deploy**

### Step 3: Deploy Function App Code
1. Go to your Function App
2. Go to **Deployment Center** 
3. Choose **ZIP Deploy**
4. Upload the contents of `azure-deployment/azure-functions-sync/` as a ZIP
5. Click **Deploy**

## 🎯 Alternative: Use Azure Cloud Shell

If you prefer command line:

1. Go to [Azure Portal](https://portal.azure.com)
2. Click the Cloud Shell icon (>_) in the top navigation
3. Run these commands:

```bash
# Set subscription
az account set --subscription 37df3adf-b3c9-4bfc-b0e5-9ddf581af7b2

# Deploy template
az deployment group create \
  --resource-group bledisloe \
  --template-file deploy-template.json \
  --parameters appServiceName=cafe-brain-app-$(whoami) functionAppName=cafe-brain-sync-$(whoami)

# Deploy web app
az webapp deployment source config-zip \
  --resource-group bledisloe \
  --name cafe-brain-app-$(whoami) \
  --src cafe-brain-web.zip
```

## 📋 What Gets Created

- **App Service Plan** (B1 tier - suitable for production)
- **Web App** - Main Cafe Brain application
- **Function App** - Background sync workers  
- **Storage Account** - Required for Function App

## 🔗 URLs After Deployment

- **Web App**: `https://cafe-brain-app-[yourname].azurewebsites.net`
- **Function App**: `https://cafe-brain-sync-[yourname].azurewebsites.net`

## ✅ Verification

1. Visit your web app URL - should show the Cafe Brain dashboard
2. Check Function App logs to ensure sync is working
3. Verify database connections are working

## 🔧 Existing Database Configuration

The deployment uses your existing databases:
- **PostgreSQL**: `4.198.153.55:5432/cafe` 
- **MongoDB**: `4.198.153.55:9017/cafe`

No new databases are created - it connects to your existing ones.
