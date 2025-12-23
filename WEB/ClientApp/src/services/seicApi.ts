/**
 * SEIC API Service Layer
 * Centralized HTTP client for all SEIC M&E endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Client
const client: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token (if needed)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ============= STARTUP PROFILE ENDPOINTS =============

export const StartupAPI = {
  // Get all startups with optional filters
  getAll: async (status?: string, cohort?: string, sector?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (cohort) params.append('cohort', cohort);
    if (sector) params.append('sector', sector);
    return client.get(`/seicstartup?${params.toString()}`);
  },

  // Get specific startup
  getById: async (id: number) => client.get(`/seicstartup/${id}`),

  // Create new startup
  create: async (data: any) => client.post('/seicstartup', data),

  // Update startup
  update: async (id: number, data: any) => client.put(`/seicstartup/${id}`, data),

  // Update startup status
  updateStatus: async (id: number, status: string) =>
    client.patch(`/seicstartup/${id}/status`, { status }),

  // Get cohort startups
  getCohortStartups: async (cohort: string) =>
    client.get(`/seicstartup/cohort/${cohort}`),
};

// ============= MONTHLY REPORT ENDPOINTS =============

export const MonthlyReportAPI = {
  // Get latest report
  getLatest: async (startupId: number) =>
    client.get(`/seicmonthlyreport/${startupId}/latest`),

  // Get report history
  getHistory: async (startupId: number) =>
    client.get(`/seicmonthlyreport/${startupId}/history`),

  // Get specific month report
  getByMonth: async (startupId: number, year: number, month: number) =>
    client.get(`/seicmonthlyreport/${startupId}/${year}/${month}`),

  // Submit new report
  submit: async (data: any) => client.post('/seicmonthlyreport', data),

  // Update draft report
  update: async (id: number, data: any) =>
    client.put(`/seicmonthlyreport/${id}`, data),

  // Finalize report submission
  submitDraft: async (id: number) =>
    client.patch(`/seicmonthlyreport/${id}/submit`),

  // Get overdue reports
  getOverdue: async () => client.get('/seicmonthlyreport/pending/overdue'),

  // Bulk import reports
  bulkImport: async (reports: any[]) =>
    client.post('/seicmonthlyreport/bulk', reports),
};

// ============= HEALTH CHECK ENDPOINTS =============

export const HealthCheckAPI = {
  // Get latest health check
  getLatest: async (startupId: number) =>
    client.get(`/seichealthcheck/${startupId}/latest`),

  // Get health check history
  getHistory: async (startupId: number) =>
    client.get(`/seichealthcheck/${startupId}/history`),

  // Get red-flagged startups
  getRedFlagged: async () => client.get('/seichealthcheck/status/red-flagged'),

  // Get status summary
  getStatusSummary: async () =>
    client.get('/seichealthcheck/dashboard/status-summary'),

  // Create health check
  create: async (data: any) => client.post('/seichealthcheck', data),

  // Update health check
  update: async (id: number, data: any) =>
    client.put(`/seichealthcheck/${id}`, data),

  // Submit health check
  submit: async (id: number) =>
    client.patch(`/seichealthcheck/${id}/submit`),

  // Escalate red-flagged startup
  escalate: async (startupId: number, note: string) =>
    client.post(`/seichealthcheck/${startupId}/escalate-red`, { escalationNote: note }),
};

// ============= INCIDENT REPORT ENDPOINTS =============

export const IncidentReportAPI = {
  // Get all incidents
  getAll: async (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    return client.get(`/seicincidentreport?${params.toString()}`);
  },

  // Get specific incident
  getById: async (id: number) => client.get(`/seicincidentreport/${id}`),

  // Submit new incident report
  submit: async (data: any) => client.post('/seicincidentreport', data),

  // Acknowledge report
  acknowledge: async (id: number) =>
    client.patch(`/seicincidentreport/${id}/acknowledge`),

  // Update investigation
  updateInvestigation: async (id: number, notes: string) =>
    client.put(`/seicincidentreport/${id}/investigate`, { investigationNotes: notes }),

  // Resolve incident
  resolve: async (id: number, resolution: string) =>
    client.patch(`/seicincidentreport/${id}/resolve`, { resolution }),

  // Get incident analytics
  getAnalytics: async () =>
    client.get('/seicincidentreport/analytics/dashboard'),

  // Get critical incidents
  getCritical: async () => client.get('/seicincidentreport/critical/active'),
};

// ============= GRANT PIPELINE ENDPOINTS =============

export const GrantPipelineAPI = {
  // Get all grants
  getAll: async (stage?: string, startupId?: number) => {
    const params = new URLSearchParams();
    if (stage) params.append('stage', stage);
    if (startupId) params.append('startupId', startupId.toString());
    return client.get(`/seicgrantpipeline?${params.toString()}`);
  },

  // Get startup grants
  getStartupGrants: async (startupId: number) =>
    client.get(`/seicgrantpipeline/${startupId}/applications`),

  // Get upcoming deadlines
  getUpcoming: async () => client.get('/seicgrantpipeline/status/upcoming'),

  // Get pipeline analytics
  getAnalytics: async () => client.get('/seicgrantpipeline/analytics/pipeline'),

  // Create grant
  create: async (data: any) => client.post('/seicgrantpipeline', data),

  // Update grant
  update: async (id: number, data: any) =>
    client.put(`/seicgrantpipeline/${id}`, data),

  // Advance grant stage
  advanceStage: async (id: number, notes?: string) =>
    client.patch(`/seicgrantpipeline/${id}/advance`, { notes }),

  // Reject grant
  reject: async (id: number, reason: string) =>
    client.patch(`/seicgrantpipeline/${id}/reject`, reason),
};

// ============= DASHBOARD ENDPOINTS =============

export const DashboardAPI = {
  // Get executive summary
  getExecutiveSummary: async () =>
    client.get('/seicdashboard/executive-summary'),

  // Get cohort performance
  getCohortPerformance: async (cohort: string) =>
    client.get(`/seicdashboard/cohort/${cohort}/performance`),

  // Get stage distribution
  getStageDistribution: async () =>
    client.get('/seicdashboard/stage-distribution'),

  // Get sector performance
  getSectorPerformance: async () =>
    client.get('/seicdashboard/sector-performance'),

  // Get needs analysis
  getNeedsAnalysis: async () =>
    client.get('/seicdashboard/needs-analysis'),
};

export default client;
