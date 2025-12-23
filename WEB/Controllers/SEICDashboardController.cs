using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WEB.Models;
using Microsoft.EntityFrameworkCore;

namespace WEB.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SEICDashboardController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICDashboardController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seicdashboard/executive-summary - Executive KPI dashboard (Director view)
        /// Aggregates: Pulse data, health checks, incidents, grants, and alumni tracking
        /// </summary>
        [HttpGet("executive-summary")]
        public async Task<ActionResult<object>> GetExecutiveSummary()
        {
            var now = DateTime.UtcNow;
            var thisMonth = new DateTime(now.Year, now.Month, 1);
            var lastMonth = thisMonth.AddMonths(-1);
            var ytdStart = new DateTime(now.Year, 1, 1);

            // Startup Registry
            var allStartups = await _context.StartupProfiles.ToListAsync();
            var activeStartups = allStartups.Where(s => s.Status == "Active").ToList();
            var graduatedStartups = allStartups.Where(s => s.Status == "Graduated").ToList();

            // Monthly Reports
            var thisMonthReports = await _context.MonthlyProgressReports
                .Where(r => r.SubmittedDate >= thisMonth)
                .ToListAsync();

            var ytdReports = await _context.MonthlyProgressReports
                .Where(r => r.SubmittedDate >= ytdStart)
                .ToListAsync();

            // Financial Metrics (Pulse)
            var currentMonthRevenue = thisMonthReports.Sum(r => r.MonthlyRevenuePKR);
            var lastMonthRevenue = await _context.MonthlyProgressReports
                .Where(r => r.SubmittedDate >= lastMonth && r.SubmittedDate < thisMonth)
                .SumAsync(r => r.MonthlyRevenuePKR);
            var ytdRevenue = ytdReports.Sum(r => r.MonthlyRevenuePKR);

            var currentMonthBurnRate = thisMonthReports.Sum(r => r.MonthlBurnRatePKR);
            var ytdBurnRate = ytdReports.Sum(r => r.MonthlBurnRatePKR);

            // Impact Metrics
            var totalEmployeesCreated = ytdReports.Sum(r => r.FullTimeEmployees);
            var totalCustomersAcquired = ytdReports.Sum(r => r.ActiveCustomersUsers);
            var totalFundingRaised = ytdReports.Sum(r => r.NewFundingReceivedPKR);

            // Health Status
            var latestHealthChecks = await _context.HealthCheckAssessments
                .GroupBy(h => h.StartupProfileId)
                .Select(g => g.OrderByDescending(h => h.Year).ThenByDescending(h => h.Quarter).First())
                .ToListAsync();

            var greenCount = latestHealthChecks.Count(h => h.OverallStatus == "GREEN");
            var amberCount = latestHealthChecks.Count(h => h.OverallStatus == "AMBER");
            var redCount = latestHealthChecks.Count(h => h.OverallStatus == "RED");

            // Grant Pipeline
            var totalGrantOpportunities = await _context.GrantApplications.CountAsync();
            var totalGrantValueUSD = await _context.GrantApplications.SumAsync(g => g.AmountUSD);
            var grantsWon = await _context.GrantApplications
                .Where(g => g.Stage == "Won")
                .SumAsync(g => g.AmountUSD);

            // Incidents
            var totalIncidents = await _context.IncidentReports.CountAsync();
            var criticalIncidents = await _context.IncidentReports
                .Where(i => i.Severity == "Critical" && i.Status != "Closed")
                .CountAsync();

            var dashboard = new
            {
                Timestamp = now,
                Section1_StartupRegistry = new
                {
                    TotalStartups = allStartups.Count,
                    ActiveStartups = activeStartups.Count,
                    GraduatedStartups = graduatedStartups.Count,
                    ExitedStartups = allStartups.Count(s => s.Status == "Exited"),
                    OnProbation = allStartups.Count(s => s.Status == "On Probation")
                },
                Section2_PulseFinancials = new
                {
                    CurrentMonthMetrics = new
                    {
                        MonthlyRevenuePKR = currentMonthRevenue,
                        MonthlyBurnRatePKR = currentMonthBurnRate,
                        ReportingRate = activeStartups.Count > 0 
                            ? Math.Round((double)thisMonthReports.Select(r => r.StartupProfileId).Distinct().Count() / activeStartups.Count * 100, 2) 
                            : 0
                    },
                    YTDMetrics = new
                    {
                        YTDRevenuePKR = ytdRevenue,
                        YTDBurnRatePKR = ytdBurnRate,
                        YTDFundingRaisedPKR = ytdReports.Sum(r => r.NewFundingReceivedPKR)
                    },
                    RevenueGrowth = lastMonthRevenue > 0 
                        ? Math.Round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100, 2)
                        : 0
                },
                Section3_ImpactMetrics = new
                {
                    TotalEmployeesCreated = totalEmployeesCreated,
                    TotalCustomersAcquired = totalCustomersAcquired,
                    AverageBurnRate = ytdReports.Count > 0 ? Math.Round(ytdReports.Average(r => r.MonthlBurnRatePKR), 2) : 0,
                    AverageRunway = ytdReports.Count > 0 ? Math.Round(ytdReports.Average(r => r.CurrentRunwayMonths), 1) : 0
                },
                Section4_HealthStatus = new
                {
                    TotalAssessed = latestHealthChecks.Count,
                    Green = greenCount,
                    Amber = amberCount,
                    Red = redCount,
                    GreenPercentage = latestHealthChecks.Count > 0 ? Math.Round((double)greenCount / latestHealthChecks.Count * 100, 2) : 0,
                    AmberPercentage = latestHealthChecks.Count > 0 ? Math.Round((double)amberCount / latestHealthChecks.Count * 100, 2) : 0,
                    RedPercentage = latestHealthChecks.Count > 0 ? Math.Round((double)redCount / latestHealthChecks.Count * 100, 2) : 0
                },
                Section5_GrantPipeline = new
                {
                    TotalOpportunities = totalGrantOpportunities,
                    TotalValueUSD = totalGrantValueUSD,
                    GrantsWonUSD = grantsWon,
                    SuccessRatePercentage = totalGrantOpportunities > 0 
                        ? Math.Round((double)await _context.GrantApplications.CountAsync(g => g.Stage == "Won") / totalGrantOpportunities * 100, 2)
                        : 0
                },
                Section6_RiskManagement = new
                {
                    TotalIncidents = totalIncidents,
                    CriticalUnresolved = criticalIncidents,
                    ResolutionRate = totalIncidents > 0
                        ? Math.Round((double)await _context.IncidentReports.CountAsync(i => i.Status == "Resolved") / totalIncidents * 100, 2)
                        : 0
                }
            };

            return Ok(dashboard);
        }

        /// <summary>
        /// GET /api/seicdashboard/cohort/{cohort}/performance - Performance analytics for specific cohort
        /// </summary>
        [HttpGet("cohort/{cohort}/performance")]
        public async Task<ActionResult<object>> GetCohortPerformance(string cohort)
        {
            var cohortStartups = await _context.StartupProfiles
                .Where(s => s.Cohort == cohort)
                .Include(s => s.MonthlyReports)
                .ToListAsync();

            if (!cohortStartups.Any())
                return NotFound();

            var latestReports = cohortStartups
                .Select(s => new
                {
                    Startup = s,
                    LatestReport = s.MonthlyReports.OrderByDescending(r => r.ReportingYear).ThenByDescending(r => r.ReportingMonth).FirstOrDefault()
                })
                .ToList();

            var performance = new
            {
                Cohort = cohort,
                TotalStartups = cohortStartups.Count,
                ActiveStartups = cohortStartups.Count(s => s.Status == "Active"),
                GraduatedStartups = cohortStartups.Count(s => s.Status == "Graduated"),
                AggregateMetrics = new
                {
                    TotalRevenueGenerated = latestReports.Sum(r => r.LatestReport?.MonthlyRevenuePKR ?? 0),
                    TotalJobsCreated = latestReports.Sum(r => r.LatestReport?.FullTimeEmployees ?? 0),
                    TotalCustomersAcquired = latestReports.Sum(r => r.LatestReport?.ActiveCustomersUsers ?? 0),
                    TotalFundingRaised = latestReports.Sum(r => r.LatestReport?.NewFundingReceivedPKR ?? 0),
                    AverageBurnRate = latestReports.Where(r => r.LatestReport != null).Average(r => r.LatestReport.MonthlBurnRatePKR),
                    AverageRunway = latestReports.Where(r => r.LatestReport != null).Average(r => r.LatestReport.CurrentRunwayMonths)
                },
                StartupDetails = latestReports.Select(r => new
                {
                    StartupName = r.Startup.StartupName,
                    Stage = r.Startup.Stage,
                    Status = r.Startup.Status,
                    Revenue = r.LatestReport?.MonthlyRevenuePKR ?? 0,
                    Employees = r.LatestReport?.FullTimeEmployees ?? 0,
                    Customers = r.LatestReport?.ActiveCustomersUsers ?? 0
                }).ToList()
            };

            return Ok(performance);
        }

        /// <summary>
        /// GET /api/seicdashboard/stage-distribution - Distribution of startups by stage (TRL)
        /// </summary>
        [HttpGet("stage-distribution")]
        public async Task<ActionResult<object>> GetStageDistribution()
        {
            var stageDistribution = await _context.StartupProfiles
                .GroupBy(s => s.Stage)
                .Select(g => new
                {
                    Stage = g.Key,
                    Count = g.Count(),
                    Startups = g.Select(s => s.StartupName).ToList()
                })
                .OrderBy(x => x.Stage)
                .ToListAsync();

            var total = stageDistribution.Sum(s => s.Count);

            var distribution = new
            {
                Total = total,
                ByStage = stageDistribution.Select(s => new
                {
                    s.Stage,
                    s.Count,
                    Percentage = total > 0 ? Math.Round((double)s.Count / total * 100, 2) : 0
                }).ToList()
            };

            return Ok(distribution);
        }

        /// <summary>
        /// GET /api/seicdashboard/sector-performance - Performance breakdown by sector
        /// </summary>
        [HttpGet("sector-performance")]
        public async Task<ActionResult<IEnumerable<object>>> GetSectorPerformance()
        {
            var sectorPerformance = await _context.StartupProfiles
                .GroupBy(s => s.Sector)
                .Select(g => new
                {
                    Sector = g.Key,
                    Count = g.Count(),
                    ActiveCount = g.Count(s => s.Status == "Active"),
                    GraduatedCount = g.Count(s => s.Status == "Graduated"),
                    AverageRevenue = g.SelectMany(s => s.MonthlyReports).Any() 
                        ? Math.Round(g.SelectMany(s => s.MonthlyReports).Average(r => r.MonthlyRevenuePKR), 0)
                        : 0
                })
                .OrderByDescending(x => x.Count)
                .ToListAsync();

            return Ok(sectorPerformance);
        }

        /// <summary>
        /// GET /api/seicdashboard/needs-analysis - Summary of startup support needs
        /// Identifies priority intervention areas
        /// </summary>
        [HttpGet("needs-analysis")]
        public async Task<ActionResult<object>> GetNeedsAnalysis()
        {
            var thisMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var recentReports = await _context.MonthlyProgressReports
                .Where(r => r.SubmittedDate >= thisMonth)
                .ToListAsync();

            var needsAnalysis = new
            {
                TotalNeedsIdentified = recentReports.Count,
                ByType = new
                {
                    GrantFundingSupport = recentReports.Count(r => r.NeedsGrantFundingSupport),
                    GovernmentRegulatory = recentReports.Count(r => r.NeedsGovernmentRegulatory),
                    TechnicalMentorship = recentReports.Count(r => r.NeedsTechnicalMentorship),
                    LegalIPAdvice = recentReports.Count(r => r.NeedsLegalIPAdvice),
                    MarketingConnections = recentReports.Count(r => r.NeedsMarketingConnections)
                },
                TopPriority = new
                {
                    Priority1 = recentReports.Count(r => r.NeedsGrantFundingSupport) > 0 ? "Grant Funding Support" : "None",
                    Priority2 = recentReports.Count(r => r.NeedsTechnicalMentorship) > 0 ? "Technical Mentorship" : "None"
                }
            };

            return Ok(needsAnalysis);
        }
    }
}
