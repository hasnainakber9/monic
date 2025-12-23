using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WEB.Models
{
    /// <summary>
    /// SEIC Monitoring & Evaluation Platform Models
    /// Based on SEIC Monitoring Manual v1.2, Incubation Agreement, and M&E Excel workbook
    /// </summary>

    /// <summary>
    /// Startup/Incubatee profile - PulseMasterDB equivalent
    /// </summary>
    public class StartupProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string StartupName { get; set; }

        [StringLength(200)]
        public string PrimaryFounderName { get; set; }

        [StringLength(200)]
        public string PrimaryFounderEmail { get; set; }

        [StringLength(20)]
        public string PrimaryFounderPhone { get; set; }

        [StringLength(200)]
        public string SecondaryFounderName { get; set; }

        [StringLength(100)]
        public string Sector { get; set; } // e.g., "FinTech", "HealthTech", "AgriTech"

        [StringLength(50)]
        public string Stage { get; set; } // "Idea", "MVP", "Beta", "Early Traction", "Scaling"

        [StringLength(50)]
        public string Cohort { get; set; } // e.g., "Cohort 1", "Cohort 2"

        public int? Batch { get; set; }

        public DateTime EnrollmentDate { get; set; }

        [StringLength(50)]
        public string Status { get; set; } // "Active", "Graduated", "Exited", "On Probation"

        public DateTime? GraduationDate { get; set; }

        [StringLength(200)]
        public string LeadMentorName { get; set; }

        public string ProblemStatement { get; set; }
        public string SolutionDescription { get; set; }
        public string TargetMarket { get; set; }

        // Baseline Data (from Need Assessment)
        public decimal? InitialRevenue { get; set; }
        public decimal? InitialCashBurn { get; set; }
        public int? InitialTeamSize { get; set; }
        public DateTime? BaselineDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual List<MonthlyProgressReport> MonthlyReports { get; set; } = new();
        public virtual List<HealthCheckAssessment> HealthChecks { get; set; } = new();
        public virtual List<GrantApplication> GrantApplications { get; set; } = new();
    }

    /// <summary>
    /// Monthly Progress Report (replaces Google Form)
    /// Based on SEIC Monthly Startup Progress Report standardized form
    /// </summary>
    public class MonthlyProgressReport
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        public int ReportingMonth { get; set; } // 1-12
        public int ReportingYear { get; set; }

        public DateTime SubmittedDate { get; set; } = DateTime.UtcNow;

        // Section 2: Financial Performance
        public decimal MonthlyRevenuePKR { get; set; } = 0; // 0 if pre-revenue
        public decimal MonthlBurnRatePKR { get; set; } // Total operational costs
        public int CurrentRunwayMonths { get; set; } // How many months can operate with current cash
        public decimal NewFundingReceivedPKR { get; set; } = 0;

        // Section 3: Operational Metrics & Impact
        public int FullTimeEmployees { get; set; }
        public int PartTimeInterns { get; set; }
        public int ActiveCustomersUsers { get; set; } // DAU/MAU or paying clients
        public int PhysicalAttendanceRating { get; set; } // 1-5: 1=once/week, 5=all working days

        // Section 4: Strategic Progress
        [StringLength(50)]
        public string TechnologyReadinessLevel { get; set; } // TRL 1-2, 3-4, 5-6, 7-8, or 9

        [StringLength(500)]
        public string KeyMilestoneAchieved { get; set; }

        [StringLength(500)]
        public string TopChallenge { get; set; }

        // Section 5: Support Needs (checkboxes in original)
        public bool NeedsGrantFundingSupport { get; set; }
        public bool NeedsGovernmentRegulatory { get; set; }
        public bool NeedsTechnicalMentorship { get; set; }
        public bool NeedsLegalIPAdvice { get; set; }
        public bool NeedsMarketingConnections { get; set; }

        public bool IsSubmitted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Quarterly Health Check Assessment (formative evaluation)
    /// Based on Health Check scoring: GREEN (80%+), AMBER (50-80%), RED (<50%)
    /// </summary>
    public class HealthCheckAssessment
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
        public int Quarter { get; set; } // 1-4
        public int Year { get; set; }

        [StringLength(50)]
        public string OverallStatus { get; set; } // "GREEN", "AMBER", "RED"

        public decimal LogframeCompletionPercentage { get; set; } // 0-100

        [StringLength(500)]
        public string RelevanceAssessment { get; set; } // Do SEIC services meet needs?
        [StringLength(500)]
        public string EffectivenessAssessment { get; set; } // Did startup achieve objectives?
        [StringLength(500)]
        public string EfficiencyAssessment { get; set; } // Cost-per-result achieved?
        [StringLength(500)]
        public string ImpactAssessment { get; set; } // Long-term difference made?
        [StringLength(500)]
        public string SustainabilityAssessment { get; set; } // Can startup survive without SEIC support?

        [StringLength(200)]
        public string LeadMentorFeedback { get; set; }
        [StringLength(200)]
        public string OperationsManagerFeedback { get; set; }

        [StringLength(500)]
        public string RemediationPlan { get; set; } // For AMBER/RED startups
        public DateTime? RemediationDeadline { get; set; } // 3 months for red-flagged

        public bool IsSubmitted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Code of Conduct Incident Report
    /// Based on SEIC Code of Conduct Incident Report form
    /// </summary>
    public class IncidentReport
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(500)]
        public string IncidentDescription { get; set; }

        public string InvolvedParties { get; set; } // Comma-separated names
        public string Witnesses { get; set; } // Comma-separated names
        public string SupportingEvidence { get; set; } // Description of evidence

        public DateTime IncidentDate { get; set; }
        public TimeSpan? IncidentTime { get; set; }
        [StringLength(200)]
        public string IncidentLocation { get; set; }

        [StringLength(50)]
        public string IncidentCategory { get; set; } // "Harassment", "Discrimination", "IP Violation", etc.

        [StringLength(50)]
        public string Severity { get; set; } // "Low", "Medium", "High", "Critical"

        public bool IsAnonymous { get; set; }
        [StringLength(200)]
        public string ReporterName { get; set; }
        [StringLength(200)]
        public string ReporterEmail { get; set; }
        [StringLength(20)]
        public string ReporterPhone { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Reported"; // "Reported", "Under Review", "Resolved", "Closed"

        [StringLength(500)]
        public string InvestigationNotes { get; set; }
        [StringLength(500)]
        public string Resolution { get; set; }

        public DateTime ReportedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Grant/Donor Pipeline Tracker
    /// Based on GrantPipeline sheet in M&E Excel
    /// </summary>
    public class GrantApplication
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        [Required]
        [StringLength(200)]
        public string DonorName { get; set; }

        [StringLength(200)]
        public string ProgramName { get; set; }

        public decimal AmountUSD { get; set; }
        public DateTime? Deadline { get; set; }

        [StringLength(50)]
        public string Stage { get; set; } // "Identified", "Application Submitted", "Shortlisted", "Won", "Rejected"

        public decimal ProbabilityPercentage { get; set; } // 0-100

        [StringLength(200)]
        public string OwnerName { get; set; } // SEIC team member responsible

        [StringLength(500)]
        public string Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Beneficiary Contact Monitoring (BCM) feedback
    /// Quarterly surveys on Access, Use, Satisfaction
    /// </summary>
    public class BeneficiaryFeedback
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        public DateTime SurveyDate { get; set; } = DateTime.UtcNow;
        public int Quarter { get; set; }
        public int Year { get; set; }

        // BCM Indicators: 1-5 scale
        public int AccessRating { get; set; } // Can they access mentors/facilities when needed?
        public int UtilizationRating { get; set; } // Are they actually using provided resources?
        public int SatisfactionRating { get; set; } // Quality of mentorship and curriculum

        [StringLength(500)]
        public string MentorshipQualityComments { get; set; }
        [StringLength(500)]
        public string CurriculumRelevanceComments { get; set; }
        [StringLength(500)]
        public string FacilitiesComments { get; set; }
        [StringLength(500)]
        public string OverallFeedback { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Alumni Tracking for 3-year post-graduation monitoring
    /// </summary>
    public class AlumniTracking
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        public int YearsSinceGraduation { get; set; } // 1, 2, or 3
        public DateTime SurveyDate { get; set; } = DateTime.UtcNow;

        public bool IsStillOperating { get; set; }
        public decimal? CurrentAnnualRevenuePKR { get; set; }
        public int CurrentEmployeeCount { get; set; }
        public decimal? FollowOnFundingReceivedPKR { get; set; }
        public int JobsCreatedPostGraduation { get; set; }

        [StringLength(500)]
        public string KeySuccessFactors { get; set; }
        [StringLength(500)]
        public string ChallengesFaced { get; set; }
        [StringLength(500)]
        public string SEICImpactAssessment { get; set; } // How valuable was SEIC support?

        [StringLength(50)]
        public string Status { get; set; } // "Operating", "Merged", "Acquired", "Closed"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Mentor Feedback Log - session ratings and action items
    /// Based on OpsMentorFeedback sheet
    /// </summary>
    public class MentorFeedbackLog
    {
        [Key]
        public int Id { get; set; }

        public int StartupProfileId { get; set; }
        public virtual StartupProfile StartupProfile { get; set; }

        [StringLength(200)]
        public string MentorName { get; set; }

        public DateTime SessionDate { get; set; } = DateTime.UtcNow;
        [StringLength(100)]
        public string SessionType { get; set; } // "One-on-One", "Workshop", "Group Mentoring"

        public int Rating { get; set; } // 1-5 scale

        [StringLength(500)]
        public string KeyIssuesDiscussed { get; set; }
        [StringLength(500)]
        public string ActionItems { get; set; }

        public DateTime? FollowUpDate { get; set; }
        public bool IsFollowUpCompleted { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
