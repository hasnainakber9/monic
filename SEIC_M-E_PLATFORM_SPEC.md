# SEIC Monitoring & Evaluation Platform Specification

## Overview

The SEIC M&E Platform is a comprehensive monitoring, evaluation, and reporting system built into the Monic framework to replace manual Google Forms, Excel sheets, and disparate data collection processes. It implements the **SEIC Monitoring Manual v1.2** framework based on International Federation of Red Cross (IFRC) Results-Based Management (RBM) standards.

**Status:** SEIC Customization Branch - First Implementation Phase
**Date:** December 23, 2025

---

## Architecture Overview

### Tech Stack
- **Backend:** ASP.NET Core 6.0+ (C#)
- **Frontend:** React (in `WEB/ClientApp`)
- **Database:** SQL Server (via Entity Framework Core)
- **API Protocol:** RESTful JSON

### Module Structure

```
WEB/
├── Models/
│   └── SEICModels.cs (Core M&E data models)
├── Controllers/
│   ├── SEICStartupController.cs (Startup Registry - PulseMasterDB)
│   ├── SEICMonthlyReportController.cs (Monthly Reporting Portal)
│   ├── SEICHealthCheckController.cs (Quarterly Health Checks)
│   ├── SEICIncidentReportController.cs (Code of Conduct Incidents)
│   ├── SEICGrantPipelineController.cs (Grant & Funding Tracking)
│   └── SEICDashboardController.cs (Director Dashboard)
```

---

## Core Data Models

### 1. StartupProfile (PulseMasterDB Equivalent)

**Purpose:** Master registry of all incubated startups

**Key Fields:**
- `StartupName`: Legal company name
- `Cohort`: "Cohort 1", "Cohort 2", etc.
- `Sector`: "FinTech", "HealthTech", "AgriTech", etc.
- `Stage`: "Idea", "MVP", "Beta", "Early Traction", "Scaling"
- `Status`: "Active", "Graduated", "Exited", "On Probation"
- `LeadMentorName`: Primary assigned mentor
- `EnrollmentDate`, `GraduationDate`
- **Baseline Data:** Initial revenue, burn rate, team size (for benchmarking)

**Endpoints:**
- `GET /api/seicstartup` - List all startups (with filters)
- `GET /api/seicstartup/{id}` - Get startup profile with all linked data
- `POST /api/seicstartup` - Register new startup
- `PUT /api/seicstartup/{id}` - Update startup details
- `PATCH /api/seicstartup/{id}/status` - Change startup status
- `GET /api/seicstartup/cohort/{cohort}` - Get all startups in cohort

---

### 2. MonthlyProgressReport (The Pulse)

**Purpose:** Replaces Google Forms for monthly reporting (due 20th of month)

**Key Fields:**

**Financial (Section 2):**
- `MonthlyRevenuePKR`: Income realized this month
- `MonthlBurnRatePKR`: Total operational costs
- `CurrentRunwayMonths`: Months of operation with current cash
- `NewFundingReceivedPKR`: Funds received this month

**Operational (Section 3):**
- `FullTimeEmployees`: Number on payroll
- `PartTimeInterns`: Contract staff
- `ActiveCustomersUsers`: DAU/MAU/Paying clients
- `PhysicalAttendanceRating`: 1-5 (SEIC facility utilization)

**Strategic (Section 4):**
- `TechnologyReadinessLevel`: "TRL 1-2" through "TRL 9"
- `KeyMilestoneAchieved`: 2-3 sentence summary
- `TopChallenge`: Current blockers/risks

**Support Needs (Section 5):**
- Boolean flags for each need type (grant funding, government regulatory, etc.)

**Endpoints:**
- `GET /api/seicmonthlyreport/{startupId}/latest` - Most recent report
- `GET /api/seicmonthlyreport/{startupId}/history` - All historical reports
- `GET /api/seicmonthlyreport/{startupId}/{year}/{month}` - Specific month
- `POST /api/seicmonthlyreport` - Submit new report
- `PUT /api/seicmonthlyreport/{id}` - Update draft
- `PATCH /api/seicmonthlyreport/{id}/submit` - Finalize submission
- `GET /api/seicmonthlyreport/pending/overdue` - Get non-reporting startups
- `POST /api/seicmonthlyreport/bulk` - Batch import (admin)

**Validations:**
- Duplicate prevention (one report per startup per month)
- Burn rate cannot be negative
- Runway 0-60 months only
- Prevents modification after submission

---

### 3. HealthCheckAssessment (Quarterly Formative Evaluation)

**Purpose:** 360-degree quarterly assessment with GREEN/AMBER/RED status

**Status Mapping:**
- **GREEN:** Logframe completion ≥80% - On Track
- **AMBER:** Logframe completion 50-80% - Needs Support
- **RED:** Logframe completion <50% - At Risk (3-month remediation deadline)

**Five Evaluation Criteria (IFRC Standard):**
1. **Relevance:** Do SEIC services meet actual needs?
2. **Effectiveness:** Did startup achieve its objectives?
3. **Efficiency:** Was result achieved economically?
4. **Impact:** What long-term difference was made?
5. **Sustainability:** Can startup survive without SEIC support?

**Key Fields:**
- `LogframeCompletionPercentage`: 0-100
- `OverallStatus`: Auto-calculated based on completion
- `RemediationPlan`: Required for AMBER/RED
- `RemediationDeadline`: 3 months from assessment for RED
- `LeadMentorFeedback`, `OperationsManagerFeedback`

**Endpoints:**
- `GET /api/seichealthcheck/{startupId}/latest` - Most recent
- `GET /api/seichealthcheck/{startupId}/history` - Quarterly trend
- `GET /api/seichealthcheck/status/red-flagged` - All RED startups
- `GET /api/seichealthcheck/dashboard/status-summary` - Cohort overview
- `POST /api/seichealthcheck` - Create new assessment
- `PUT /api/seichealthcheck/{id}` - Update assessment
- `PATCH /api/seichealthcheck/{id}/submit` - Finalize
- `POST /api/seichealthcheck/{startupId}/escalate-red` - Escalate to Director

---

### 4. IncidentReport (Code of Conduct)

**Purpose:** Replaces Google Form for ethics/harassment/fraud reporting

**Anonymous Reporting:**
- Supported with protection from retaliation
- All reports confidential
- Acknowledged within 2 business days
- Initial review within 7 days

**Fields:**
- `IncidentDescription`, `InvolvedParties`, `Witnesses`, `SupportingEvidence`
- `IncidentDate`, `IncidentTime`, `IncidentLocation`
- `IncidentCategory`: "Harassment", "Discrimination", "IP Violation", "Fraud", "Confidentiality Breach", etc.
- `Severity`: "Low", "Medium", "High", "Critical"
- `IsAnonymous`: Boolean
- `Status`: "Reported" → "Under Review" → "Resolved" → "Closed"
- `InvestigationNotes`, `Resolution`

**Endpoints:**
- `GET /api/seicincidentreport` - All reports (admin)
- `GET /api/seicincidentreport/{id}` - Ethics Committee only
- `POST /api/seicincidentreport` - Submit new report (anonymous OK)
- `PATCH /api/seicincidentreport/{id}/acknowledge` - Within 2 business days
- `PUT /api/seicincidentreport/{id}/investigate` - Add investigation notes
- `PATCH /api/seicincidentreport/{id}/resolve` - Record resolution
- `GET /api/seicincidentreport/analytics/dashboard` - Incident trends
- `GET /api/seicincidentreport/critical/active` - Unresolved critical

---

### 5. GrantApplication (Funding Pipeline)

**Purpose:** Track all grant opportunities and donor relationships

**Stage Progression:**
1. **Identified** - Opportunity found
2. **Application Submitted** - Waiting for review
3. **Shortlisted** - Made it through screening
4. **Won** - Funding secured
5. **Rejected** - Not approved

**Fields:**
- `DonorName`: "World Bank", "USAID", etc.
- `ProgramName`: Specific fund/program
- `AmountUSD`: Value of opportunity
- `Deadline`: Application deadline
- `Stage`: Current stage
- `ProbabilityPercentage`: 0-100 (updated as progresses)
- `OwnerName`: SEIC team member responsible

**Endpoints:**
- `GET /api/seicgrantpipeline` - All grants
- `GET /api/seicgrantpipeline/{startupId}/applications` - Startup's grants
- `GET /api/seicgrantpipeline/status/upcoming` - Next 30 days
- `GET /api/seicgrantpipeline/analytics/pipeline` - Pipeline health
- `POST /api/seicgrantpipeline` - Add grant
- `PUT /api/seicgrantpipeline/{id}` - Update
- `PATCH /api/seicgrantpipeline/{id}/advance` - Move to next stage
- `PATCH /api/seicgrantpipeline/{id}/reject` - Mark rejected

---

### 6. Supporting Models

**BeneficiaryFeedback** (Quarterly BCM Surveys)
- Access, Use, Satisfaction ratings (1-5)
- Qualitative feedback on mentorship, curriculum, facilities

**AlumniTracking** (3-Year Post-Graduation)
- Survival status, employment, funding outcomes
- Learning insights for curriculum improvement

**MentorFeedbackLog** (Session Tracking)
- Mentor ratings, action items, follow-up tracking

---

## Dashboard API

### Executive Summary

**Endpoint:** `GET /api/seicdashboard/executive-summary`

**Returns:**
```json
{
  "Timestamp": "2025-12-23T10:30:00Z",
  "Section1_StartupRegistry": {
    "TotalStartups": 20,
    "ActiveStartups": 18,
    "GraduatedStartups": 2,
    "ExitedStartups": 0,
    "OnProbation": 0
  },
  "Section2_PulseFinancials": {
    "CurrentMonthMetrics": {
      "MonthlyRevenuePKR": 2500000,
      "MonthlyBurnRatePKR": 3200000,
      "ReportingRate": 90.0
    },
    "YTDMetrics": {
      "YTDRevenuePKR": 15000000,
      "YTDBurnRatePKR": 28000000,
      "YTDFundingRaisedPKR": 50000000
    },
    "RevenueGrowth": 13.64
  },
  "Section3_ImpactMetrics": {
    "TotalEmployeesCreated": 135,
    "TotalCustomersAcquired": 8500,
    "AverageBurnRate": 1555555.56,
    "AverageRunway": 8.5
  },
  "Section4_HealthStatus": {
    "TotalAssessed": 18,
    "Green": 12,
    "Amber": 4,
    "Red": 2,
    "GreenPercentage": 66.67,
    "AmberPercentage": 22.22,
    "RedPercentage": 11.11
  },
  "Section5_GrantPipeline": {
    "TotalOpportunities": 15,
    "TotalValueUSD": 1500000,
    "GrantsWonUSD": 300000,
    "SuccessRatePercentage": 20.0
  },
  "Section6_RiskManagement": {
    "TotalIncidents": 3,
    "CriticalUnresolved": 0,
    "ResolutionRate": 100.0
  }
}
```

**Key Analytics:**
- `GET /api/seicdashboard/cohort/{cohort}/performance` - Cohort-specific metrics
- `GET /api/seicdashboard/stage-distribution` - TRL distribution
- `GET /api/seicdashboard/sector-performance` - Performance by sector
- `GET /api/seicdashboard/needs-analysis` - Support needs summary

---

## Reporting Framework

### Monthly Internal Report (SITREP)
- For SEIC management
- Highlights red flags, operational bottlenecks
- Derived from: Monthly Reports + Health Checks + Incidents

### Bi-Annual Donor Report
- For Government/Donors
- Outcomes vs. Budget Variance Analysis
- Derived from: Dashboard + Grant Pipeline + Alumni data

### Annual Impact Report
- Public-facing
- Success stories, ecosystem impact
- Jobs created, capital raised, revenue generated

---

## Integration Requirements

### Database Migration
1. Run EF Core migrations to create SEIC tables
2. Seed baseline cohort data
3. Import historical Excel data via bulk endpoints

### Frontend Components
1. Startup Registry (CRUD interface)
2. Monthly Report Form (replaces Google Form)
3. Health Check Assessment Workflow
4. Incident Report Portal
5. Grant Pipeline Tracker
6. Executive Dashboard (charts, KPIs)
7. Red Flag Alert System (for RED startups)

### Email Notifications
- Deadline reminders (Monthly report due 20th)
- Health check alerts (RED status)
- Critical incident escalation
- Grant deadline alerts

---

## Data Privacy & Security

- All sensitive startup financial data restricted to ME Manager & Director
- Anonymous incident reporting protected
- No retaliation against whistleblowers
- SEIC materials (templates, curriculum) remain SEIC IP
- Startup proprietary data encrypted

---

## Next Steps

1. **Database Configuration:**
   - Add SEIC models to ApplicationContext
   - Create and run migrations

2. **Frontend Implementation:**
   - React components for each module
   - Dashboard with Recharts/Chart.js
   - Form validations and error handling

3. **Email Integration:**
   - SendGrid/Office365 for notifications
   - Template engine for reports

4. **Testing:**
   - Unit tests for controllers
   - Integration tests for data flows
   - Load testing for dashboard queries

5. **Deployment:**
   - Azure SQL database
   - Azure App Service
   - CI/CD pipeline via GitHub Actions

---

## References

- SEIC Monitoring Manual v1.2
- SEIC Incubation Agreement v1.3
- SEIC M&E Excel Workbook
- IFRC Results-Based Management Framework

---

**Maintainer:** Hasnain Akber (hasnainakber9@github.com)
**Last Updated:** December 23, 2025
