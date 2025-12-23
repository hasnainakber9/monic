using System;
using System.Threading.Tasks;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WEB.Services
{
    /// <summary>
    /// Email Service for SEIC M&E Platform
    /// Uses SendGrid for reliable email delivery
    /// </summary>
    public interface IEmailService
    {
        Task SendMonthlyReportReminderAsync(string email, string startupName, int daysUntilDeadline);
        Task SendHealthCheckNotificationAsync(string email, string startupName, string status);
        Task SendIncidentReportAcknowledgmentAsync(string email, string referenceId, bool isAnonymous);
        Task SendRedFlaggedNotificationAsync(string recipientEmail, string startupName, string escalationNote);
        Task SendCriticalIncidentEscalationAsync(string recipientEmail, string incidentSummary);
        Task SendGrantOpportunityNotificationAsync(string email, string startupName, string grantName, string deadline);
        Task SendResetPasswordLinkAsync(string email, string resetLink);
    }

    public class EmailService : IEmailService
    {
        private readonly SendGridClient _client;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            var apiKey = configuration["SendGrid:ApiKey"];
            _fromEmail = configuration["SendGrid:FromEmail"] ?? "noreply@seic.pk";
            _fromName = "SEIC M&E Platform";
            
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("SendGrid API key not configured. Email service will not function.");
            }
            
            _client = new SendGridClient(apiKey ?? "");
        }

        /// <summary>
        /// Send monthly reporting deadline reminder
        /// </summary>
        public async Task SendMonthlyReportReminderAsync(
            string email,
            string startupName,
            int daysUntilDeadline)
        {
            var subject = $"Reminder: Monthly Progress Report Due in {daysUntilDeadline} Days";
            var htmlContent = $@"
                <h2>Monthly Report Reminder</h2>
                <p>Hi {startupName},</p>
                <p>Your monthly progress report is due in <strong>{daysUntilDeadline} days</strong> (by the 20th of the month).</p>
                <p>Please log in to your dashboard and submit your report covering:</p>
                <ul>
                    <li>Financial Performance (revenue, burn rate, runway)</li>
                    <li>Operational Metrics (team, customers, attendance)</li>
                    <li>Strategic Progress (milestones, challenges)</li>
                    <li>Support Needs</li>
                </ul>
                <p><a href='{_configuration["AppUrl"]}/dashboard/reports'>Submit Your Report</a></p>
                <p>Questions? Contact: support@seic.pk</p>
                <hr/>
                <p><em>This is an automated message from the SEIC M&E Platform</em></p>
            ";

            await SendEmailAsync(email, subject, htmlContent);
        }

        /// <summary>
        /// Send health check assessment notification
        /// </summary>
        public async Task SendHealthCheckNotificationAsync(
            string email,
            string startupName,
            string status)
        {
            var statusEmoji = status switch
            {
                "GREEN" => "🟢",
                "AMBER" => "🟠",
                "RED" => "🔴",
                _ => "⚪"
            };

            var subject = $"Health Check Assessment Complete: {statusEmoji} {status}";
            var htmlContent = $@"
                <h2>Quarterly Health Check Result</h2>
                <p>Hi {startupName},</p>
                <p>Your quarterly health check assessment has been completed.</p>
                <p><strong>Status: {statusEmoji} {status}</strong></p>
                <p>
                    {status switch
                    {
                        "GREEN" => "Great! Your startup is on track. Continue with your current strategy.",
                        "AMBER" => "Your startup needs support. We will reach out with targeted interventions.",
                        "RED" => "Your startup has been placed on probation. SEIC will provide intensive support to help you recover.",
                        _ => "Status unknown."
                    }}
                </p>
                <p>Log in to your dashboard for detailed feedback and recommended actions.</p>
                <p><a href='{_configuration["AppUrl"]}/dashboard'>View Details</a></p>
                <p>Questions? Contact: support@seic.pk</p>
            ";

            await SendEmailAsync(email, subject, htmlContent);
        }

        /// <summary>
        /// Send incident report acknowledgment
        /// </summary>
        public async Task SendIncidentReportAcknowledgmentAsync(
            string email,
            string referenceId,
            bool isAnonymous)
        {
            var subject = $"Incident Report Received - Reference: {referenceId}";
            var htmlContent = $@"
                <h2>Your Report Has Been Received</h2>
                <p>Thank you for reporting this incident.</p>
                <p><strong>Reference ID:</strong> {referenceId}</p>
                <p>Your report has been submitted {(isAnonymous ? "anonymously" : "confidentially")} and will be investigated thoroughly by our Ethics Committee.</p>
                <p>
                    <strong>What happens next:</strong>
                    <ul>
                        <li>Initial assessment within 48 hours</li>
                        <li>Formal investigation if warranted</li>
                        <li>Findings documented and acted upon</li>
                        <li>Zero tolerance for retaliation</li>
                    </ul>
                </p>
                <p>
                    <strong>Confidentiality:</strong> Your identity {(isAnonymous ? "is completely protected" : "will remain confidential")}. 
                    We have strict anti-retaliation policies in place.
                </p>
                {(isAnonymous ? "" : $"<p>If you need to add information, reply to this email with your reference ID: {referenceId}</p>")
                }
                <p>Questions? Contact: ethics@seic.pk</p>
            ";

            await SendEmailAsync(email, subject, htmlContent);
        }

        /// <summary>
        /// Send RED-flagged startup notification
        /// </summary>
        public async Task SendRedFlaggedNotificationAsync(
            string recipientEmail,
            string startupName,
            string escalationNote)
        {
            var subject = $"🔴 RED-FLAGGED: {startupName} Placed on Probation";
            var htmlContent = $@"
                <h2>Probation Notice</h2>
                <p><strong>{startupName}</strong> has been placed on probation based on latest health check assessment.</p>
                <p><strong>Escalation Note:</strong></p>
                <p>{escalationNote}</p>
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Intensive support plan will be designed</li>
                    <li>Weekly check-ins with SEIC management</li>
                    <li>90-day reassessment period</li>
                    <li>Potential graduation/exit after reassessment</li>
                </ul>
                <p>Contact Director for support planning meeting.</p>
                <p><a href='{_configuration["AppUrl"]}/dashboard/startups/{startupName}'>View Startup Profile</a></p>
            ";

            await SendEmailAsync(recipientEmail, subject, htmlContent);
        }

        /// <summary>
        /// Send critical incident escalation
        /// </summary>
        public async Task SendCriticalIncidentEscalationAsync(
            string recipientEmail,
            string incidentSummary)
        {
            var subject = "🚨 CRITICAL: Incident Requires Immediate Action";
            var htmlContent = $@"
                <h2>URGENT: Critical Incident Reported</h2>
                <p>A critical Code of Conduct violation has been reported and requires immediate attention.</p>
                <p><strong>Incident Summary:</strong></p>
                <p>{incidentSummary}</p>
                <p>
                    <strong>Required Actions:</strong>
                    <ul>
                        <li>Review incident details immediately</li>
                        <li>Convene Ethics Committee if not already done</li>
                        <li>Protect reporter from retaliation</li>
                        <li>Begin formal investigation</li>
                    </ul>
                </p>
                <p><a href='{_configuration["AppUrl"]}/dashboard/incidents'>View Critical Incidents</a></p>
                <p>This is an urgent matter. Please respond within 2 hours.</p>
            ";

            await SendEmailAsync(recipientEmail, subject, htmlContent);
        }

        /// <summary>
        /// Send grant opportunity notification
        /// </summary>
        public async Task SendGrantOpportunityNotificationAsync(
            string email,
            string startupName,
            string grantName,
            string deadline)
        {
            var subject = $"🎯 New Grant Opportunity: {grantName}";
            var htmlContent = $@"
                <h2>Grant Opportunity for Your Startup</h2>
                <p>Hi {startupName},</p>
                <p>A new grant opportunity matching your profile has been identified:</p>
                <p>
                    <strong>{grantName}</strong><br/>
                    <strong>Deadline:</strong> {deadline}
                </p>
                <p>Log in to your dashboard to:</p>
                <ul>
                    <li>View full grant details and requirements</li>
                    <li>Check application status</li>
                    <li>Get support from SEIC in preparing application</li>
                </ul>
                <p><a href='{_configuration["AppUrl"]}/dashboard/grants'>View Opportunities</a></p>
                <p>Don't miss this opportunity!</p>
            ";

            await SendEmailAsync(email, subject, htmlContent);
        }

        /// <summary>
        /// Send password reset link
        /// </summary>
        public async Task SendResetPasswordLinkAsync(string email, string resetLink)
        {
            var subject = "Reset Your SEIC Platform Password";
            var htmlContent = $@"
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <p><a href='{resetLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a></p>
                <p>Or copy and paste this link in your browser:</p>
                <p>{resetLink}</p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
            ";

            await SendEmailAsync(email, subject, htmlContent);
        }

        /// <summary>
        /// Generic email sending method
        /// </summary>
        private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
        {
            try
            {
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail);
                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = subject,
                    HtmlContent = htmlContent,
                };
                msg.AddTo(to);

                var response = await _client.SendEmailAsync(msg);

                if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogInformation($"Email sent to {toEmail}: {subject}");
                }
                else
                {
                    _logger.LogError($"Failed to send email to {toEmail}: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending email: {ex.Message}");
            }
        }
    }
}
