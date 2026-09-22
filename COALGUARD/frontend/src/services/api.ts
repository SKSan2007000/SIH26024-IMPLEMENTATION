// CoalGuard AI - Unified Frontend API Service Layer

import { authFetch } from './AuthContext';

const API_BASE_URL = "/api";

export interface Region {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  region_id: string;
  created_at: string;
}

export interface MineZone {
  id: string;
  mine_id: string;
  name: string;
  zone_code: string;
  zone_type: string;
  risk_level: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  elevation_meters?: number;
  current_risk_score?: number;
  description?: string;
}

export interface Mine {
  id: string;
  name: string;
  code: string;
  region_id: string;
  area_id: string;
  mine_type?: string;
  production_category?: string;
  production_capacity?: string;
  status: string;
  state?: string;
  region?: string;
  risk_score?: number;
  risk_level?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  zones?: MineZone[];
}

export interface Inspection {
  id: string;
  mine_id: string;
  inspector_name: string;
  inspector_role?: string;
  agency?: string;
  inspection_type?: string;
  inspection_date: string;
  summary?: string;
  findings?: string;
  findings_summary?: string;
  status?: string;
  violations_found?: number;
  critical_violations?: number;
  actions_generated?: number;
  score?: number;
}

export interface SafetyReport {
  id: string;
  mine_id: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  title?: string;
  description: string;
  location?: string;
  location_details?: string;
  injured_count?: number;
  injuries_count?: number;
  reported_by?: string;
  reported_at?: string;
  created_at?: string;
  status?: string;
  corrective_action_required?: boolean;
}

export interface GovernanceAction {
  id: string;
  mine_id: string;
  title: string;
  description: string;
  issue_type: string;
  department?: string;
  priority: string;
  status: string;
  escalation_level?: number;
  assigned_to?: string;
  assigned_to_user?: { id: string; full_name: string; role: string };
  assigned_to_role?: string;
  deadline?: string;
  is_overdue?: boolean;
  risk_score_before?: number;
  risk_score_after?: number;
  points_awarded?: number;
  created_at: string;
  verified_at?: string;
  notes?: string;
  evidence_count?: number;
  field_evidences?: any[];
}

export interface ComplianceDoc {
  id: string;
  mine_id: string;
  document_type: string;
  document_number?: string;
  title?: string;
  description?: string;
  file_name?: string;
  valid_from: string;
  valid_to: string;
  expiry_date?: string;
  days_remaining?: number;
  status: string;
  issuing_authority?: string;
  file_url?: string;
  uploaded_at?: string;
  created_at?: string;
}

export interface Contractor {
  id: string;
  mine_id: string;
  name?: string;
  company_name?: string;
  service_type?: string;
  contract_type?: string;
  contact_person?: string;
  contact_phone?: string;
  worker_count?: number;
  total_workers?: number;
  trained_worker_count?: number;
  trained_workers?: number;
  ppe_compliance_rate?: number;
  safety_score: number;
  status: string;
  valid_until?: string;
  contract_valid_until?: string;
  created_at?: string;
}

export interface DailyTask {
  id: string;
  mine_id: string;
  task_name?: string;
  title?: string;
  description?: string;
  task_category?: string;
  priority?: string;
  role?: string;
  assigned_role?: string;
  shift?: string;
  status: string;
  due_date: string;
  points?: number;
  is_overdue?: boolean;
  created_at?: string;
}

export interface EnvironmentReading {
  id: string;
  mine_id: string;
  recorded_at: string;
  pm25?: number;
  pm10?: number;
  so2?: number;
  nox?: number;
  no2?: number;
  water_ph?: number;
  water_tss?: number;
  noise_db?: number;
  noise_day_db?: number;
  noise_night_db?: number;
  source?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  mine_id?: string;
  user_id?: string;
  actor_email?: string;
  action?: string;
  action_id?: string;
  event_type: string;
  resource_type?: string;
  resource_id?: string;
  old_status?: string;
  new_status?: string;
  timestamp?: string;
  created_at?: string;
  details?: any;
}

