/**
 * Health Check Assessment Form
 * Quarterly evaluation of startup health status
 * Replaces PDF/Google Forms with structured form
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { HealthCheckAPI } from '../services/seicApi';

interface HealthCheckFormProps {
  startupId: number;
  onSubmitSuccess?: (healthCheck: any) => void;
  onCancel?: () => void;
}

interface HealthCheckFormData {
  startupProfileId: number;
  assessmentDate: string;
  financialHealthScore: number;
  operationalHealthScore: number;
  marketTractionScore: number;
  teamCapabilityScore: number;
  complianceScore: number;
  overallStatus: 'GREEN' | 'AMBER' | 'RED';
  statusJustification: string;
  strengths: string;
  concerns: string;
  recommendedInterventions: string;
  escalationJustification?: string;
}

const HealthCheckForm: React.FC<HealthCheckFormProps> = ({
  startupId,
  onSubmitSuccess,
  onCancel,
}) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<HealthCheckFormData>({
    defaultValues: {
      startupProfileId: startupId,
      assessmentDate: new Date().toISOString().split('T')[0],
      financialHealthScore: 3,
      operationalHealthScore: 3,
      marketTractionScore: 3,
      teamCapabilityScore: 3,
      complianceScore: 3,
      overallStatus: 'GREEN',
      statusJustification: '',
      strengths: '',
      concerns: '',
      recommendedInterventions: '',
    },
  });

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);

  const overallStatus = watch('overallStatus');
  const financialScore = watch('financialHealthScore');
  const operationalScore = watch('operationalHealthScore');
  const tractionScore = watch('marketTractionScore');
  const teamScore = watch('teamCapabilityScore');
  const complianceScore = watch('complianceScore');

  const calculateAverageScore = () => {
    const avg = (financialScore + operationalScore + tractionScore + teamScore + complianceScore) / 5;
    return avg.toFixed(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return '#28a745';
      case 'AMBER':
        return '#ffc107';
      case 'RED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const onSubmit = async (data: HealthCheckFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await HealthCheckAPI.create(data);
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit health check');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { title: 'Scoring Criteria', description: 'Rate startup across 5 dimensions' },
    { title: 'Overall Status', description: 'Assign GREEN/AMBER/RED status' },
    { title: 'Risk Assessment', description: 'Document concerns & interventions' },
  ];

  return (
    <div className="health-check-form">
      {/* Header */}
      <div className="form-header">
        <h2>🏥 Quarterly Health Check Assessment</h2>
        <p className="description">Comprehensive evaluation of startup viability and support needs</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          ✓ Health check assessment submitted successfully!
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            <span className="tab-number">{index + 1}</span>
            <div className="tab-content">
              <span className="tab-title">{tab.title}</span>
              <span className="tab-desc">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tab 1: Scoring Criteria */}
        {activeTab === 0 && (
          <section className="form-section">
            <h3>{tabs[0].title}</h3>
            <p className="section-intro">
              Rate the startup on a scale of 1-5 across five critical dimensions:
            </p>

            {/* Financial Health */}
            <div className="scoring-item">
              <div className="scoring-header">
                <h4>1. Financial Health & Sustainability</h4>
                <span className="score-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
                  Score: {financialScore}/5
                </span>
              </div>
              <p className="scoring-description">
                Evaluate runway, burn rate, revenue trajectory, and funding diversity
              </p>
              <Controller
                name="financialHealthScore"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <div className="scoring-slider">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${field.value === score ? 'selected' : ''}`}
                        onClick={() => field.onChange(score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                )}
              />
              <div className="score-legend">
                <div className="legend-item">1 = Critical Risk</div>
                <div className="legend-item">3 = Moderate Risk</div>
                <div className="legend-item">5 = Strong Health</div>
              </div>
            </div>

            {/* Operational Health */}
            <div className="scoring-item">
              <div className="scoring-header">
                <h4>2. Operational Health & Governance</h4>
                <span className="score-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
                  Score: {operationalScore}/5
                </span>
              </div>
              <p className="scoring-description">
                Assess processes, controls, compliance, reporting quality
              </p>
              <Controller
                name="operationalHealthScore"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <div className="scoring-slider">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${field.value === score ? 'selected' : ''}`}
                        onClick={() => field.onChange(score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Market Traction */}
            <div className="scoring-item">
              <div className="scoring-header">
                <h4>3. Market Traction & Product-Market Fit</h4>
                <span className="score-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
                  Score: {tractionScore}/5
                </span>
              </div>
              <p className="scoring-description">
                Evaluate customer acquisition, retention, revenue growth, market validation
              </p>
              <Controller
                name="marketTractionScore"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <div className="scoring-slider">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${field.value === score ? 'selected' : ''}`}
                        onClick={() => field.onChange(score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Team Capability */}
            <div className="scoring-item">
              <div className="scoring-header">
                <h4>4. Team Capability & Execution</h4>
                <span className="score-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
                  Score: {teamScore}/5
                </span>
              </div>
              <p className="scoring-description">
                Assess founder/team strength, execution pace, adaptability, vision clarity
              </p>
              <Controller
                name="teamCapabilityScore"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <div className="scoring-slider">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${field.value === score ? 'selected' : ''}`}
                        onClick={() => field.onChange(score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Compliance */}
            <div className="scoring-item">
              <div className="scoring-header">
                <h4>5. Compliance & Code of Conduct</h4>
                <span className="score-badge" style={{ backgroundColor: getStatusColor(overallStatus) }}>
                  Score: {complianceScore}/5
                </span>
              </div>
              <p className="scoring-description">
                Review incident history, ethical compliance, community standing
              </p>
              <Controller
                name="complianceScore"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <div className="scoring-slider">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${field.value === score ? 'selected' : ''}`}
                        onClick={() => field.onChange(score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Average Score */}
            <div className="average-score">
              <h4>Average Score: {calculateAverageScore()}/5</h4>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${(parseFloat(calculateAverageScore()) / 5) * 100}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Overall Status */}
        {activeTab === 1 && (
          <section className="form-section">
            <h3>{tabs[1].title}</h3>
            <p className="section-intro">
              Based on the assessment, assign an overall health status and provide justification.
            </p>

            <div className="status-selector">
              <h4>Overall Status *</h4>
              <div className="status-options">
                {['GREEN', 'AMBER', 'RED'].map((status) => (
                  <Controller
                    key={status}
                    name="overallStatus"
                    control={control}
                    render={({ field }) => (
                      <label
                        className={`status-option ${field.value === status ? 'selected' : ''}`}
                        style={field.value === status ? { borderColor: getStatusColor(status) } : {}}
                      >
                        <input
                          type="radio"
                          value={status}
                          checked={field.value === status}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <div className="status-content">
                          <div
                            className="status-indicator"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <div>
                            <strong>{status}</strong>
                            <p>
                              {status === 'GREEN' && 'On track, minimal intervention needed'}
                              {status === 'AMBER' && 'Needs support, at risk of failure'}
                              {status === 'RED' && 'Critical risk, placed on probation'}
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Status Justification (Why this status?) *</label>
              <Controller
                name="statusJustification"
                control={control}
                rules={{
                  required: 'Please justify the status',
                  minLength: { value: 20, message: 'Min 20 characters' },
                  maxLength: { value: 1000, message: 'Max 1000 characters' },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control"
                    rows={4}
                    placeholder="Explain the key factors driving this assessment..."
                  />
                )}
              />
              {errors.statusJustification && (
                <span className="error-message">{errors.statusJustification.message}</span>
              )}
            </div>
          </section>
        )}

        {/* Tab 3: Risk Assessment */}
        {activeTab === 2 && (
          <section className="form-section">
            <h3>{tabs[2].title}</h3>
            <p className="section-intro">
              Document specific concerns and recommend targeted interventions.
            </p>

            <div className="form-group">
              <label>Key Strengths *</label>
              <Controller
                name="strengths"
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
                    placeholder="List 2-3 key strengths of the startup..."
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label>Critical Concerns *</label>
              <Controller
                name="concerns"
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
                    placeholder="What are the biggest risks and concerns?"
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label>Recommended Interventions & Support *</label>
              <Controller
                name="recommendedInterventions"
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
                    placeholder="What specific actions should SEIC take to support this startup?"
                  />
                )}
              />
            </div>

            {overallStatus === 'RED' && (
              <div className="form-group red-escalation">
                <h4>🚨 RED-Flagged Startup Escalation</h4>
                <p>
                  This startup will be placed on probation and reported to the SEIC Ethics Committee.
                </p>
                <label>Escalation Justification *</label>
                <Controller
                  name="escalationJustification"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="form-control"
                      rows={3}
                      placeholder="Explain why probation is necessary..."
                    />
                  )}
                />
              </div>
            )}
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (activeTab > 0) {
                setActiveTab(activeTab - 1);
              } else if (onCancel) {
                onCancel();
              }
            }}
          >
            {activeTab === 0 ? 'Cancel' : '← Previous'}
          </button>

          {activeTab < tabs.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab(activeTab + 1)}
            >
              Next Tab →
            </button>
          ) : (
            <button
              type="submit"
              className={`btn btn-success`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : '✓ Submit Assessment'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default HealthCheckForm;
