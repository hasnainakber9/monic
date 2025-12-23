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
    public class SEICMonthlyReportController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICMonthlyReportController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seicmonthlyreport/{startupId}/latest - Get latest monthly report for startup
        /// </summary>
        [HttpGet("{startupId}/latest")]
        public async Task<ActionResult<MonthlyProgressReport>> GetLatestReport(int startupId)
        {
            var report = await _context.MonthlyProgressReports
                .Where(r => r.StartupProfileId == startupId)
                .OrderByDescending(r => r.ReportingYear)
                .ThenByDescending(r => r.ReportingMonth)
                .FirstOrDefaultAsync();

            if (report == null)
                return NotFound();

            return report;
        }

        /// <summary>
        /// GET /api/seicmonthlyreport/{startupId}/history - Get all monthly reports for startup
        /// </summary>
        [HttpGet("{startupId}/history")]
        public async Task<ActionResult<IEnumerable<MonthlyProgressReport>>> GetReportHistory(int startupId)
        {
            return await _context.MonthlyProgressReports
                .Where(r => r.StartupProfileId == startupId)
                .OrderByDescending(r => r.ReportingYear)
                .ThenByDescending(r => r.ReportingMonth)
                .ToListAsync();
        }

        /// <summary>
        /// GET /api/seicmonthlyreport/{startupId}/{year}/{month} - Get specific month's report
        /// </summary>
        [HttpGet("{startupId}/{year}/{month}")]
        public async Task<ActionResult<MonthlyProgressReport>> GetReportForMonth(int startupId, int year, int month)
        {
            var report = await _context.MonthlyProgressReports
                .FirstOrDefaultAsync(r => r.StartupProfileId == startupId 
                    && r.ReportingYear == year 
                    && r.ReportingMonth == month);

            if (report == null)
                return NotFound();

            return report;
        }

        /// <summary>
        /// POST /api/seicmonthlyreport - Submit or draft new monthly report
        /// Deadline: 20th of each month (checked on submission)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<MonthlyProgressReport>> SubmitMonthlyReport(MonthlyProgressReport report)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validation: Check if startup exists
            var startup = await _context.StartupProfiles.FindAsync(report.StartupProfileId);
            if (startup == null)
                return BadRequest("Startup not found");

            // Validation: Check if report already exists for this month
            var existingReport = await _context.MonthlyProgressReports
                .FirstOrDefaultAsync(r => r.StartupProfileId == report.StartupProfileId
                    && r.ReportingYear == report.ReportingYear
                    && r.ReportingMonth == report.ReportingMonth);

            if (existingReport != null)
                return BadRequest("Report already submitted for this month");

            // Validation: Burn rate cannot be negative
            if (report.MonthlBurnRatePKR < 0)
                return BadRequest("Burn rate cannot be negative");

            // Validation: Runway must be reasonable
            if (report.CurrentRunwayMonths < 0 || report.CurrentRunwayMonths > 60)
                return BadRequest("Runway must be between 0-60 months");

            report.CreatedAt = DateTime.UtcNow;
            report.SubmittedDate = DateTime.UtcNow;

            _context.MonthlyProgressReports.Add(report);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLatestReport), new { startupId = report.StartupProfileId }, report);
        }

        /// <summary>
        /// PUT /api/seicmonthlyreport/{id} - Update draft report (before submission)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(int id, MonthlyProgressReport report)
        {
            if (id != report.Id)
                return BadRequest();

            var existing = await _context.MonthlyProgressReports.FindAsync(id);
            if (existing == null)
                return NotFound();

            // Validation: Prevent modification after submission
            if (existing.IsSubmitted)
                return BadRequest("Cannot modify submitted report");

            existing.MonthlyRevenuePKR = report.MonthlyRevenuePKR;
            existing.MonthlBurnRatePKR = report.MonthlBurnRatePKR;
            existing.CurrentRunwayMonths = report.CurrentRunwayMonths;
            existing.NewFundingReceivedPKR = report.NewFundingReceivedPKR;
            existing.FullTimeEmployees = report.FullTimeEmployees;
            existing.PartTimeInterns = report.PartTimeInterns;
            existing.ActiveCustomersUsers = report.ActiveCustomersUsers;
            existing.PhysicalAttendanceRating = report.PhysicalAttendanceRating;
            existing.TechnologyReadinessLevel = report.TechnologyReadinessLevel;
            existing.KeyMilestoneAchieved = report.KeyMilestoneAchieved;
            existing.TopChallenge = report.TopChallenge;
            existing.NeedsGrantFundingSupport = report.NeedsGrantFundingSupport;
            existing.NeedsGovernmentRegulatory = report.NeedsGovernmentRegulatory;
            existing.NeedsTechnicalMentorship = report.NeedsTechnicalMentorship;
            existing.NeedsLegalIPAdvice = report.NeedsLegalIPAdvice;
            existing.NeedsMarketingConnections = report.NeedsMarketingConnections;

            _context.MonthlyProgressReports.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// PATCH /api/seicmonthlyreport/{id}/submit - Finalize and submit report
        /// </summary>
        [HttpPatch("{id}/submit")]
        public async Task<IActionResult> SubmitDraftReport(int id)
        {
            var report = await _context.MonthlyProgressReports.FindAsync(id);
            if (report == null)
                return NotFound();

            if (report.IsSubmitted)
                return BadRequest("Report already submitted");

            report.IsSubmitted = true;
            report.SubmittedDate = DateTime.UtcNow;

            _context.MonthlyProgressReports.Update(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Report submitted successfully", report });
        }

        /// <summary>
        /// GET /api/seicmonthlyreport/pending - Get all overdue/pending reports
        /// Reports due by 20th of each month
        /// </summary>
        [HttpGet("pending/overdue")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingReports()
        {
            var now = DateTime.UtcNow;
            var currentMonth = now.Month;
            var currentYear = now.Year;
            var dayOfMonth = now.Day;

            // Find all active startups that haven't reported for current month
            var reportedStartups = await _context.MonthlyProgressReports
                .Where(r => r.ReportingMonth == currentMonth && r.ReportingYear == currentYear)
                .Select(r => r.StartupProfileId)
                .ToListAsync();

            var pendingStartups = await _context.StartupProfiles
                .Where(s => s.Status == "Active" && !reportedStartups.Contains(s.Id))
                .Select(s => new
                {
                    s.Id,
                    s.StartupName,
                    s.PrimaryFounderEmail,
                    DaysOverdue = dayOfMonth - 20,
                    Cohort = s.Cohort
                })
                .ToListAsync();

            return Ok(pendingStartups);
        }

        /// <summary>
        /// POST /api/seicmonthlyreport/bulk - Import batch of monthly reports (admin)
        /// </summary>
        [HttpPost("bulk")]
        public async Task<ActionResult> BulkImportReports([FromBody] List<MonthlyProgressReport> reports)
        {
            if (!reports.Any())
                return BadRequest("No reports provided");

            foreach (var report in reports)
            {
                // Validate startup exists
                var startup = await _context.StartupProfiles.FindAsync(report.StartupProfileId);
                if (startup == null)
                    continue; // Skip invalid entries

                report.CreatedAt = DateTime.UtcNow;
                _context.MonthlyProgressReports.Add(report);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{reports.Count} reports imported", count = reports.Count });
        }
    }
}
