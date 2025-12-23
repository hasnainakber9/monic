/**
 * Monthly Progress Report Form Component
 * Replaces Google Forms for monthly startup reporting
 * Deadline: 20th of each month
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MonthlyReportAPI } from '../services/seicApi';

interface MonthlyReportFormProps {
  startupId: number;
  reportingMonth?: number;
  reportingYear?: number;
  onSubmitSuccess?: (report: any) => void;
  onCancel?: () => void;
}

interface ReportFormData {
  startupProfileId: number;
  reportingMonth: number;
  reportingYear: number;
  monthlyRevenuePKR: number;
  monthlBurnRatePKR: number;
  currentRunwayMonths: number;
  newFundingReceivedPKR: number;
  fullTimeEmployees: number;
  partTimeInterns: number;
  activeCustomersUsers: number;
  physicalAttendanceRating: number;
  technologyReadinessLevel: string;
  keyMilestoneAchieved: string;
  topChallenge: string;
  needsGrantFundingSupport: boolean;
  needsGovernmentRegulatory: boolean;
  needsTechnicalMentorship: boolean;
  needsLegalIPAdvice: boolean;
  needsMarketingConnections: boolean;
}

const MonthlyReportForm: React.FC<MonthlyReportFormProps> = ({
  startupId,
  reportingMonth,
  reportingYear,
  onSubmitSuccess,
  onCancel,
}) => {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ReportFormData>({
    defaultValues: {
      startupProfileId: startupId,
      reportingMonth: reportingMonth || new Date().getMonth() + 1,
      reportingYear: reportingYear || new Date().getFullYear(),
      monthlyRevenuePKR: 0,
      monthlBurnRatePKR: 0,
      currentRunwayMonths: 0,
      newFundingReceivedPKR: 0,
      fullTimeEmployees: 0,
      partTimeInterns: 0,
      activeCustomersUsers: 0,
      physicalAttendanceRating: 3,
      technologyReadinessLevel: 'TRL 3-4',
      keyMilestoneAchieved: '',
      topChallenge: '',
      needsGrantFundingSupport: false,
      needsGovernmentRegulatory: false,
      needsTechnicalMentorship: false,
      needsLegalIPAdvice: false,
      needsMarketingConnections: false,
    },
  });

  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trlOptions = [
    { value: 'TRL 1-2', label: 'TRL 1-2: Idea/Concept' },
    { value: 'TRL 3-4', label: 'TRL 3-4: Proof of Concept/Prototype' },
    { value: 'TRL 5-6', label: 'TRL 5-6: MVP/Beta Testing' },
    { value: 'TRL 7-8', label: 'TRL 7-8: Early Traction/Paying Users' },
    { value: 'TRL 9', label: 'TRL 9: Scaling/Growth' },
  ];

  const attendanceOptions = [
    { value: 1, label: '1: Once a week on average' },
    { value: 2, label: '2: 2-3 days per week' },
    { value: 3, label: '3: 3-4 days per week' },
    { value: 4, label: '4: 4-5 days per week' },
    { value: 5, label: '5: All working days' },
  ];

  const sections = [
    {
      title: 'Section 1: Identity & Compliance',
      description: 'Report period identification',
    },
    {
      title: 'Section 2: Financial Performance',
      description: 'Revenue, burn rate, funding',
    },
    {
      title: 'Section 3: Operational Metrics & Impact',
      description: 'Team, customers, attendance',
    },
    {
      title: 'Section 4: Strategic Progress',
      description: 'Milestones, challenges, TRL',
    },
    {
      title: 'Section 5: Support Needs',
      description: 'Required support checkboxes',
    },
  ];

  const onSubmit = async (data: ReportFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await MonthlyReportAPI.submit(data);
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data);
      }
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="monthly-report-form">
      {/* Header */}
      <div className="form-header">
        <h2>📊 Monthly Progress Report</h2>
        <p className="deadline-notice">Deadline: 20th of each month</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          ✓ Report submitted successfully!
        </div>
      )}

      {/* Progress Indicator */}
      <div className="section-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Section {activeSection + 1} of {sections.length}
        </p>
      </div>

      {/* Section Navigation */}
      <div className="section-tabs">
        {sections.map((section, index) => (
          <button
            key={index}
            className={`section-tab ${activeSection === index ? 'active' : ''}`}
            onClick={() => setActiveSection(index)}
          >
            <span className="tab-number">{index + 1}</span>
            <span className="tab-title">{section.title}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1: Identity */}
        {activeSection === 0 && (
          <section className="form-section">
            <h3>{sections[0].title}</h3>
            <div className="form-group">
              <label>Reporting Month *</label>
              <Controller
                name="reportingMonth"
                control={control}
                rules={{ required: 'Month is required' }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.reportingMonth && (
                <span className="error-message">{errors.reportingMonth.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Reporting Year *</label>
              <Controller
                name="reportingYear"
                control={control}
                rules={{ required: 'Year is required' }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    {[2025, 2026, 2027].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.reportingYear && (
                <span className="error-message">{errors.reportingYear.message}</span>
              )}
            </div>
          </section>
        )}

        {/* Section 2: Financial Performance */}
        {activeSection === 1 && (
          <section className="form-section">
            <h3>{sections[1].title}</h3>
            <p className="section-description">{sections[1].description}</p>

            <div className="form-group">
              <label>Monthly Revenue (PKR) *</label>
              <Controller
                name="monthlyRevenuePKR"
                control={control}
                rules={{
                  required: 'Revenue is required',
                  min: { value: 0, message: 'Cannot be negative' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="form-control"
                    placeholder="0 if pre-revenue"
                  />
                )}
              />
              {errors.monthlyRevenuePKR && (
                <span className="error-message">{errors.monthlyRevenuePKR.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Monthly Burn Rate (PKR) *</label>
              <Controller
                name="monthlBurnRatePKR"
                control={control}
                rules={{
                  required: 'Burn rate is required',
                  min: { value: 0, message: 'Cannot be negative' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="form-control"
                    placeholder="Total operational costs"
                  />
                )}
              />
              {errors.monthlBurnRatePKR && (
                <span className="error-message">{errors.monthlBurnRatePKR.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Current Cash Runway (Months) *</label>
              <Controller
                name="currentRunwayMonths"
                control={control}
                rules={{
                  required: 'Runway is required',
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 60, message: 'Max 60 months' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="form-control"
                    placeholder="Months of operation with current cash"
                  />
                )}
              />
              {errors.currentRunwayMonths && (
                <span className="error-message">{errors.currentRunwayMonths.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>New Funding/Grants Received (PKR)</label>
              <Controller
                name="newFundingReceivedPKR"
                control={control}
                rules={{
                  min: { value: 0, message: 'Cannot be negative' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="form-control"
                    placeholder="Only funds that hit your bank account this month"
                  />
                )}
              />
            </div>
          </section>
        )}

        {/* Section 3: Operational Metrics */}
        {activeSection === 2 && (
          <section className="form-section">
            <h3>{sections[2].title}</h3>
            <p className="section-description">{sections[2].description}</p>

            <div className="form-row">
              <div className="form-group">
                <label>Full-Time Employees *</label>
                <Controller
                  name="fullTimeEmployees"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="form-control"
                      placeholder="On payroll, excluding founders"
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label>Part-Time/Interns *</label>
                <Controller
                  name="partTimeInterns"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="form-control"
                      placeholder="Contractual staff"
                    />
                  )}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Active Customers/Users *</label>
              <Controller
                name="activeCustomersUsers"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="form-control"
                    placeholder="DAU, MAU, or Paying Clients"
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label>Physical Attendance at SEIC *</label>
              <Controller
                name="physicalAttendanceRating"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    {attendanceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </section>
        )}

        {/* Section 4: Strategic Progress */}
        {activeSection === 3 && (
          <section className="form-section">
            <h3>{sections[3].title}</h3>
            <p className="section-description">{sections[3].description}</p>

            <div className="form-group">
              <label>Technology Readiness Level (TRL) *</label>
              <Controller
                name="technologyReadinessLevel"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    {trlOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="form-group">
              <label>Key Milestone Achieved (Max 2-3 sentences) *</label>
              <Controller
                name="keyMilestoneAchieved"
                control={control}
                rules={{
                  required: 'Required',
                  maxLength: { value: 500, message: 'Max 500 characters' },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control"
                    rows={3}
                    placeholder="Describe your biggest achievement this month"
                  />
                )}
              />
              {errors.keyMilestoneAchieved && (
                <span className="error-message">{errors.keyMilestoneAchieved.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Top Challenge/Blocker (What is your biggest risk right now?) *</label>
              <Controller
                name="topChallenge"
                control={control}
                rules={{
                  required: 'Required',
                  maxLength: { value: 500, message: 'Max 500 characters' },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control"
                    rows={3}
                    placeholder="Describe your biggest challenge"
                  />
                )}
              />
              {errors.topChallenge && (
                <span className="error-message">{errors.topChallenge.message}</span>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Support Needs */}
        {activeSection === 4 && (
          <section className="form-section">
            <h3>{sections[4].title}</h3>
            <p className="section-description">Check the support you need from SEIC</p>

            <div className="checkbox-group">
              <div className="form-check">
                <Controller
                  name="needsGrantFundingSupport"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      id="grantFunding"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label" htmlFor="grantFunding">
                  Grant/Funding Support
                </label>
              </div>

              <div className="form-check">
                <Controller
                  name="needsGovernmentRegulatory"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      id="govtRegulatory"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label" htmlFor="govtRegulatory">
                  Government/Regulatory Help
                </label>
              </div>

              <div className="form-check">
                <Controller
                  name="needsTechnicalMentorship"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      id="technicalMentorship"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label" htmlFor="technicalMentorship">
                  Technical Mentorship
                </label>
              </div>

              <div className="form-check">
                <Controller
                  name="needsLegalIPAdvice"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      id="legalIP"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label" htmlFor="legalIP">
                  Legal/IP Advice
                </label>
              </div>

              <div className="form-check">
                <Controller
                  name="needsMarketingConnections"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      id="marketingConnections"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label" htmlFor="marketingConnections">
                  Marketing/Connections
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Form Navigation Buttons */}
        <div className="form-navigation">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (activeSection > 0) {
                setActiveSection(activeSection - 1);
              } else if (onCancel) {
                onCancel();
              }
            }}
          >
            {activeSection === 0 ? 'Cancel' : 'Previous'}
          </button>

          {activeSection < sections.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveSection(activeSection + 1)}
            >
              Next Section →
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Submitting...' : '✓ Submit Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MonthlyReportForm;
