import { apiFetch } from './index'

const token = () => localStorage.getItem('auth_token')

export interface AuditStats {
  total_assets: number
  pending_audit: number
  audited: number
  discrepancies: number
}

// Maps to backend InspectReport model
export interface AuditSession {
  id: number          // ReportID
  location: string    // Location
  audit_date: string  // ReportDate
  auditor_name: string
  employee_id: string
  status: string      // draft | submitted | approved | rejected
  summary: string
  recommendation: string
  submitted_at: string | null
  reviewer_name?: string
  review_note?: string
  reviewed_at?: string | null
  rows?: AuditRow[]
  discrepancies?: Discrepancy[]
}

// Maps to backend Inspect model
export interface AuditRow {
  inspect_id: string
  session_id: number  // ReportID
  asset_id: string    // AssetID
  asset_code: string
  asset_name: string
  expected: number    // ExpectedQty
  found: number       // FoundQty
  condition: string
  note: string
  employee_id: string
}

export interface Discrepancy {
  id: number
  session_id: number
  asset_code: string
  asset_name: string
  type: string
  expected: string
  actual: string
  cause: string
  action: string
}

export const auditApi = {
  getStats: () => apiFetch<AuditStats>('/api/v1/audit/stats', { token: token() }),
  listSessions: () => apiFetch<AuditSession[]>('/api/v1/audit/sessions', { token: token() }),
  createSession: (body: { location: string; audit_date: string }) =>
    apiFetch<AuditSession>('/api/v1/audit/sessions', { method: 'POST', token: token(), body }),
  getSession: (id: number) =>
    apiFetch<AuditSession>(`/api/v1/audit/sessions/${id}`, { token: token() }),
  updateSession: (id: number, body: { summary?: string; recommendation?: string; status?: string }) =>
    apiFetch<AuditSession>(`/api/v1/audit/sessions/${id}`, { method: 'PUT', token: token(), body }),
  saveRows: (id: number, rows: Omit<AuditRow, 'inspect_id' | 'session_id' | 'employee_id'>[]) =>
    apiFetch<AuditRow[]>(`/api/v1/audit/sessions/${id}/rows`, {
      method: 'POST', token: token(), body: { rows },
    }),
  addDiscrepancy: (id: number, body: Omit<Discrepancy, 'id' | 'session_id'>) =>
    apiFetch<Discrepancy>(`/api/v1/audit/sessions/${id}/discrepancies`, {
      method: 'POST', token: token(), body,
    }),
  deleteDiscrepancy: (discId: number) =>
    apiFetch<void>(`/api/v1/audit/discrepancies/${discId}`, { method: 'DELETE', token: token() }),
  submitReport: (id: number, note: string) =>
    apiFetch<AuditSession>(`/api/v1/audit/sessions/${id}/submit`, {
      method: 'POST', token: token(), body: { note },
    }),
  reviewReport: (id: number, action: 'approve' | 'reject', note: string) =>
    apiFetch<AuditSession>(`/api/v1/audit/sessions/${id}/review`, {
      method: 'POST', token: token(), body: { action, note },
    }),
}

const SESSION_KEY = 'audit_session_id'
export const activeSession = {
  get: (): number | null => {
    try {
      const v = sessionStorage.getItem(SESSION_KEY)
      return v ? Number(v) : null
    } catch {
      return null
    }
  },
  set: (id: number) => {
    try { sessionStorage.setItem(SESSION_KEY, String(id)) } catch {}
  },
  clear: () => {
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  },
}
