/**
 * Executive Dashboard Component
 * Comprehensive M&E KPI dashboard for SEIC Director
 * Shows real-time metrics, health status, funding pipeline, incidents
 */

import React, { useState, useEffect } from 'react';
import { DashboardAPI } from '../services/seicApi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  Timestamp: string;
  Section1_StartupRegistry: {
    TotalStartups: number;
    ActiveStartups: number;
    GraduatedStartups: number;
    ExitedStartups: number;
    OnProbation: number;
  };
  Section2_PulseFinancials: {
    CurrentMonthMetrics: {
      MonthlyRevenuePKR: number;
      MonthlyBurnRatePKR: number;
      ReportingRate: number;
    };
    YTDMetrics: {
      YTDRevenuePKR: number;
      YTDBurnRatePKR: number;
      YTDFundingRaisedPKR: number;
    };
    RevenueGrowth: number;
  };
  Section3_ImpactMetrics: {
    TotalEmployeesCreated: number;
    TotalCustomersAcquired: number;
    AverageBurnRate: number;
    AverageRunway: number;
  };
  Section4_HealthStatus: {
    TotalAssessed: number;
    Green: number;
    Amber: number;
    Red: number;
    GreenPercentage: number;
    AmberPercentage: number;
    RedPercentage: number;
  };
  Section5_GrantPipeline: {
    TotalOpportunities: number;
    TotalValueUSD: number;
    GrantsWonUSD: number;
    SuccessRatePercentage: number;
  };
  Section6_RiskManagement: {
    TotalIncidents: number;
    CriticalUnresolved: number;
    ResolutionRate: number;
  };
}

