import { apiFetch } from './index'
import type { ComplaintDraft, ComplaintRequest } from '../../interface/IComplaintInterface'

// ระบบร้องเรียนเป็นของ B6707590 (ธนกร) ฝั่งนี้มีแค่ทางส่งเรื่องจากหน้าเว็บสาธารณะ
// เพราะคนที่ยังไม่ล็อกอินก็แจ้งเรื่องได้ จึงใช้ apiFetch ที่ส่ง token แบบไม่บังคับ
// ส่วนหน้าหลังบ้านของเจ้าหน้าที่ใช้ services/complaintService.ts ของเขาตรงๆ
// controller ของเขาห่อข้อมูลไว้ใน { data: ... } ต่างจาก endpoint อื่นของทีมที่ตอบตรงๆ
const ENDPOINT = '/api/v1/complaints'

/** รูปที่ backend ส่งกลับมาต่อหนึ่งเรื่อง */
export interface Complaint {
  complaint_id: string
  user_id: number | null
  department_id: string | null
  department_name: string
  topic: string
  category: string
  description: string
  location: string
  priority: string
  attached_image: string
  submit_date: string
  submit_time: string
  status: string
  inspector_report: string
  reject_reason: string
  resolution_summary: string
  resolution_image: string
  inspector_name: string
}

interface Wrapped<T> {
  data: T
}

function toRequest(draft: ComplaintDraft, userId?: number): ComplaintRequest {
  return {
    topic: draft.topic.trim(),
    category: draft.category,
    priority: draft.priority,
    description: draft.description.trim(),
    location: draft.location.trim(),
    // ไม่ส่งฟิลด์รูปขึ้นไปเลยถ้าไม่ได้แนบ จะได้ไม่ต้องส่งสตริงว่างให้เปลืองคำขอ
    ...(draft.attachedImage ? { attached_image: draft.attachedImage } : {}),
    ...(userId ? { user_id: userId } : {}),
  }
}

/**
 * ส่งเรื่องร้องเรียนหรือข้อเสนอแนะ
 * ส่ง token ไปด้วยถ้าล็อกอินอยู่ เพื่อให้ผูกเรื่องกับบัญชีได้ แต่คนที่ไม่ได้ล็อกอินก็แจ้งได้
 */
export function createComplaint(draft: ComplaintDraft, token?: string | null, userId?: number) {
  return apiFetch<Wrapped<Complaint>>(ENDPOINT, {
    method: 'POST',
    token: token ?? undefined,
    body: toRequest(draft, userId),
  })
}
