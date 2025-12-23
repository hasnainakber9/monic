/**
 * Anonymous Incident Report Form
 * Confidential Code of Conduct violation reporting
 * Fully anonymous with anti-retaliation protections
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IncidentReportAPI } from '../services/seicApi';

interface IncidentReportFormProps {
  onSubmitSuccess?: (incident: any) => void;
  onCancel?: () => void;
}

interface IncidentReportFormData {
  incidentTitle: string;
  incidentDescription: string;
  incidentDate: string;
  incidentLocation: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  isAnonymous: boolean;
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  involvedPartiesDescription: string;
  witnessesDescription: string;
  evidenceDescription: string;
  hasWitnesses: boolean;
  previouslyReported: boolean;
  desiredOutcome: string;
  contactPreference: 'EMAIL' | 'PHONE' | 'ANONYMOUS';
}

const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  onSubmitSuccess,
  onCancel,
}) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<IncidentReportFormData>({
    defaultValues: {
      incidentTitle: '',
      incidentDescription: '',
      incidentDate: new Date().toISOString().split('T')[0],
      incidentLocation: '',
      reporterName: '',
      reporterEmail: '',
      reporterPhone: '',
      isAnonymous: false,
      violationType: '',
      severity: 'MEDIUM',
      involvedPartiesDescription: '',
      witnessesDescription: '',
      evidenceDescription: '',
      hasWitnesses: false,
      previouslyReported: false,
      desiredOutcome: '',
      contactPreference: 'EMAIL',
    },
  });

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const isAnonymous = watch('isAnonymous');
  const severity = watch('severity');
  const hasWitnesses = watch('hasWitnesses');

  const violationTypes = [
    { value: 'HARASSMENT', label: 'Harassment or Discrimination' },
    { value: 'MISCONDUCT', label: 'Unethical Conduct or Misconduct' },
    { value: 'FRAUD', label: 'Fraud or Financial Misconduct' },
    { value: 'ABUSE', label: 'Abuse of Authority' },
    { value: 'RETALIATION', label: 'Retaliation or Threat' },
    { value: 'SAFETY', label: 'Safety/Health Violation' },
    { value: 'CONFLICT', label: 'Conflict of Interest' },
    { value: 'OTHER', label: 'Other (Please specify)' },
  ];

  const severityLevels = [
    { value: 'LOW', label: 'Low', color: '#ffc107', desc: 'Minor concern' },
    { value: 'MEDIUM', label: 'Medium', color: '#ff9500', desc: 'Moderate concern' },
    { value: 'HIGH', label: 'High', color: '#f44336', desc: 'Serious concern' },
    { value: 'CRITICAL', label: 'Critical', color: '#b71c1c', desc: 'Urgent/Safety risk' },
  ];

  const steps = [
    { title: 'Incident Details', description: 'Basic information about the incident' },
    { title: 'Violation Type', description: 'Nature and severity of the violation' },
    { title: 'Involved Parties', description: 'People involved and witnesses' },
    { title: 'Reporter Info', description: 'Your contact information (optional)' },
    { title: 'Confirmation', description: 'Review and submit' },
  ];

  const onSubmit = async (data: IncidentReportFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await IncidentReportAPI.submit(data);
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data);
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit incident report');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    const level = severityLevels.find((s) => s.value === sev);
    return level?.color || '#6c757d';
  };

  return (
    <div className="incident-report-form">
      {/* Header */}
      <div className="form-header confidential">
        <h2>🚨 Confidential Incident Report</h2>
        <p className="confidential-notice">
          🔐 This report is completely confidential and anonymous
        </p>
      </div>

      {/* Trust & Safety Info */}
      <div className="trust-info">
        <div className="trust-item">
          <h4>🔐 Your Privacy is Protected</h4>
          <p>All reports are handled confidentially. Your identity will not be disclosed unless you explicitly consent.</p>
        </div>
        <div className="trust-item">
          <h4>⚠️ Anti-Retaliation Policy</h4>
          <p>SEIC has a strict anti-retaliation policy. Retaliation against a reporter is prohibited and will result in termination.</p>
        </div>
        <div className="trust-item">
          <h4>✔️ Impartial Investigation</h4>
          <p>All incidents are investigated fairly and thoroughly by an independent committee.</p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          ✓ Report submitted successfully. Reference ID will be provided.
        </div>
      )}

      {/* Progress Indicator */}
      <div className="step-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Step {activeStep + 1} of {steps.length}
        </p>
      </div>

      {/* Step Navigation */}
      <div className="step-tabs">
        {steps.map((step, index) => (
          <button
            key={index}
            className={`step-tab ${activeStep === index ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
            onClick={() => setActiveStep(index)}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Incident Details */}
        {activeStep === 0 && (
          <section className="form-section">
            <h3>{steps[0].title}</h3>
            <p className="section-description">Provide factual information about what happened</p>

            <div className="form-group">
              <label>Incident Title *</label>
              <Controller
                name="incidentTitle"
                control={control}
                rules={{
                  required: 'Title is required',
                  maxLength: { value: 100, message: 'Max 100 characters' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="form-control"
                    placeholder="Brief one-line summary of the incident"
                  />
                )}
              />
              {errors.incidentTitle && (
                <span className="error-message">{errors.incidentTitle.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <Controller
                name="incidentDescription"
                control={control}
                rules={{
                  required: 'Description is required',
                  minLength: { value: 50, message: 'Min 50 characters' },
                  maxLength: { value: 2000, message: 'Max 2000 characters' },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control"
                    rows={5}
                    placeholder="Provide a detailed account of what happened, including dates, times, and specific details..."
                  />
                )}
              />
              {errors.incidentDescription && (
                <span className="error-message">{errors.incidentDescription.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Incident *</label>
                <Controller
                  name="incidentDate"
                  control={control}
                  rules={{ required: 'Date is required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="form-control"
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label>Location/Context *</label>
                <Controller
                  name="incidentLocation"
                  control={control}
                  rules={{ required: 'Location is required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="form-control"
                      placeholder="Where did this occur? (SEIC Office, Call, Email, etc.)"
                    />
                  )}
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Violation Type */}
        {activeStep === 1 && (
          <section className="form-section">
            <h3>{steps[1].title}</h3>
            <p className="section-description">Categorize the type and severity of violation</p>

            <div className="form-group">
              <label>Type of Violation *</label>
              <Controller
                name="violationType"
                control={control}
                rules={{ required: 'Violation type is required' }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    <option value="">-- Select violation type --</option>
                    {violationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.violationType && (
                <span className="error-message">{errors.violationType.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Severity Level *</label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <div className="severity-selector">
                    {severityLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        className={`severity-btn ${field.value === level.value ? 'selected' : ''}`}
                        style={field.value === level.value ? { borderColor: level.color, backgroundColor: `${level.color}20` } : {}}
                        onClick={() => field.onChange(level.value)}
                      >
                        <div className="severity-dot" style={{ backgroundColor: level.color }} />
                        <div>
                          <strong>{level.label}</strong>
                          <p>{level.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {severity === 'CRITICAL' && (
              <div className="alert alert-danger">
                <strong>🚨 Critical Incident</strong> will be immediately escalated to SEIC Director and Ethics Committee.
              </div>
            )}
          </section>
        )}

        {/* Step 3: Involved Parties */}
        {activeStep === 2 && (
          <section className="form-section">
            <h3>{steps[2].title}</h3>
            <p className="section-description">Tell us who was involved and if there are witnesses</p>

            <div className="form-group">
              <label>Involved Parties Description *</label>
              <Controller
                name="involvedPartiesDescription"
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
                    placeholder="Describe the people involved (roles, not names if reporting anonymously). Include alleged perpetrator and victim."
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label>
                <Controller
                  name="hasWitnesses"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                Are there witnesses or others with knowledge?
              </label>
            </div>

            {hasWitnesses && (
              <div className="form-group">
                <label>Witnesses Description</label>
                <Controller
                  name="witnessesDescription"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="form-control"
                      rows={3}
                      placeholder="Describe witnesses and their roles (do not share names if reporting anonymously)"
                    />
                  )}
                />
              </div>
            )}

            <div className="form-group">
              <label>Evidence Description</label>
              <Controller
                name="evidenceDescription"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control"
                    rows={3}
                    placeholder="Any evidence? (emails, messages, documentation, etc.)"
                  />
                )}
              />
            </div>
          </section>
        )}

        {/* Step 4: Reporter Info */}
        {activeStep === 3 && (
          <section className="form-section">
            <h3>{steps[3].title}</h3>
            <p className="section-description">
              Optionally provide your contact information. You can submit this anonymously.
            </p>

            <div className="form-group">
              <label>
                <Controller
                  name="isAnonymous"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <strong>I want to remain completely anonymous</strong>
              </label>
              <p className="form-hint">
                If you don't provide contact info, we cannot follow up with you. An anonymous report is still fully investigated.
              </p>
            </div>

            {!isAnonymous && (
              <>
                <div className="form-group">
                  <label>Your Name</label>
                  <Controller
                    name="reporterName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="form-control"
                        placeholder="Optional: Your full name"
                      />
                    )}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <Controller
                    name="reporterEmail"
                    control={control}
                    rules={{
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className="form-control"
                        placeholder="your.email@example.com"
                      />
                    )}
                  />
                  {errors.reporterEmail && (
                    <span className="error-message">{errors.reporterEmail.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <Controller
                    name="reporterPhone"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="tel"
                        className="form-control"
                        placeholder="+92 XXX XXXXXXX"
                      />
                    )}
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Contact Method</label>
                  <Controller
                    name="contactPreference"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-control">
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Phone Call</option>
                        <option value="ANONYMOUS">No Contact (Anonymous)</option>
                      </select>
                    )}
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* Step 5: Confirmation */}
        {activeStep === 4 && (
          <section className="form-section">
            <h3>{steps[4].title}</h3>
            <p className="section-description">Please review before submitting</p>

            <div className="confirmation-box">
              <div className="confirm-item">
                <h4>🚨 I understand that:</h4>
                <ul>
                  <li>This report will be investigated thoroughly and impartially</li>
                  <li>My identity will be protected if I report anonymously</li>
                  <li>SEIC has a strict anti-retaliation policy</li>
                  <li>False reports may have consequences</li>
                  <li>I am reporting in good faith and believe the information is truthful</li>
                </ul>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={confirmSubmit}
                    onChange={(e) => setConfirmSubmit(e.target.checked)}
                  />
                  <strong>I understand the above and wish to submit this report</strong>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (activeStep > 0) {
                setActiveStep(activeStep - 1);
              } else if (onCancel) {
                onCancel();
              }
            }}
          >
            {activeStep === 0 ? 'Cancel' : '← Previous'}
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveStep(activeStep + 1)}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || !confirmSubmit}
            >
              {loading ? 'Submitting...' : '🚨 Submit Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default IncidentReportForm;
