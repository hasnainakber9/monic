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
    public class SEICGrantPipelineController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICGrantPipelineController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seicgrantpipeline - Get all grant applications
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GrantApplication>>> GetAllGrants(
            [FromQuery] string stage = null,
            [FromQuery] int? startupId = null)
        {
            var query = _context.GrantApplications.AsQueryable();

            if (!string.IsNullOrEmpty(stage))
                query = query.Where(g => g.Stage == stage);
            if (startupId.HasValue)
                query = query.Where(g => g.StartupProfileId == startupId);

            return await query.OrderByDescending(g => g.Deadline).ToListAsync();
        }

        /// <summary>
        /// GET /api/seicgrantpipeline/{startupId}/applications - Get all grants for specific startup
        /// </summary>
        [HttpGet("{startupId}/applications")]
        public async Task<ActionResult<IEnumerable<GrantApplication>>> GetStartupGrants(int startupId)
        {
            var startup = await _context.StartupProfiles.FindAsync(startupId);
            if (startup == null)
                return NotFound();

            return await _context.GrantApplications
                .Where(g => g.StartupProfileId == startupId)
                .OrderByDescending(g => g.Deadline)
                .ToListAsync();
        }

        /// <summary>
        /// GET /api/seicgrantpipeline/status/upcoming - Get grants with upcoming deadlines (30 days)
        /// </summary>
        [HttpGet("status/upcoming")]
        public async Task<ActionResult<IEnumerable<object>>> GetUpcomingDeadlines()
        {
            var now = DateTime.UtcNow;
            var thirtyDaysFromNow = now.AddDays(30);

            var upcoming = await _context.GrantApplications
                .Where(g => g.Deadline > now && g.Deadline <= thirtyDaysFromNow && g.Stage != "Won")
                .Include(g => g.StartupProfile)
                .OrderBy(g => g.Deadline)
                .Select(g => new
                {
                    g.Id,
                    g.DonorName,
                    g.ProgramName,
                    g.AmountUSD,
                    g.Deadline,
                    DaysUntilDeadline = (g.Deadline.Value - now).Days,
                    g.Stage,
                    StartupName = g.StartupProfile.StartupName,
                    g.OwnerName
                })
                .ToListAsync();

            return Ok(upcoming);
        }

        /// <summary>
        /// GET /api/seicgrantpipeline/analytics/pipeline - Get funding pipeline analytics
        /// </summary>
        [HttpGet("analytics/pipeline")]
        public async Task<ActionResult<object>> GetPipelineAnalytics()
        {
            var allGrants = await _context.GrantApplications.ToListAsync();
            var now = DateTime.UtcNow;

            var analytics = new
            {
                TotalOpportunities = allGrants.Count,
                TotalValueUSD = allGrants.Sum(g => g.AmountUSD),
                ByStage = new
                {
                    Identified = allGrants.Count(g => g.Stage == "Identified"),
                    ApplicationSubmitted = allGrants.Count(g => g.Stage == "Application Submitted"),
                    Shortlisted = allGrants.Count(g => g.Stage == "Shortlisted"),
                    Won = allGrants.Count(g => g.Stage == "Won"),
                    Rejected = allGrants.Count(g => g.Stage == "Rejected")
                },
                ValueByStage = new
                {
                    Identified = allGrants.Where(g => g.Stage == "Identified").Sum(g => g.AmountUSD),
                    ApplicationSubmitted = allGrants.Where(g => g.Stage == "Application Submitted").Sum(g => g.AmountUSD),
                    Shortlisted = allGrants.Where(g => g.Stage == "Shortlisted").Sum(g => g.AmountUSD),
                    Won = allGrants.Where(g => g.Stage == "Won").Sum(g => g.AmountUSD),
                    Rejected = allGrants.Where(g => g.Stage == "Rejected").Sum(g => g.AmountUSD)
                },
                AverageProbability = allGrants.Count > 0 ? allGrants.Average(g => g.ProbabilityPercentage) : 0,
                UpcomingDeadlines = allGrants
                    .Where(g => g.Deadline > now && g.Deadline <= now.AddDays(30))
                    .Count(),
                OverdueDeadlines = allGrants
                    .Where(g => g.Deadline < now && g.Stage != "Won" && g.Stage != "Rejected")
                    .Count()
            };

            return Ok(analytics);
        }

        /// <summary>
        /// POST /api/seicgrantpipeline - Create new grant application record
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<GrantApplication>> AddGrant(GrantApplication grant)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validation: Check startup exists
            var startup = await _context.StartupProfiles.FindAsync(grant.StartupProfileId);
            if (startup == null)
                return BadRequest("Startup not found");

            // Validation: Amount must be positive
            if (grant.AmountUSD <= 0)
                return BadRequest("Grant amount must be positive");

            // Validation: Probability 0-100
            if (grant.ProbabilityPercentage < 0 || grant.ProbabilityPercentage > 100)
                return BadRequest("Probability must be 0-100%");

            // Validation: Stage is valid
            var validStages = new[] { "Identified", "Application Submitted", "Shortlisted", "Won", "Rejected" };
            if (!validStages.Contains(grant.Stage))
                return BadRequest($"Invalid stage. Must be one of: {string.Join(", ", validStages)}");

            grant.CreatedAt = DateTime.UtcNow;
            grant.UpdatedAt = DateTime.UtcNow;

            _context.GrantApplications.Add(grant);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStartupGrants), new { startupId = grant.StartupProfileId }, grant);
        }

        /// <summary>
        /// PUT /api/seicgrantpipeline/{id} - Update grant application
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGrant(int id, GrantApplication grant)
        {
            if (id != grant.Id)
                return BadRequest();

            var existing = await _context.GrantApplications.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.Stage = grant.Stage ?? existing.Stage;
            existing.ProbabilityPercentage = grant.ProbabilityPercentage;
            existing.Notes = grant.Notes ?? existing.Notes;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.GrantApplications.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// PATCH /api/seicgrantpipeline/{id}/advance - Move grant to next stage
        /// </summary>
        [HttpPatch("{id}/advance")]
        public async Task<IActionResult> AdvanceGrant(int id, [FromBody] AdvanceStageRequest request)
        {
            var grant = await _context.GrantApplications.FindAsync(id);
            if (grant == null)
                return NotFound();

            var stageProgression = new[] { "Identified", "Application Submitted", "Shortlisted", "Won" };
            var currentIndex = Array.IndexOf(stageProgression, grant.Stage);

            if (currentIndex < 0 || currentIndex >= stageProgression.Length - 1)
                return BadRequest($"Cannot advance stage {grant.Stage}");

            grant.Stage = stageProgression[currentIndex + 1];
            grant.UpdatedAt = DateTime.UtcNow;

            if (grant.Stage == "Won")
                grant.ProbabilityPercentage = 100;

            _context.GrantApplications.Update(grant);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Grant advanced to {grant.Stage}", grant });
        }

        /// <summary>
        /// PATCH /api/seicgrantpipeline/{id}/reject - Mark grant as rejected
        /// </summary>
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectGrant(int id, [FromBody] string reason)
        {
            var grant = await _context.GrantApplications.FindAsync(id);
            if (grant == null)
                return NotFound();

            grant.Stage = "Rejected";
            grant.ProbabilityPercentage = 0;
            grant.Notes = reason ?? grant.Notes;
            grant.UpdatedAt = DateTime.UtcNow;

            _context.GrantApplications.Update(grant);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Grant marked as rejected", grant });
        }

        public class AdvanceStageRequest
        {
            public string Notes { get; set; }
        }
    }
}
