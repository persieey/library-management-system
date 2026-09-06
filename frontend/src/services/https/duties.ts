import { apiFetch } from './index'
import type { DutyDraft, DutyShift } from '../../interface/IDutyInterface'

// ตารางเวรเป็นส่วนหนึ่งของงานบุคลากร ทุกตำแหน่งดูได้ จัดเวรได้เฉพาะหัวหน้าหอสมุด
const ENDPOINT = '/api/v1/duties'

/** เวรในช่วงวันที่ที่ขอ ไม่ส่งช่วงมาก็ได้ทั้งหมด */
export function listDuties(token: string, range?: { from: string; to: string }) {
  const q = range ? `?from=${range.from}&to=${range.to}` : ''
  return apiFetch<DutyShift[]>(`${ENDPOINT}${q}`, { token })
}

export function createDuty(token: string, body: DutyDraft) {
  return apiFetch<DutyShift>(ENDPOINT, { method: 'POST', token, body })
}

export function updateDuty(token: string, id: number, body: DutyDraft) {
  return apiFetch<DutyShift>(`${ENDPOINT}/${id}`, { method: 'PUT', token, body })
}

export function deleteDuty(token: string, id: number) {
  return apiFetch<{ message: string }>(`${ENDPOINT}/${id}`, { method: 'DELETE', token })
}