const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await DashboardAPI.getExecutiveSummary();
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
        <button
          className="btn btn-sm btn-outline-danger mt-2"
          onClick={loadDashboardData}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Prepare health status data for pie chart
  const healthData = [
    { name: 'Green (On Track)', value: data.Section4_HealthStatus.Green, color: '#28a745' },
    { name: 'Amber (Needs Support)', value: data.Section4_HealthStatus.Amber, color: '#ffc107' },
    { name: 'Red (At Risk)', value: data.Section4_HealthStatus.Red, color: '#dc3545' },
  ];

  // Prepare grant pipeline data
  const grantData = [
    { stage: 'Identified', count: 5, fill: '#e3f2fd' },
    { stage: 'Submitted', count: 3, fill: '#bbdefb' },
    { stage: 'Shortlisted', count: 2, fill: '#90caf9' },
    { stage: 'Won', count: data.Section5_GrantPipeline.GrantsWonUSD / 50000, fill: '#28a745' },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="executive-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📈 SEIC M&E Executive Dashboard</h1>
          <p className="last-updated">
            Last updated: {new Date(data.Timestamp).toLocaleString()}
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={loadDashboardData}
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards - Row 1: Startup Registry */}
      <section className="kpi-section">
        <h2>📋 Startup Registry Overview</h2>
        <div className="kpi-grid">
          <div className="kpi-card total">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>Total Startups</h3>
              <p className="kpi-value">{data.Section1_StartupRegistry.TotalStartups}</p>
            </div>
          </div>

          <div className="kpi-card active">
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <h3>Active Startups</h3>
              <p className="kpi-value">{data.Section1_StartupRegistry.ActiveStartups}</p>
            </div>
          </div>

          <div className="kpi-card graduated">
            <div className="kpi-icon">🎓</div>
            <div className="kpi-content">
              <h3>Graduated</h3>
              <p className="kpi-value">{data.Section1_StartupRegistry.GraduatedStartups}</p>
            </div>
          </div>

          <div className="kpi-card probation">
            <div className="kpi-icon">⚠️</div>
            <div className="kpi-content">
              <h3>On Probation</h3>
              <p className="kpi-value">{data.Section1_StartupRegistry.OnProbation}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards - Row 2: Financial Metrics */}
      <section className="kpi-section">
        <h2>💰 Financial Performance (Pulse System)</h2>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h3>Current Month Revenue</h3>
              <p className="kpi-value">PKR {formatCurrency(data.Section2_PulseFinancials.CurrentMonthMetrics.MonthlyRevenuePKR)}</p>
              <p className="kpi-growth positive">
                +{data.Section2_PulseFinancials.RevenueGrowth.toFixed(1)}% vs last month
              </p>
            </div>
          </div>

          <div className="kpi-card burnrate">
            <div className="kpi-icon">🔥</div>
            <div className="kpi-content">
              <h3>Current Month Burn</h3>
              <p className="kpi-value">PKR {formatCurrency(data.Section2_PulseFinancials.CurrentMonthMetrics.MonthlyBurnRatePKR)}</p>
            </div>
          </div>

          <div className="kpi-card ytd">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <h3>YTD Revenue</h3>
              <p className="kpi-value">PKR {formatCurrency(data.Section2_PulseFinancials.YTDMetrics.YTDRevenuePKR)}</p>
            </div>
          </div>

          <div className="kpi-card funding">
            <div className="kpi-icon">💵</div>
            <div className="kpi-content">
              <h3>YTD Funding Raised</h3>
              <p className="kpi-value">PKR {formatCurrency(data.Section2_PulseFinancials.YTDMetrics.YTDFundingRaisedPKR)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards - Row 3: Impact Metrics */}
      <section className="kpi-section">
        <h2>🚀 Social & Economic Impact</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <h3>Jobs Created (YTD)</h3>
              <p className="kpi-value">{data.Section3_ImpactMetrics.TotalEmployeesCreated}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">👤</div>
            <div className="kpi-content">
              <h3>Customers Acquired (YTD)</h3>
              <p className="kpi-value">{data.Section3_ImpactMetrics.TotalCustomersAcquired.toLocaleString()}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">⏱️</div>
            <div className="kpi-content">
              <h3>Average Runway</h3>
              <p className="kpi-value">{data.Section3_ImpactMetrics.AverageRunway.toFixed(1)} months</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>Report Submission</h3>
              <p className="kpi-value">{data.Section2_PulseFinancials.CurrentMonthMetrics.ReportingRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        <h2>📊 Analytics & Insights</h2>

        <div className="chart-tabs">
          <button
            className={`tab-btn ${selectedTab === 0 ? 'active' : ''}`}
            onClick={() => setSelectedTab(0)}
          >
            Health Status
          </button>
          <button
            className={`tab-btn ${selectedTab === 1 ? 'active' : ''}`}
            onClick={() => setSelectedTab(1)}
          >
            Grant Pipeline
          </button>
          <button
            className={`tab-btn ${selectedTab === 2 ? 'active' : ''}`}
            onClick={() => setSelectedTab(2)}
          >
            Risk Management
          </button>
        </div>

        {selectedTab === 0 && (
          <div className="chart-container">
            <div className="chart-wrapper">
              <h3>Health Check Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="status-summary">
                <div className="status-item green">
                  <strong>{data.Section4_HealthStatus.Green}</strong> Green ({data.Section4_HealthStatus.GreenPercentage.toFixed(1)}%)
                </div>
                <div className="status-item amber">
                  <strong>{data.Section4_HealthStatus.Amber}</strong> Amber ({data.Section4_HealthStatus.AmberPercentage.toFixed(1)}%)
                </div>
                <div className="status-item red">
                  <strong>{data.Section4_HealthStatus.Red}</strong> Red ({data.Section4_HealthStatus.RedPercentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 1 && (
          <div className="chart-container">
            <div className="chart-wrapper">
              <h3>Grant Pipeline Value</h3>
              <div className="grant-stats">
                <div className="grant-stat">
                  <h4>Total Opportunities</h4>
                  <p className="stat-value">{data.Section5_GrantPipeline.TotalOpportunities}</p>
                </div>
                <div className="grant-stat">
                  <h4>Total Value</h4>
                  <p className="stat-value">USD {formatCurrency(data.Section5_GrantPipeline.TotalValueUSD)}</p>
                </div>
                <div className="grant-stat">
                  <h4>Won</h4>
                  <p className="stat-value">USD {formatCurrency(data.Section5_GrantPipeline.GrantsWonUSD)}</p>
                </div>
                <div className="grant-stat">
                  <h4>Success Rate</h4>
                  <p className="stat-value">{data.Section5_GrantPipeline.SuccessRatePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 2 && (
          <div className="chart-container">
            <div className="chart-wrapper">
              <h3>Incident Management</h3>
              <div className="risk-stats">
                <div className="risk-stat">
                  <h4>Total Incidents</h4>
                  <p className="stat-value">{data.Section6_RiskManagement.TotalIncidents}</p>
                </div>
                <div className="risk-stat critical">
                  <h4>Critical Unresolved</h4>
                  <p className="stat-value">{data.Section6_RiskManagement.CriticalUnresolved}</p>
                </div>
                <div className="risk-stat">
                  <h4>Resolution Rate</h4>
                  <p className="stat-value">{data.Section6_RiskManagement.ResolutionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Action Alerts */}
      {data.Section4_HealthStatus.Red > 0 && (
        <section className="alert-section">
          <div className="alert alert-warning">
            <h3>⚠️ Action Required: {data.Section4_HealthStatus.Red} RED-Flagged Startup(s)</h3>
            <p>These startups require immediate intervention and are placed on probation.</p>
            <button className="btn btn-warning">View Red-Flagged Startups</button>
          </div>
        </section>
      )}

      {data.Section6_RiskManagement.CriticalUnresolved > 0 && (
        <section className="alert-section">
          <div className="alert alert-danger">
            <h3>🚨 Critical Incidents: {data.Section6_RiskManagement.CriticalUnresolved} Unresolved</h3>
            <p>Critical Code of Conduct violations require immediate escalation to the Ethics Committee.</p>
            <button className="btn btn-danger">View Critical Incidents</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ExecutiveDashboard;
