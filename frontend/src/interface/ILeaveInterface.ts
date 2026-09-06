// รูปข้อมูลการลา ตรงกับ models.LeaveRequest ฝั่ง Go

export type LeaveType = 'sick' | 'personal' | 'vacation'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'canceled'

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  sick: 'ลาป่วย',
  personal: 'ลากิจ',
  vacation: 'ลาพักผ่อน',
}

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  canceled: 'ยกเลิกแล้ว',
}

/** ใช้กับ <StatusBadge variant> ให้สีตรงกับสถานะ */
export const LEAVE_STATUS_VARIANT: Record<LeaveStatus, 'pending' | 'approved' | 'rejected' | 'ended'> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  canceled: 'ended',
}

export interface LeaveRequest {
  id: number
  user_id: number
  leave_type: LeaveType
  /** YYYY-MM-DD */
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  approver_id?: number
  decided_at?: string
  decision_note: string
  created_at: string
  /** ชื่อคน เซิร์ฟเวอร์เติมมาให้ ไม่ได้เก็บในตาราง */
  user_name: string
  approver_name: string
}

/** ส่งไป POST /leaves */
export interface LeaveDraft {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
}
