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
    public class SEICHealthCheckController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICHealthCheckController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seichealthcheck/{startupId}/latest - Get latest health check for startup
        /// </summary>
        [HttpGet("{startupId}/latest")]
        public async Task<ActionResult<HealthCheckAssessment>> GetLatestHealthCheck(int startupId)
        {
            var healthCheck = await _context.HealthCheckAssessments
                .Where(h => h.StartupProfileId == startupId)
                .OrderByDescending(h => h.Year)
                .ThenByDescending(h => h.Quarter)
                .FirstOrDefaultAsync();

            if (healthCheck == null)
                return NotFound();

            return healthCheck;
        }

        /// <summary>
        /// GET /api/seichealthcheck/{startupId}/history - Get all health checks for startup
        /// </summary>
        [HttpGet("{startupId}/history")]
        public async Task<ActionResult<IEnumerable<HealthCheckAssessment>>> GetHealthCheckHistory(int startupId)
        {
            return await _context.HealthCheckAssessments
                .Where(h => h.StartupProfileId == startupId)
                .OrderByDescending(h => h.Year)
                .ThenByDescending(h => h.Quarter)
                .ToListAsync();
        }

        /// <summary>
        /// GET /api/seichealthcheck/red-flagged - Get all RED-flagged startups requiring intervention
        /// </summary>
        [HttpGet("status/red-flagged")]
        public async Task<ActionResult<IEnumerable<object>>> GetRedFlaggedStartups()
        {
            var redFlagged = await _context.HealthCheckAssessments
                .Where(h => h.OverallStatus == "RED" && !h.RemediationPlan.EndsWith("Exited"))
                .Include(h => h.StartupProfile)
                .OrderByDescending(h => h.AssessmentDate)
                .Select(h => new
                {
                    h.Id,
                    h.StartupProfile.StartupName,
                    h.OverallStatus,
                    h.LogframeCompletionPercentage,
                    h.RemediationDeadline,
                    DaysUntilDeadline = h.RemediationDeadline.HasValue 
                        ? (h.RemediationDeadline.Value - DateTime.UtcNow).Days 
                        : 0
                })
                .ToListAsync();

            return Ok(redFlagged);
        }

        /// <summary>
        /// GET /api/seichealthcheck/status-summary - Dashboard summary of all startups by status
        /// </summary>
        [HttpGet("dashboard/status-summary")]
        public async Task<ActionResult<object>> GetStatusSummary()
        {
            var latestAssessments = await _context.HealthCheckAssessments
                .GroupBy(h => h.StartupProfileId)
                .Select(g => g.OrderByDescending(h => h.Year).ThenByDescending(h => h.Quarter).First())
                .ToListAsync();

            var summary = new
            {
                TotalAssessed = latestAssessments.Count,
                Green = latestAssessments.Count(h => h.OverallStatus == "GREEN"),
                Amber = latestAssessments.Count(h => h.OverallStatus == "AMBER"),
                Red = latestAssessments.Count(h => h.OverallStatus == "RED"),
                GreenPercentage = latestAssessments.Count > 0 
                    ? Math.Round((double)latestAssessments.Count(h => h.OverallStatus == "GREEN") / latestAssessments.Count * 100, 2)
                    : 0,
                AmberPercentage = latestAssessments.Count > 0
                    ? Math.Round((double)latestAssessments.Count(h => h.OverallStatus == "AMBER") / latestAssessments.Count * 100, 2)
                    : 0,
                RedPercentage = latestAssessments.Count > 0
                    ? Math.Round((double)latestAssessments.Count(h => h.OverallStatus == "RED") / latestAssessments.Count * 100, 2)
                    : 0
            };

            return Ok(summary);
        }

        /// <summary>
        /// POST /api/seichealthcheck - Create new health check assessment (quarterly)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<HealthCheckAssessment>> CreateHealthCheck(HealthCheckAssessment healthCheck)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validation: Check startup exists
            var startup = await _context.StartupProfiles.FindAsync(healthCheck.StartupProfileId);
            if (startup == null)
                return BadRequest("Startup not found");

            // Validation: Check duplicate assessment for same quarter/year
            var existing = await _context.HealthCheckAssessments
                .FirstOrDefaultAsync(h => h.StartupProfileId == healthCheck.StartupProfileId
                    && h.Quarter == healthCheck.Quarter
                    && h.Year == healthCheck.Year);

            if (existing != null)
                return BadRequest("Health check already exists for this quarter");

            // Validation: Logframe completion 0-100%
            if (healthCheck.LogframeCompletionPercentage < 0 || healthCheck.LogframeCompletionPercentage > 100)
                return BadRequest("Logframe completion must be 0-100%");

            // Auto-determine status based on completion percentage
            if (healthCheck.LogframeCompletionPercentage >= 80)
                healthCheck.OverallStatus = "GREEN";
            else if (healthCheck.LogframeCompletionPercentage >= 50)
                healthCheck.OverallStatus = "AMBER";
            else
                healthCheck.OverallStatus = "RED";

            // If RED: Set 3-month remediation deadline
            if (healthCheck.OverallStatus == "RED")
                healthCheck.RemediationDeadline = DateTime.UtcNow.AddMonths(3);

            healthCheck.AssessmentDate = DateTime.UtcNow;
            healthCheck.CreatedAt = DateTime.UtcNow;

            _context.HealthCheckAssessments.Add(healthCheck);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLatestHealthCheck), new { startupId = healthCheck.StartupProfileId }, healthCheck);
        }

        /// <summary>
        /// PUT /api/seichealthcheck/{id} - Update health check assessment
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHealthCheck(int id, HealthCheckAssessment healthCheck)
        {
            if (id != healthCheck.Id)
                return BadRequest();

            var existing = await _context.HealthCheckAssessments.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.LogframeCompletionPercentage = healthCheck.LogframeCompletionPercentage;
            existing.RelevanceAssessment = healthCheck.RelevanceAssessment ?? existing.RelevanceAssessment;
            existing.EffectivenessAssessment = healthCheck.EffectivenessAssessment ?? existing.EffectivenessAssessment;
            existing.EfficiencyAssessment = healthCheck.EfficiencyAssessment ?? existing.EfficiencyAssessment;
            existing.ImpactAssessment = healthCheck.ImpactAssessment ?? existing.ImpactAssessment;
            existing.SustainabilityAssessment = healthCheck.SustainabilityAssessment ?? existing.SustainabilityAssessment;
            existing.LeadMentorFeedback = healthCheck.LeadMentorFeedback ?? existing.LeadMentorFeedback;
            existing.OperationsManagerFeedback = healthCheck.OperationsManagerFeedback ?? existing.OperationsManagerFeedback;
            existing.RemediationPlan = healthCheck.RemediationPlan ?? existing.RemediationPlan;

            // Recalculate status based on updated completion
            if (healthCheck.LogframeCompletionPercentage >= 80)
                existing.OverallStatus = "GREEN";
            else if (healthCheck.LogframeCompletionPercentage >= 50)
                existing.OverallStatus = "AMBER";
            else
                existing.OverallStatus = "RED";

            _context.HealthCheckAssessments.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// PATCH /api/seichealthcheck/{id}/submit - Finalize and submit health check
        /// </summary>
        [HttpPatch("{id}/submit")]
        public async Task<IActionResult> SubmitHealthCheck(int id)
        {
            var healthCheck = await _context.HealthCheckAssessments.FindAsync(id);
            if (healthCheck == null)
                return NotFound();

            if (healthCheck.IsSubmitted)
                return BadRequest("Health check already submitted");

            healthCheck.IsSubmitted = true;
            _context.HealthCheckAssessments.Update(healthCheck);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Health check submitted. Status: {healthCheck.OverallStatus}", healthCheck });
        }

        /// <summary>
        /// POST /api/seichealthcheck/{startupId}/escalate-red - Escalate RED-flagged startup
        /// Email notifications sent to Director and Operations Manager
        /// </summary>
        [HttpPost("{startupId}/escalate-red")]
        public async Task<IActionResult> EscalateRedFlagged(int startupId, [FromBody] string escalationNote)
        {
            var startup = await _context.StartupProfiles.FindAsync(startupId);
            if (startup == null)
                return NotFound();

            var latestHealthCheck = await _context.HealthCheckAssessments
                .Where(h => h.StartupProfileId == startupId && h.OverallStatus == "RED")
                .OrderByDescending(h => h.AssessmentDate)
                .FirstOrDefaultAsync();

            if (latestHealthCheck == null)
                return BadRequest("No RED-flagged health check found for this startup");

            // TODO: Implement email notification logic here
            // Would trigger email to Director and Operations Manager with remediation plan

            return Ok(new 
            { 
                message = "RED flag escalated", 
                startup = startup.StartupName,
                status = latestHealthCheck.OverallStatus,
                remediationDeadline = latestHealthCheck.RemediationDeadline,
                note = escalationNote
            });
        }
    }
}
