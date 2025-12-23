# 🎯 SEIC M&E Platform - Monitoring & Evaluation System

> A comprehensive, production-ready full-stack Monitoring & Evaluation platform for SEIC (Sindh Entrepreneurship & Innovation Council) replacing Google Forms with structured, data-driven workflows.

[![GitHub](https://img.shields.io/badge/GitHub-hasnainakber9%2Fmonic-blue)](https://github.com/hasnainakber9/monic)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](#status)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- .NET 6+
- SQL Server 2019+
- Docker (for containerized deployment)
- Azure CLI (for Azure deployment)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/hasnainakber9/monic.git
cd monic

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Backend setup
cd WEB
dotnet restore
dotnet build

# 4. Database setup
# Update connection string in appsettings.json
sqlcmd -S localhost -d SEICDatabase -i Data/Migrations/20251223_InitialSchema.sql

# 5. Frontend setup
cd ClientApp
npm install
npm run dev

# 6. Start backend (from WEB directory)
dotnet run

# 7. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# API Docs: http://localhost:5000/swagger
```

---

## ✨ Features

### 📊 Monthly Progress Reports
- **5-section multi-step form** with progress tracking
- **Financial tracking**: Revenue, burn rate, runway, new funding
- **Operational metrics**: Team size, customers, physical attendance
- **Strategic progress**: Milestones, challenges, technology readiness level (TRL)
- **Support needs**: Checkbox system for 5 support types (grant, govt, tech, legal, marketing)
- **Auto-deadline enforcement**: 20th of each month
- **Overdue tracking** and email reminders
- **Bulk import** capability

### 🏥 Quarterly Health Checks
- **5-dimension assessment**: Financial, Operational, Market Traction, Team Capability, Compliance
- **5-point scoring** system per dimension
- **Auto-calculated average** with visual progress bar
- **Status assignment**: GREEN (on track), AMBER (needs support), RED (at risk)
- **Automatic probation** for RED-flagged startups
- **Ethics Committee escalation** with notification
- **Intervention recommendations** framework
- **Historical tracking** for trend analysis

### 🚨 Anonymous Incident Reporting
- **Fully confidential** - Reporter identity fully protected
- **8 violation categories**: Harassment, Fraud, Abuse, Retaliation, Safety, Conflict of Interest, etc.
- **4-level severity**: LOW, MEDIUM, HIGH, CRITICAL (auto-escalates)
- **5-step guided submission** process
- **Anti-retaliation enforcement** - Automatic system alerts
- **Investigation tracking** with timeline
- **Resolution documentation** and follow-up
- **Anonymous follow-ups** possible without revealing identity

### 💰 Grant Pipeline Tracker
- **Opportunity identification** and cataloging
- **Stage tracking**: IDENTIFIED → SUBMITTED → SHORTLISTED → AWARDED
- **Deadline alerts** with automated reminders
- **Application notes** and documentation
- **Approval & disbursal tracking**
- **Pipeline analytics** and success rate calculation
- **Donor relationship management**

### 📈 Executive Dashboard
- **50+ KPI metrics** across 6 sections
- **Real-time data refresh** capability
- **Interactive charts**: Pie, bar, and line charts (Recharts)
- **Startup Registry**: Total, active, graduated, on probation
- **Financial Performance**: Revenue, burn rate, YTD metrics, growth
- **Social Impact**: Jobs created, customers acquired, runway
- **Health Status Distribution**: GREEN/AMBER/RED breakdown
- **Grant Pipeline**: Opportunities, value, success rate
- **Risk Management**: Incident tracking, resolution rate
- **Cohort Performance** breakdown
- **Sector Analysis**
- **Critical Incident Alerts**
- **RED-Flagged Startup Notifications**

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│           React Frontend (3000)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Monthly Report │ Health Check │ Incidents  │   │
│  │     Dashboard   │   Assessment │  Reporter  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────┘
               │ Axios HTTP Client
               │ JWT Bearer Token
               ▼
┌─────────────────────────────────────────────────────┐
│      .NET Core Backend (5000)                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ Auth Controller  │ Startup Controller        │   │
│  │ Email Service    │ Monthly Report Controller │   │
│  │ JWT Middleware   │ Health Check Controller   │   │
│  │ RBAC             │ Incident Controller       │   │
│  │ Audit Logging    │ Grant Pipeline Controller │   │
│  │                  │ Dashboard Controller      │   │
│  └──────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────┘
               │ SQL Queries
               │ Entity Framework
               ▼
┌─────────────────────────────────────────────────────┐
│      SQL Server Database                            │
│  ┌──────────────────────────────────────────────┐   │
│  │ Users │ StartupProfiles │ MonthlyReports    │   │
│  │ HealthChecks │ IncidentReports │ Grants    │   │
│  │ AuditLogs │ RefreshTokens │ Cache          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

          ┌─────────────────────────┐
          │   SendGrid (Email)      │
          │  - Reminders            │
          │  - Notifications        │
          │  - Escalations          │
          └─────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Form Management**: React Hook Form
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Authentication**: JWT (localStorage)
- **Testing**: Jest + React Testing Library
- **Build**: Vite/Webpack

### Backend
- **Framework**: ASP.NET Core 6
- **Language**: C#
- **ORM**: Entity Framework Core
- **Database**: SQL Server 2019+
- **Email**: SendGrid
- **Authentication**: JWT + Role-based access control
- **API Documentation**: Swagger/OpenAPI

### DevOps & Deployment
- **Containerization**: Docker (multi-stage builds)
- **CI/CD**: GitHub Actions (8 jobs)
- **Cloud**: Microsoft Azure
  - App Service (backend hosting)
  - SQL Database (data storage)
  - Container Registry (image storage)
  - Application Insights (monitoring)
- **Infrastructure as Code**: Azure CLI scripts

---

## 📁 Project Structure

```
monic/
├── WEB/                                  # .NET Backend
│   ├── Controllers/
│   │   ├── SEICStartupController.cs      # Startup registry (7 endpoints)
│   │   ├── SEICMonthlyReportController.cs# Monthly reports (8 endpoints)
│   │   ├── SEICHealthCheckController.cs  # Health checks (8 endpoints)
│   │   ├── SEICIncidentReportController.cs# Incidents (8 endpoints)
│   │   ├── SEICGrantPipelineController.cs# Grants (9 endpoints)
│   │   └── SEICDashboardController.cs    # Dashboard (5 endpoints)
│   ├── Models/SEICModels.cs              # 8 data models
│   ├── Services/
│   │   ├── EmailService.cs               # SendGrid integration
│   │   └── AuthService.cs                # JWT authentication
│   ├── Data/Migrations/
│   │   └── 20251223_InitialSchema.sql    # Database schema
│   └── appsettings.json                  # Configuration
│
├── WEB/ClientApp/                        # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MonthlyReportForm.tsx     # 5-section monthly form
│   │   │   ├── ExecutiveDashboard.tsx    # 50+ KPI dashboard
│   │   │   ├── HealthCheckForm.tsx       # 5-dimension assessment
│   │   │   └── IncidentReportForm.tsx    # Anonymous reporting
│   │   ├── services/
│   │   │   ├── seicApi.ts                # API client (100+ methods)
│   │   │   └── authService.ts            # JWT authentication
│   │   └── __tests__/
│   │       └── components/
│   │           └── MonthlyReportForm.test.tsx
│   └── package.json
│
├── deploy/
│   └── azure-deploy.sh                   # Azure deployment automation
│
├── .github/workflows/
│   └── deploy.yml                        # GitHub Actions CI/CD
│
├── Dockerfile                            # Multi-stage Docker build
├── .env.example                          # Environment template
├── SEIC_M-E_PLATFORM_SPEC.md            # Phase 1 Backend spec
├── SEIC_FRONTEND_PHASE2.md              # Phase 2 Frontend spec
├── SEIC_COMPLETE_DELIVERY.md            # Full project overview
└── README.md                             # This file
```

---

## 📡 API Documentation

### Authentication Endpoints
```bash
# Login
POST /api/auth/login
{ "email": "user@seic.pk", "password": "secure123" }
→ { "token": "jwt_token", "refreshToken": "refresh_token", "user": {...} }

# Refresh Token
POST /api/auth/refresh
{ "refreshToken": "refresh_token" }
→ { "token": "new_jwt_token" }
```

### Monthly Report Endpoints
```bash
# Submit report
POST /api/seicmonthlyreport

# Get history
GET /api/seicmonthlyreport/{startupId}/history

# Get overdue reports
GET /api/seicmonthlyreport/pending/overdue

# Bulk import
POST /api/seicmonthlyreport/bulk
```

### Health Check Endpoints
```bash
# Create assessment
POST /api/seichealthcheck

# Get red-flagged
GET /api/seichealthcheck/status/red-flagged

# Escalate
POST /api/seichealthcheck/{startupId}/escalate-red
```

### Incident Report Endpoints
```bash
# Submit anonymously
POST /api/seicincidentreport

# Get critical
GET /api/seicincidentreport/critical/active

# Resolve
PATCH /api/seicincidentreport/{id}/resolve
```

### Dashboard Endpoints
```bash
# Executive summary
GET /api/seicdashboard/executive-summary

# Cohort performance
GET /api/seicdashboard/cohort/{cohort}/performance
```

**Full API documentation available at** `/swagger` endpoint when backend is running.

---

## 🚀 Deployment

### Azure Deployment (Automated)

```bash
# 1. Set environment variables
export SENDGRID_API_KEY="your-key"
export AZURE_CREDENTIALS='{...}'

# 2. Run deployment script
bash deploy/azure-deploy.sh

# 3. Access application
# https://seic-me-platform.azurewebsites.net
```

### Docker Deployment

```bash
# Build image
docker build -t seic-platform:latest .

# Run container
docker run -p 5000:5000 \
  -e ConnectionStrings__DefaultConnection="..." \
  -e SendGrid__ApiKey="..." \
  seic-platform:latest

# Access at http://localhost:5000
```

### GitHub Actions CI/CD

Automatically triggered on:
- Push to `master` (production deployment)
- Push to `develop` (staging deployment)
- Pull requests (tests, code quality, security)

**Pipeline includes:**
1. Frontend tests & build
2. Backend tests & build
3. Code quality analysis (SonarCloud)
4. Security scanning (Trivy)
5. Docker build & push
6. Azure deployment (staging/production)
7. Database migrations
8. Slack notifications

---

## 🔐 Security

✅ **Authentication**: JWT tokens with 24-hour expiration
✅ **Authorization**: Role-based access control (ADMIN/MANAGER/STARTUP/VIEWER)
✅ **Data Protection**: HTTPS enforcement, CORS configuration, parameterized queries
✅ **Audit Trail**: Complete audit logging of all actions
✅ **Anti-Retaliation**: Automatic enforcement with incident tracking
✅ **Anonymity**: Full identity protection for incident reporters
✅ **Password Security**: Bcrypt hashing, reset mechanisms
✅ **Vulnerability Scanning**: Automated security checks in CI/CD

---

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
cd WEB/ClientApp
npm run test

# Backend tests
cd WEB
dotnet test

# Integration tests
cd WEB
dotnet test --filter Category=Integration
```

### Coverage
- Frontend: Jest + React Testing Library
- Backend: xUnit + Moq
- Target coverage: >80%

---

## 📊 Monitoring

### Azure Monitor
- CPU utilization alerts (>80%)
- Memory usage tracking
- Database connection pool monitoring
- Application Insights integration
- Custom metrics dashboard

### Logging
- Structured logging (Serilog)
- Audit trail (complete action history)
- Error tracking (Application Insights)
- Request/response logging

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices for frontend
- Follow C# naming conventions for backend
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📝 Documentation

| Document | Purpose |
|----------|----------|
| [SEIC_M-E_PLATFORM_SPEC.md](SEIC_M-E_PLATFORM_SPEC.md) | Phase 1: Backend API (52 endpoints) |
| [SEIC_FRONTEND_PHASE2.md](SEIC_FRONTEND_PHASE2.md) | Phase 2: Frontend Components |
| [SEIC_COMPLETE_DELIVERY.md](SEIC_COMPLETE_DELIVERY.md) | Full Project Delivery |
| [.env.example](.env.example) | Environment Configuration |

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hasnainakber9/monic/issues)
- **Email**: support@seic.pk
- **Slack**: #seic-platform

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Acknowledgments

- SEIC (Sindh Entrepreneurship & Innovation Council) for vision and requirements
- Open source community for incredible tools and libraries
- Development team for execution and testing

---

**🚀 Ready for Production | 100% Complete | All Phases Delivered**

*Last Updated: December 23, 2025*
