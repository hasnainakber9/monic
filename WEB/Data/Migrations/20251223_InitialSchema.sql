-- SEIC M&E Platform - Initial Schema Migration
-- Date: December 23, 2025
-- This creates all necessary tables for the M&E platform

USE [SEICDatabase];
GO

-- ============================================
-- TABLE: Users & Authentication
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        Name NVARCHAR(255) NOT NULL,
        Role NVARCHAR(50) NOT NULL CHECK (Role IN ('ADMIN', 'MANAGER', 'STARTUP', 'VIEWER')),
        Organization NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        LastLoginDate DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Users_Email ON Users(Email);
    CREATE INDEX IX_Users_Role ON Users(Role);
    PRINT 'Created table: Users';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id) ON DELETE CASCADE,
        Token NVARCHAR(MAX) NOT NULL,
        ExpiryDate DATETIME2 NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        RevokedAt DATETIME2 NULL
    );
    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
    PRINT 'Created table: RefreshTokens';
END
GO

-- ============================================
-- TABLE: Audit Logging
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) ON DELETE SET NULL,
        Action NVARCHAR(255) NOT NULL,
        EntityType NVARCHAR(100) NOT NULL,
        EntityId UNIQUEIDENTIFIER,
        OldValues NVARCHAR(MAX),
        NewValues NVARCHAR(MAX),
        IPAddress NVARCHAR(50),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
    CREATE INDEX IX_AuditLogs_CreatedAt ON AuditLogs(CreatedAt);
    CREATE INDEX IX_AuditLogs_EntityType ON AuditLogs(EntityType);
    PRINT 'Created table: AuditLogs';
END
GO

