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
    public class SEICIncidentReportController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICIncidentReportController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seicincidentreport - Get all incident reports (admin only)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentReport>>> GetAllIncidents(
            [FromQuery] string status = null,
            [FromQuery] string severity = null)
        {
            var query = _context.IncidentReports.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(i => i.Status == status);
            if (!string.IsNullOrEmpty(severity))
                query = query.Where(i => i.Severity == severity);

            return await query.OrderByDescending(i => i.ReportedDate).ToListAsync();
        }

        /// <summary>
        /// GET /api/seicincidentreport/{id} - Get specific incident report (Ethics Committee only)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentReport>> GetIncident(int id)
        {
            var incident = await _context.IncidentReports.FindAsync(id);
            if (incident == null)
                return NotFound();

            return incident;
        }

        /// <summary>
        /// POST /api/seicincidentreport - Submit new incident report
        /// Anonymous reporting supported
        /// Timeline: Acknowledged within 2 business days, initial review within 7 days
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<IncidentReport>> ReportIncident(IncidentReport report)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validation: Required fields
            if (string.IsNullOrWhiteSpace(report.IncidentDescription))
                return BadRequest("Incident description is required");

            if (report.IncidentDate > DateTime.UtcNow)
                return BadRequest("Incident date cannot be in the future");

            // Validation: Severity is valid
            var validSeverities = new[] { "Low", "Medium", "High", "Critical" };
            if (string.IsNullOrEmpty(report.Severity) || !validSeverities.Contains(report.Severity))
                return BadRequest("Invalid severity level. Must be Low, Medium, High, or Critical");

            // Validation: Category is valid
            var validCategories = new[] { "Harassment", "Discrimination", "IP Violation", "Fraud", "Confidentiality Breach", "Code Violation", "Other" };
            if (string.IsNullOrEmpty(report.IncidentCategory) || !validCategories.Contains(report.IncidentCategory))
                return BadRequest($"Invalid category. Must be one of: {string.Join(", ", validCategories)}");

            // Anonymity: If anonymous, clear reporter details
            if (report.IsAnonymous)
            {
                report.ReporterName = "Anonymous";
                report.ReporterEmail = null;
                report.ReporterPhone = null;
            }
            else
            {
                // If not anonymous, require contact info for follow-up
                if (string.IsNullOrWhiteSpace(report.ReporterEmail) && string.IsNullOrWhiteSpace(report.ReporterPhone))
                    return BadRequest("Email or phone required for non-anonymous reports");
            }

            report.Status = "Reported";
            report.ReportedDate = DateTime.UtcNow;
            report.CreatedAt = DateTime.UtcNow;

            // Critical incidents trigger immediate escalation
            if (report.Severity == "Critical")
            {
                // TODO: Implement immediate email to Ethics Committee
                // Email to: Aizaz Korai, Fawad Khan, Hasnain Akber
            }

            _context.IncidentReports.Add(report);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIncident), new { id = report.Id }, report);
        }

        /// <summary>
        /// PATCH /api/seicincidentreport/{id}/acknowledge - Acknowledge receipt of report (2 business days)
        /// </summary>
        [HttpPatch("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeReport(int id)
        {
            var incident = await _context.IncidentReports.FindAsync(id);
            if (incident == null)
                return NotFound();

            if (incident.Status != "Reported")
                return BadRequest($"Cannot acknowledge a report with status: {incident.Status}");

            incident.Status = "Under Review";
            _context.IncidentReports.Update(incident);
            await _context.SaveChangesAsync();

            // TODO: Send acknowledgment email to reporter (if not anonymous)

            return Ok(new { message = "Report acknowledged", incidentId = id });
        }

        /// <summary>
        /// PUT /api/seicincidentreport/{id}/investigate - Add investigation notes
        /// </summary>
        [HttpPut("{id}/investigate")]
        public async Task<IActionResult> UpdateInvestigation(int id, [FromBody] InvestigationUpdateRequest request)
        {
            var incident = await _context.IncidentReports.FindAsync(id);
            if (incident == null)
                return NotFound();

            incident.InvestigationNotes = request.InvestigationNotes ?? incident.InvestigationNotes;
            _context.IncidentReports.Update(incident);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Investigation notes updated", incident });
        }

        /// <summary>
        /// PATCH /api/seicincidentreport/{id}/resolve - Resolve incident and record resolution
        /// </summary>
        [HttpPatch("{id}/resolve")]
        public async Task<IActionResult> ResolveIncident(int id, [FromBody] ResolutionRequest request)
        {
            var incident = await _context.IncidentReports.FindAsync(id);
            if (incident == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(request.Resolution))
                return BadRequest("Resolution details required");

            incident.Status = "Resolved";
            incident.Resolution = request.Resolution;
            incident.ResolvedDate = DateTime.UtcNow;

            _context.IncidentReports.Update(incident);
            await _context.SaveChangesAsync();

            // TODO: Send resolution email to reporter (if not anonymous) and involved parties

            return Ok(new { message = "Incident resolved", incident });
        }

        /// <summary>
        /// GET /api/seicincidentreport/analytics/dashboard - Get incident analytics
        /// </summary>
        [HttpGet("analytics/dashboard")]
        public async Task<ActionResult<object>> GetIncidentAnalytics()
        {
            var allIncidents = await _context.IncidentReports.ToListAsync();
            var thisMonth = DateTime.UtcNow.AddMonths(-1);

            var analytics = new
            {
                TotalReports = allIncidents.Count,
                ReportedStatus = allIncidents.Count(i => i.Status == "Reported"),
                UnderReview = allIncidents.Count(i => i.Status == "Under Review"),
                Resolved = allIncidents.Count(i => i.Status == "Resolved"),
                Closed = allIncidents.Count(i => i.Status == "Closed"),
                ThisMonthReports = allIncidents.Count(i => i.ReportedDate >= thisMonth),
                BySeverity = new
                {
                    Critical = allIncidents.Count(i => i.Severity == "Critical"),
                    High = allIncidents.Count(i => i.Severity == "High"),
                    Medium = allIncidents.Count(i => i.Severity == "Medium"),
                    Low = allIncidents.Count(i => i.Severity == "Low")
                },
                ByCategory = allIncidents
                    .GroupBy(i => i.IncidentCategory)
                    .ToDictionary(g => g.Key, g => g.Count()),
                AverageResolutionDays = allIncidents
                    .Where(i => i.ResolvedDate.HasValue)
                    .Average(i => (i.ResolvedDate.Value - i.ReportedDate).TotalDays)
            };

            return Ok(analytics);
        }

        /// <summary>
        /// GET /api/seicincidentreport/critical - Get all critical/unresolved incidents
        /// </summary>
        [HttpGet("critical/active")]
        public async Task<ActionResult<IEnumerable<IncidentReport>>> GetCriticalIncidents()
        {
            return await _context.IncidentReports
                .Where(i => i.Severity == "Critical" && i.Status != "Closed")
                .OrderByDescending(i => i.ReportedDate)
                .ToListAsync();
        }

        public class InvestigationUpdateRequest
        {
            public string InvestigationNotes { get; set; }
        }

        public class ResolutionRequest
        {
            public string Resolution { get; set; }
        }
    }
}
