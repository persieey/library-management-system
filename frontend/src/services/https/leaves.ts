import { apiFetch } from './index'
import type { LeaveDraft, LeaveRequest } from '../../interface/ILeaveInterface'

// การลาเป็นส่วนหนึ่งของงานบุคลากร พนักงานยื่นเอง หัวหน้าหอสมุดเป็นคนอนุมัติ
const ENDPOINT = '/api/v1/leaves'

/** ยื่นคำขอลา เซิร์ฟเวอร์ยึดว่าใครยื่นจาก token ไม่ต้องส่ง user_id */
export function createLeave(token: string, body: LeaveDraft) {
  return apiFetch<LeaveRequest>(ENDPOINT, { method: 'POST', token, body })
}

/** คำขอลาของตัวเอง พนักงานทุกตำแหน่งเรียกได้ */
export function listMyLeaves(token: string) {
  return apiFetch<LeaveRequest[]>(`${ENDPOINT}/mine`, { token })
}

/** คำขอลาของทุกคน เฉพาะหัวหน้าหอสมุด */
export function listAllLeaves(token: string) {
  return apiFetch<LeaveRequest[]>(ENDPOINT, { token })
}

/** หัวหน้าอนุมัติหรือไม่อนุมัติ */
export function decideLeave(
  token: string,
  id: number,
  body: { status: 'approved' | 'rejected'; decision_note?: string },
) {
  return apiFetch<LeaveRequest>(`${ENDPOINT}/${id}/decide`, { method: 'PUT', token, body })
}

/** เจ้าของยกเลิกคำขอตัวเอง ทำได้เฉพาะตอนยังไม่ถูกพิจารณา */
export function cancelLeave(token: string, id: number) {
  return apiFetch<LeaveRequest>(`${ENDPOINT}/${id}/cancel`, { method: 'PUT', token })
}