-- ============================================
-- TABLE: Startup Profiles
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StartupProfiles')
BEGIN
    CREATE TABLE StartupProfiles (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CompanyName NVARCHAR(255) NOT NULL,
        FounderName NVARCHAR(255) NOT NULL,
        FounderEmail NVARCHAR(255) NOT NULL,
        FounderPhone NVARCHAR(20),
        Sector NVARCHAR(100),
        FoundedDate DATE,
        Cohort NVARCHAR(50),
        Status NVARCHAR(50) NOT NULL CHECK (Status IN ('ACTIVE', 'GRADUATED', 'EXITED', 'PROBATION')) DEFAULT 'ACTIVE',
        HeadquartersCity NVARCHAR(100),
        Description NVARCHAR(MAX),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_StartupProfiles_Cohort ON StartupProfiles(Cohort);
    CREATE INDEX IX_StartupProfiles_Status ON StartupProfiles(Status);
    CREATE INDEX IX_StartupProfiles_Sector ON StartupProfiles(Sector);
    PRINT 'Created table: StartupProfiles';
END
GO

-- ============================================
-- TABLE: Monthly Reports
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'MonthlyReports')
BEGIN
    CREATE TABLE MonthlyReports (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        StartupProfileId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES StartupProfiles(Id),
        ReportingMonth INT NOT NULL CHECK (ReportingMonth >= 1 AND ReportingMonth <= 12),
        ReportingYear INT NOT NULL,
        MonthlyRevenuePKR DECIMAL(18, 2) DEFAULT 0,
        MonthlyBurnRatePKR DECIMAL(18, 2) DEFAULT 0,
        CurrentRunwayMonths DECIMAL(10, 1) DEFAULT 0,
        NewFundingReceivedPKR DECIMAL(18, 2) DEFAULT 0,
        FullTimeEmployees INT DEFAULT 0,
        PartTimeInterns INT DEFAULT 0,
        ActiveCustomersUsers INT DEFAULT 0,
        PhysicalAttendanceRating INT CHECK (PhysicalAttendanceRating >= 1 AND PhysicalAttendanceRating <= 5),
        TechnologyReadinessLevel NVARCHAR(20),
        KeyMilestoneAchieved NVARCHAR(500),
        TopChallenge NVARCHAR(500),
        SupportNeeds_Grant BIT DEFAULT 0,
        SupportNeeds_Government BIT DEFAULT 0,
        SupportNeeds_Technical BIT DEFAULT 0,
        SupportNeeds_Legal BIT DEFAULT 0,
        SupportNeeds_Marketing BIT DEFAULT 0,
        SubmissionStatus NVARCHAR(50) DEFAULT 'DRAFT' CHECK (SubmissionStatus IN ('DRAFT', 'SUBMITTED', 'OVERDUE')),
        SubmittedDate DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE UNIQUE INDEX IX_MonthlyReports_Unique ON MonthlyReports(StartupProfileId, ReportingMonth, ReportingYear);
    CREATE INDEX IX_MonthlyReports_SubmissionStatus ON MonthlyReports(SubmissionStatus);
    PRINT 'Created table: MonthlyReports';
END
GO

-- ============================================
-- TABLE: Health Checks
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'HealthChecks')
BEGIN
    CREATE TABLE HealthChecks (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        StartupProfileId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES StartupProfiles(Id),
        AssessmentDate DATE NOT NULL,
        FinancialHealthScore INT CHECK (FinancialHealthScore >= 1 AND FinancialHealthScore <= 5),
        OperationalHealthScore INT CHECK (OperationalHealthScore >= 1 AND OperationalHealthScore <= 5),
        MarketTractionScore INT CHECK (MarketTractionScore >= 1 AND MarketTractionScore <= 5),
        TeamCapabilityScore INT CHECK (TeamCapabilityScore >= 1 AND TeamCapabilityScore <= 5),
        ComplianceScore INT CHECK (ComplianceScore >= 1 AND ComplianceScore <= 5),
        OverallStatus NVARCHAR(20) NOT NULL CHECK (OverallStatus IN ('GREEN', 'AMBER', 'RED')),
        StatusJustification NVARCHAR(1000) NOT NULL,
        Strengths NVARCHAR(500),
        Concerns NVARCHAR(500),
        RecommendedInterventions NVARCHAR(500),
        IsEscalated BIT DEFAULT 0,
        EscalationNote NVARCHAR(1000),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_HealthChecks_StartupId ON HealthChecks(StartupProfileId);
    CREATE INDEX IX_HealthChecks_Status ON HealthChecks(OverallStatus);
    PRINT 'Created table: HealthChecks';
END
GO

-- ============================================
-- TABLE: Incident Reports
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IncidentReports')
BEGIN
    CREATE TABLE IncidentReports (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ReferenceId NVARCHAR(20) NOT NULL UNIQUE,
        IncidentTitle NVARCHAR(255) NOT NULL,
        IncidentDescription NVARCHAR(MAX) NOT NULL,
        IncidentDate DATE NOT NULL,
        IncidentLocation NVARCHAR(255),
        ViolationType NVARCHAR(100) NOT NULL,
        Severity NVARCHAR(20) NOT NULL CHECK (Severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        InvolvedPartiesDescription NVARCHAR(500),
        WitnessesDescription NVARCHAR(500),
        EvidenceDescription NVARCHAR(500),
        IsAnonymous BIT DEFAULT 1,
        ReporterName NVARCHAR(255),
        ReporterEmail NVARCHAR(255),
        ReporterPhone NVARCHAR(20),
        ContactPreference NVARCHAR(50) CHECK (ContactPreference IN ('EMAIL', 'PHONE', 'ANONYMOUS')),
        Status NVARCHAR(50) DEFAULT 'NEW' CHECK (Status IN ('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED')),
        ResolutionNote NVARCHAR(MAX),
        InvestigationNotes NVARCHAR(MAX),
        ResolvedDate DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_IncidentReports_ReferenceId ON IncidentReports(ReferenceId);
    CREATE INDEX IX_IncidentReports_Status ON IncidentReports(Status);
    CREATE INDEX IX_IncidentReports_Severity ON IncidentReports(Severity);
    CREATE INDEX IX_IncidentReports_CreatedAt ON IncidentReports(CreatedAt);
    PRINT 'Created table: IncidentReports';
END
GO

-- ============================================
-- TABLE: Grant Pipeline
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GrantPipelines')
BEGIN
    CREATE TABLE GrantPipelines (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        StartupProfileId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES StartupProfiles(Id),
        GrantName NVARCHAR(255) NOT NULL,
        DonorOrganization NVARCHAR(255),
        GrantValueUSD DECIMAL(15, 2),
        ApplicationDeadline DATE,
        Stage NVARCHAR(50) NOT NULL CHECK (Stage IN ('IDENTIFIED', 'SUBMITTED', 'SHORTLISTED', 'AWARDED', 'REJECTED')) DEFAULT 'IDENTIFIED',
        ApplicationNotes NVARCHAR(MAX),
        ApprovedAmount DECIMAL(15, 2),
        DisburseDate DATE,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_GrantPipelines_StartupId ON GrantPipelines(StartupProfileId);
    CREATE INDEX IX_GrantPipelines_Stage ON GrantPipelines(Stage);
    CREATE INDEX IX_GrantPipelines_Deadline ON GrantPipelines(ApplicationDeadline);
    PRINT 'Created table: GrantPipelines';
END
GO

-- ============================================
-- TABLE: Dashboard Cache (for performance)
-- ============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DashboardCache')
BEGIN
    CREATE TABLE DashboardCache (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CacheKey NVARCHAR(255) NOT NULL UNIQUE,
        CacheValue NVARCHAR(MAX),
        ExpiryDate DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_DashboardCache_CacheKey ON DashboardCache(CacheKey);
    CREATE INDEX IX_DashboardCache_ExpiryDate ON DashboardCache(ExpiryDate);
    PRINT 'Created table: DashboardCache';
END
GO

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure to get dashboard summary
IF OBJECT_ID('sp_GetDashboardSummary', 'P') IS NULL
BEGIN
    EXEC sp_executesql N'
    CREATE PROCEDURE sp_GetDashboardSummary
    AS
    BEGIN
        SELECT 
            COUNT(DISTINCT sp.Id) as TotalStartups,
            SUM(CASE WHEN sp.Status = ''ACTIVE'' THEN 1 ELSE 0 END) as ActiveStartups,
            SUM(CASE WHEN sp.Status = ''GRADUATED'' THEN 1 ELSE 0 END) as GraduatedStartups,
            SUM(CASE WHEN sp.Status = ''PROBATION'' THEN 1 ELSE 0 END) as OnProbation,
            ISNULL(SUM(mr.MonthlyRevenuePKR), 0) as TotalMonthlyRevenue,
            ISNULL(SUM(mr.MonthlyBurnRatePKR), 0) as TotalMonthlyBurn,
            ISNULL(SUM(mr.FullTimeEmployees), 0) as TotalEmployees,
            ISNULL(SUM(mr.ActiveCustomersUsers), 0) as TotalCustomers
        FROM StartupProfiles sp
        LEFT JOIN MonthlyReports mr ON sp.Id = mr.StartupProfileId 
            AND mr.ReportingMonth = MONTH(GETUTCDATE()) 
            AND mr.ReportingYear = YEAR(GETUTCDATE())
    END
    ';
    PRINT 'Created procedure: sp_GetDashboardSummary';
END
GO

-- Procedure to get health check summary
IF OBJECT_ID('sp_GetHealthCheckSummary', 'P') IS NULL
BEGIN
    EXEC sp_executesql N'
    CREATE PROCEDURE sp_GetHealthCheckSummary
    AS
    BEGIN
        SELECT 
            COUNT(*) as TotalAssessed,
            SUM(CASE WHEN OverallStatus = ''GREEN'' THEN 1 ELSE 0 END) as GreenCount,
            SUM(CASE WHEN OverallStatus = ''AMBER'' THEN 1 ELSE 0 END) as AmberCount,
            SUM(CASE WHEN OverallStatus = ''RED'' THEN 1 ELSE 0 END) as RedCount
        FROM HealthChecks
        WHERE AssessmentDate >= DATEADD(QUARTER, -1, GETUTCDATE())
    END
    ';
    PRINT 'Created procedure: sp_GetHealthCheckSummary';
END
GO

PRINT 'Migration completed successfully!';
GO
