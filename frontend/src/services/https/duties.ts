import { apiFetch } from './index'
import type { DutyDraft, DutyShift, ServicePoint } from '../../interface/IDutyInterface'

// ตารางเวรเป็นส่วนหนึ่งของงานบุคลากร ทุกตำแหน่งดูได้ จัดเวรได้เฉพาะหัวหน้าหอสมุด
const ENDPOINT = '/api/v1/duties'

/** จุดบริการที่ยังเปิดใช้ เรียงตามลำดับที่ควรแสดง */
export function listServicePoints(token: string) {
  return apiFetch<ServicePoint[]>(`${ENDPOINT}/service-points`, { token })
}

/** การมอบหมายเวรในช่วงวันที่ที่ขอ หนึ่งรายการคือคนหนึ่งคนประจำจุดหนึ่งจุด */
export function listDuties(token: string, range?: { from: string; to: string }) {
  const q = range ? `?from=${range.from}&to=${range.to}` : ''
  return apiFetch<DutyShift[]>(`${ENDPOINT}${q}`, { token })
}

export function createDuty(token: string, body: DutyDraft) {
  return apiFetch<DutyShift>(ENDPOINT, { method: 'POST', token, body })
}

/** ถอนคนออกจากเวร */
export function deleteDuty(token: string, id: number) {
  return apiFetch<{ message: string }>(`${ENDPOINT}/${id}`, { method: 'DELETE', token })
}
