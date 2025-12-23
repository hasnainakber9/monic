#!/bin/bash

# SEIC M&E Platform - Azure Deployment Script
# This script deploys the complete application to Azure
# Prerequisites: Azure CLI, Docker, Node.js, .NET 6+

set -e

echo "🚀 SEIC M&E Platform - Azure Deployment"
echo "========================================"

# Configuration
RESOURCE_GROUP="rg-seic-platform"
APP_NAME="seic-me-platform"
LOCATION="eastasia"  # Closest to Karachi
SQLSERVER_NAME="seic-sql-server"
SQLDB_NAME="SEICDatabase"
APP_SERVICE_PLAN="asp-seic-platform"
CONTAINER_REGISTRY="seicplatformacr"

echo ""
echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"
echo "  Location: $LOCATION"
echo "  SQL Server: $SQLSERVER_NAME"
echo ""

# 1. Create Resource Group
echo "1️⃣  Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# 2. Create SQL Server and Database
echo "2️⃣  Creating SQL Server and Database..."
az sql server create \
  --resource-group $RESOURCE_GROUP \
  --name $SQLSERVER_NAME \
  --location $LOCATION \
  --admin-user seicadmin \
  --admin-password $(openssl rand -base64 16)

az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQLSERVER_NAME \
  --name $SQLDB_NAME \
  --edition Standard \
  --capacity 10 \
  --collation SQL_Latin1_General_CP1_CI_AS

echo "  ✅ SQL Database created"

# 3. Create App Service Plan
echo "3️⃣  Creating App Service Plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux

echo "  ✅ App Service Plan created"

# 4. Create Web App
echo "4️⃣  Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_NAME \
  --runtime "DOTNETCORE|6.0" \
  --deployment-local-git

echo "  ✅ Web App created"

# 5. Create Azure Container Registry
echo "5️⃣  Creating Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_REGISTRY \
  --sku Basic

echo "  ✅ Container Registry created"

# 6. Configure Application Settings
echo "6️⃣  Configuring Application Settings..."

SQL_CONNECTION_STRING="Server=tcp:${SQLSERVER_NAME}.database.windows.net,1433;Initial Catalog=${SQLDB_NAME};Persist Security Info=False;User ID=seicadmin;Password=$(az sql server show --resource-group $RESOURCE_GROUP --name $SQLSERVER_NAME --query administratorLoginPassword);MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    "ConnectionStrings__DefaultConnection=$SQL_CONNECTION_STRING" \
    "SendGrid__ApiKey=$SENDGRID_API_KEY" \
    "SendGrid__FromEmail=noreply@seic.pk" \
    "AppUrl=https://${APP_NAME}.azurewebsites.net" \
    "ASPNETCORE_ENVIRONMENT=Production"

echo "  ✅ Application settings configured"

# 7. Configure CORS
echo "7️⃣  Configuring CORS..."
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --allowed-origins "https://${APP_NAME}.azurewebsites.net" "https://localhost:3000"

echo "  ✅ CORS configured"

# 8. Enable HTTPS
echo "8️⃣  Enabling HTTPS..."
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --https-only true

echo "  ✅ HTTPS enabled"

# 9. Build and Push Docker Image
echo "9️⃣  Building Docker image..."
az acr build \
  --registry $CONTAINER_REGISTRY \
  --image ${APP_NAME}:latest \
  --file Dockerfile .

echo "  ✅ Docker image pushed"

# 10. Deploy Application
echo "🔟 Deploying application..."
az webapp deployment slot create \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --slot staging

echo "  ✅ Staging slot created"

# 11. Run Database Migrations
echo "1️⃣1️⃣  Running database migrations..."
sqlcmd -S ${SQLSERVER_NAME}.database.windows.net -d $SQLDB_NAME \
  -U seicadmin -P "$SQLPASSWORD" \
  -i WEB/Data/Migrations/20251223_InitialSchema.sql

echo "  ✅ Database migrations completed"

# 12. Configure Monitoring
echo "1️⃣2️⃣  Configuring monitoring..."
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --name "${APP_NAME}-cpu-alert" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m

echo "  ✅ Monitoring configured"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📍 Application URL: https://${APP_NAME}.azurewebsites.net"
echo "📍 SQL Server: ${SQLSERVER_NAME}.database.windows.net"
echo "📍 Container Registry: ${CONTAINER_REGISTRY}.azurecr.io"
echo ""
echo "🔐 Next Steps:"
echo "  1. Retrieve SQL password: az sql server show --resource-group $RESOURCE_GROUP --name $SQLSERVER_NAME"
echo "  2. Configure SendGrid API key in Application Settings"
echo "  3. Enable GitHub Actions for CI/CD"
echo "  4. Configure custom domain and SSL certificate"
echo "  5. Set up backup strategy for SQL database"
echo ""
