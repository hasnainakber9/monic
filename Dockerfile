# SEIC M&E Platform - Multi-stage Docker Build
# Stage 1: Build frontend with Node.js
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY WEB/ClientApp/package*.json ./
RUN npm install

COPY WEB/ClientApp/ ./
RUN npm run build

# Stage 2: Build backend with .NET
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS backend-builder

WORKDIR /app/backend

COPY WEB/*.csproj ./
RUN dotnet restore

COPY WEB/ ./
RUN dotnet build -c Release -o out
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0

WORKDIR /app

# Install Node.js for any runtime JavaScript needs
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy published backend
COPY --from=backend-builder /app/publish .

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /app/ClientApp/dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Set environment
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["dotnet", "WEB.dll"]
