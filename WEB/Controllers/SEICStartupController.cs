using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WEB.Models;
using Microsoft.EntityFrameworkCore;

namespace WEB.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SEICStartupController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SEICStartupController(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/seicstartup - List all startups with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StartupProfile>>> GetAllStartups(
            [FromQuery] string status = null,
            [FromQuery] string cohort = null,
            [FromQuery] string sector = null)
        {
            var query = _context.StartupProfiles.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(s => s.Status == status);
            if (!string.IsNullOrEmpty(cohort))
                query = query.Where(s => s.Cohort == cohort);
            if (!string.IsNullOrEmpty(sector))
                query = query.Where(s => s.Sector == sector);

            return await query.ToListAsync();
        }

        /// <summary>
        /// GET /api/seicstartup/{id} - Get specific startup profile
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<StartupProfile>> GetStartup(int id)
        {
            var startup = await _context.StartupProfiles
                .Include(s => s.MonthlyReports)
                .Include(s => s.HealthChecks)
                .Include(s => s.GrantApplications)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (startup == null)
                return NotFound();

            return startup;
        }

        /// <summary>
        /// POST /api/seicstartup - Create new startup profile
        /// Triggered after merit-based selection
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<StartupProfile>> CreateStartup(StartupProfile startup)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            startup.CreatedAt = System.DateTime.UtcNow;
            startup.UpdatedAt = System.DateTime.UtcNow;

            _context.StartupProfiles.Add(startup);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStartup), new { id = startup.Id }, startup);
        }

        /// <summary>
        /// PUT /api/seicstartup/{id} - Update startup profile
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStartup(int id, StartupProfile startup)
        {
            if (id != startup.Id)
                return BadRequest();

            var existing = await _context.StartupProfiles.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.StartupName = startup.StartupName ?? existing.StartupName;
            existing.PrimaryFounderName = startup.PrimaryFounderName ?? existing.PrimaryFounderName;
            existing.PrimaryFounderEmail = startup.PrimaryFounderEmail ?? existing.PrimaryFounderEmail;
            existing.PrimaryFounderPhone = startup.PrimaryFounderPhone ?? existing.PrimaryFounderPhone;
            existing.Sector = startup.Sector ?? existing.Sector;
            existing.Stage = startup.Stage ?? existing.Stage;
            existing.Status = startup.Status ?? existing.Status;
            existing.LeadMentorName = startup.LeadMentorName ?? existing.LeadMentorName;
            existing.ProblemStatement = startup.ProblemStatement ?? existing.ProblemStatement;
            existing.SolutionDescription = startup.SolutionDescription ?? existing.SolutionDescription;
            existing.TargetMarket = startup.TargetMarket ?? existing.TargetMarket;
            existing.UpdatedAt = System.DateTime.UtcNow;

            _context.StartupProfiles.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// PATCH /api/seicstartup/{id}/status - Update startup status
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStartupStatus(int id, [FromBody] StatusUpdateRequest request)
        {
            var startup = await _context.StartupProfiles.FindAsync(id);
            if (startup == null)
                return NotFound();

            startup.Status = request.Status;
            if (request.Status == "Graduated")
                startup.GraduationDate = System.DateTime.UtcNow;

            startup.UpdatedAt = System.DateTime.UtcNow;
            _context.StartupProfiles.Update(startup);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Status updated to {request.Status}", startup });
        }

        /// <summary>
        /// GET /api/seicstartup/cohort/{cohort} - Get all startups in a cohort
        /// </summary>
        [HttpGet("cohort/{cohort}")]
        public async Task<ActionResult<IEnumerable<StartupProfile>>> GetCohortStartups(string cohort)
        {
            return await _context.StartupProfiles
                .Where(s => s.Cohort == cohort)
                .ToListAsync();
        }

        public class StatusUpdateRequest
        {
            public string Status { get; set; }
        }
    }
}