export interface TimelineEvent {
  id: string;
  mine_id: string;
  event_type: string;
  department?: string;
  title: string;
  description: string;
  severity?: string;
  actor_name?: string;
  actor_role?: string;
  created_at: string;
  details?: any;
}

export interface ComponentScore {
  name: string;
  score: number;
  max_score: number;
  description: string;
}

export interface GovernanceScoreResponse {
  mine_id: string;
  governance_score: number;
  governance_level: string;
  component_scores: ComponentScore[];
  calculation_version: string;
  calculated_at: string;
  explanation: string;
  positive_contributors: string[];
  negative_contributors: string[];
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  region_id?: string;
  area_id?: string;
  mine_id?: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
}

export const api = {
  // 1. Core Metadata
  getRegions: async (): Promise<Region[]> => {
    const res = await authFetch(`${API_BASE_URL}/regions/`);
    if (!res.ok) throw new Error("Failed to fetch regions");
    return res.json();
  },
  
  getAreas: async (): Promise<Area[]> => {
    const res = await authFetch(`${API_BASE_URL}/areas/`);
    if (!res.ok) throw new Error("Failed to fetch areas");
    return res.json();
  },
  
  getMines: async (): Promise<Mine[]> => {
    const res = await authFetch(`${API_BASE_URL}/mines/`);
    if (!res.ok) throw new Error("Failed to fetch mines");
    return res.json();
  },

  getMineById: async (mineId: string): Promise<Mine> => {
    const res = await authFetch(`${API_BASE_URL}/mines/${mineId}`);
    if (!res.ok) throw new Error("Failed to fetch mine details");
    return res.json();
  },

  getMineZones: async (mineId: string): Promise<MineZone[]> => {
    const res = await authFetch(`${API_BASE_URL}/zones/mine/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getDepartments: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/departments/`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    return res.json();
  },
  
  getUsers: async (): Promise<User[]> => {
    const res = await authFetch(`${API_BASE_URL}/users/`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  // 2. Command Center & Overview
  getCommandCenterOverview: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/command-center/overview`);
    if (!res.ok) throw new Error("Failed to fetch command center overview");
    return res.json();
  },

  getCommandCenterMines: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/command-center/mines`);
    if (!res.ok) throw new Error("Failed to fetch command center mines");
    return res.json();
  },

  getCommandCenterMineIntelligence: async (mineId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/command-center/mine/${mineId}`);
    if (!res.ok) throw new Error("Failed to fetch mine intelligence");
    return res.json();
  },

  getCommandCenterActivity: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/command-center/activity`);
    if (!res.ok) throw new Error("Failed to fetch activity");
    return res.json();
  },

  // 3. Risk Engine & SHAP
  getRiskSummary: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/reports/risk-summary`);
    if (!res.ok) throw new Error("Failed to fetch risk summary");
    return res.json();
  },

  getRiskPriority: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/risk/priority`);
    if (!res.ok) throw new Error("Failed to fetch risk priority queue");
    return res.json();
  },

  calculateMineRisk: async (mineId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/risk/calculate/${mineId}`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to calculate risk");
    return res.json();
  },

  getMineRiskHistory: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/risk/mine/${mineId}/history`);
    if (!res.ok) return [];
    return res.json();
  },

  getMineIntelligence: async (mineId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/ml/intelligence/${mineId}`);
    if (!res.ok) throw new Error("Failed to fetch intelligence triad");
    return res.json();
  },

  getMineExplanation: async (mineId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/ml/explain/${mineId}`);
    if (!res.ok) throw new Error("Failed to fetch SHAP explanation");
    return res.json();
  },

  runRiskSimulation: async (mineId: string, role: string, overrides: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/risk/simulate/${mineId}?role=${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overrides)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Simulation failed");
    }
    return res.json();
  },

  // 4. Corrective Actions & Closed-Loop Verifications
  getGovernanceActions: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/governance/actions/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getAllCorrectiveActions: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/corrective-actions/`);
    if (!res.ok) return [];
    return res.json();
  },

  createCorrectiveAction: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/corrective-actions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create corrective action");
    return res.json();
  },

  updateActionStatus: async (actionId: string, status: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/governance/actions/${actionId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error("Failed to update action status");
    return res.json();
  },

  verifyActionClosedLoop: async (actionId: string, notes?: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/verifications/${actionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to verify action");
    }
    return res.json();
  },

  getMineVerifications: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/verifications/mine/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 5. Field Evidence & AI Analysis
  submitFieldEvidence: async (formData: FormData): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/field-evidence/`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit field evidence");
    }
    return res.json();
  },

  submitActionForReview: async (actionId: string, submitterId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('submitter_id', submitterId);
    const res = await authFetch(`${API_BASE_URL}/field-evidence/${actionId}/submit-for-review`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit action for review");
    }
    return res.json();
  },

  getEvidenceForAction: async (actionId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/field-evidence/action/${actionId}`);
    if (!res.ok) return [];
    return res.json();
  },

  analyzeEvidence: async (evidenceId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/field-evidence/${evidenceId}/analyze`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to analyze evidence");
    }
    return res.json();
  },

  getEvidenceAnalysis: async (evidenceId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/field-evidence/${evidenceId}/analysis`);
    if (!res.ok) return null;
    return res.json();
  },

  // 6. Governance Recommendations
  getGovernanceRecommendations: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/governance/recommendations/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  acceptRecommendation: async (recId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/governance/recommendations/${recId}/accept`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error("Failed to accept recommendation");
    return res.json();
  },

  rejectRecommendation: async (recId: string, reason: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/governance/recommendations/${recId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error("Failed to reject recommendation");
    return res.json();
  },

  // 7. Departments: Safety, Environment, Contractors, Inspections, Compliance
  getSafetyReports: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/safety-reports/?mine_id=${mineId}` : `${API_BASE_URL}/safety-reports/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  submitSafetyReport: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/safety-reports/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit safety report");
    return res.json();
  },

  getEnvironmentReadings: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/environment/?mine_id=${mineId}` : `${API_BASE_URL}/environment/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  submitEnvironmentReading: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/environment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit environmental reading");
    return res.json();
  },

  getContractors: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/contractors/?mine_id=${mineId}` : `${API_BASE_URL}/contractors/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  getInspections: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/inspections/?mine_id=${mineId}` : `${API_BASE_URL}/inspections/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  getComplianceDocuments: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/compliance/?mine_id=${mineId}` : `${API_BASE_URL}/compliance/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  // 8. Daily Tasks & Reporting
  getDailyTasks: async (mineId?: string, role?: string): Promise<any[]> => {
    let url = `${API_BASE_URL}/tasks`;
    const params = new URLSearchParams();
    if (mineId) params.append('mine_id', mineId);
    if (role) params.append('role', role);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  updateDailyTaskStatus: async (taskId: string, status: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Failed to update daily task status");
    return res.json();
  },

  triggerDailyTasksGeneration: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/tasks/generate-daily`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to generate daily tasks");
    return res.json();
  },

  // 9. IoT Sensors & Live Telemetry
  getMineSensors: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/iot/sensors/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getSensorTelemetry: async (sensorId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/iot/telemetry/${sensorId}`);
    if (!res.ok) return [];
    return res.json();
  },

  generateDemoTelemetry: async (mineId: string, eventType: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/iot/demo/generate/${mineId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor_id: "ALL", event_type: eventType })
    });
    if (!res.ok) throw new Error("Failed to generate demo telemetry");
    return res.json();
  },

  ingestSensorReading: async (sensorId: string, value: number, quality: string = "GOOD"): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/iot/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor_id: sensorId, value, quality })
    });
    if (!res.ok) throw new Error("Failed to ingest sensor telemetry");
    return res.json();
  },

  // 10. Incident Reports (Internal & Public)
  getMineIncidents: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/incident-reports/mine/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getAllIncidents: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/incident-reports/`);
    if (!res.ok) return [];
    return res.json();
  },

  submitIncident: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/incident-reports/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit incident");
    return res.json();
  },

  submitPublicIncident: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/incident-reports/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit public incident");
    return res.json();
  },

  updateIncidentStatus: async (reportId: string, status: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/incident-reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Failed to update incident status");
    return res.json();
  },

  // 11. Governance Score & Leaderboard
  getGovernanceScore: async (mineId: string): Promise<GovernanceScoreResponse> => {
    const res = await authFetch(`${API_BASE_URL}/governance-score/mine/${mineId}`);
    if (!res.ok) throw new Error("Failed to fetch governance score");
    return res.json();
  },

  getGovernanceLeaderboard: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/governance-score/leaderboard`);
    if (!res.ok) return [];
    return res.json();
  },

  getGovernancePointTransactions: async (mineId?: string, userId?: string): Promise<any[]> => {
    let url = `${API_BASE_URL}/governance-score/transactions`;
    const params = new URLSearchParams();
    if (mineId) params.append('mine_id', mineId);
    if (userId) params.append('user_id', userId);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  // 12. Timeline & Audit Trail
  getMineTimeline: async (mineId: string): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/timeline/mine/${mineId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getAllTimeline: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/timeline/`);
    if (!res.ok) return [];
    return res.json();
  },

  getAuditTrail: async (mineId?: string): Promise<any[]> => {
    const url = mineId ? `${API_BASE_URL}/audit/?mine_id=${mineId}` : `${API_BASE_URL}/audit/`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  // 13. Notifications
  getNotifications: async (): Promise<any[]> => {
    const res = await authFetch(`${API_BASE_URL}/notifications/`);
    if (!res.ok) return [];
    return res.json();
  },

  markNotificationRead: async (notifId: string): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/notifications/${notifId}/read`, { method: 'POST' });
    if (!res.ok) return null;
    return res.json();
  },

  // 14. Settings
  getSystemSettings: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/settings/`);
    if (!res.ok) return {};
    return res.json();
  },

  updateSystemSettings: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/settings/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update system settings");
    return res.json();
  },

  // 15. Demo Tools
  demoReset: async (): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to reset demo");
    return res.json();
  },

  demoFastForwardEscalation: async (days: number = 1): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/governance/demo/escalate?days=${days}`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to fast-forward escalation");
    return res.json();
  },

  // 16. Aliases & Convenience Helpers
  createMine: async (data: any): Promise<Mine> => {
    const res = await authFetch(`${API_BASE_URL}/mines/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create mine");
    }
    return res.json();
  },

  getMine: async (mineId: string): Promise<Mine> => {
    return api.getMineById(mineId);
  },

  createInspection: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/inspections/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create inspection");
    }
    return res.json();
  },

  createSafetyReport: async (data: any): Promise<any> => {
    return api.submitSafetyReport(data);
  },

  getTimelineEvents: async (mineId?: string): Promise<any[]> => {
    return mineId ? api.getMineTimeline(mineId) : api.getAllTimeline();
  },

  getSettings: async (): Promise<any> => {
    return api.getSystemSettings();
  },

  updateSettings: async (data: any): Promise<any> => {
    return api.updateSystemSettings(data);
  },

  register: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  getComplianceDocs: async (mineId?: string): Promise<ComplianceDoc[]> => {
    return api.getComplianceDocuments(mineId);
  },

  uploadComplianceDoc: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/compliance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload compliance document");
    }
    return res.json();
  },

  createContractor: async (data: any): Promise<any> => {
    const res = await authFetch(`${API_BASE_URL}/contractors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create contractor");
    }
    return res.json();
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<any> => {
    return api.updateDailyTaskStatus(taskId, status);
  },

  createEnvironmentReading: async (data: any): Promise<any> => {
    return api.submitEnvironmentReading(data);
  },

  getGovernanceTransactions: async (mineId?: string, userId?: string): Promise<any[]> => {
    return api.getGovernancePointTransactions(mineId, userId);
  },

  getPublicReports: async (): Promise<any[]> => {
    return api.getAllIncidents();
  },

  getAuditLogs: async (mineId?: string): Promise<AuditLog[]> => {
    return api.getAuditTrail(mineId);
  }
};
