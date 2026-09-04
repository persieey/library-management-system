import { apiFetch } from './index'
import type { ComplaintDraft, ComplaintRequest } from '../../interface/IComplaintInterface'

// ระบบร้องเรียนเป็นของ B6707590 (ธนกร) ฝั่งนี้เป็นแค่หน้าจอที่ส่งเรื่องเข้าไป
// เส้นทางใช้ /api/v1/complaints ตามข้อตกลงของทีม (ของเดิมเขาเขียนไว้เป็น /api/complaints)
const ENDPOINT = '/api/v1/complaints'

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
  return apiFetch<{ message?: string }>(ENDPOINT, {
    method: 'POST',
    token: token ?? undefined,
    body: toRequest(draft, userId),
  })
}
