import dayjs from 'dayjs'
import { apiFetch } from './index'
import type { PRDraft, PRItem, PRStatus } from '../../interface/IPRInterface'
import { formatThaiDate, parseThaiDate } from '../../pages/employees/pr/dateFormat'

// รูปแบบที่ backend ส่งมา — เป็น snake_case และเก็บเวลาเป็น ISO เสมอ
// การจัดรูปวันที่แบบไทยเป็นหน้าที่ของฝั่งนี้ ไม่ใช่ของเซิร์ฟเวอร์
interface PRResponse {
  id: number
  title: string
  content: string
  channel: string
  status: PRStatus
  pinned: boolean
  views: number
  published_at: string | null
  expires_at: string | null
  scheduled_at: string | null
}

// toPRItem แปลงข้อมูลจากเซิร์ฟเวอร์ให้เป็นรูปที่หน้าเว็บใช้อยู่เดิม
export function toPRItem(res: PRResponse): PRItem {
  return {
    id: res.id,
    pinned: res.pinned,
    status: res.status,
    title: res.title,
    content: res.content,
    channel: res.channel,
    publishedAt: res.published_at ? formatThaiDate(dayjs(res.published_at)) : '—',
    expiresAt: res.expires_at ? formatThaiDate(dayjs(res.expires_at)) : '—',
    views: res.views,
    scheduledAt: res.scheduled_at,
    publishedTimestamp: res.published_at ? dayjs(res.published_at).valueOf() : null,
  }
}

// toRequest แปลงข้อมูลจากฟอร์มกลับเป็นรูปที่เซิร์ฟเวอร์รับ
// วันที่ในฟอร์มเป็นข้อความไทย พ.ศ. จึงต้องแปลงกลับเป็น ISO ก่อนส่ง
function toRequest(draft: PRDraft) {
  const published = parseThaiDate(draft.publishedAt)
  const expires = parseThaiDate(draft.expiresAt)
  return {
    title: draft.title,
    content: draft.content,
    channel: draft.channel,
    status: draft.status,
    pinned: draft.pinned,
    published_at: published ? published.toISOString() : null,
    expires_at: expires ? expires.toISOString() : null,
    scheduled_at: draft.scheduledAt,
  }
}

export async function listPR(token: string | null): Promise<PRItem[]> {
  const items = await apiFetch<PRResponse[]>('/api/v1/pr', { token })
  return items.map(toPRItem)
}

export async function createPR(token: string, draft: PRDraft): Promise<PRItem> {
  const created = await apiFetch<PRResponse>('/api/v1/pr', {
    method: 'POST',
    token,
    body: toRequest(draft),
  })
  return toPRItem(created)
}

export async function updatePR(token: string, id: number, draft: PRDraft): Promise<PRItem> {
  const updated = await apiFetch<PRResponse>(`/api/v1/pr/${id}`, {
    method: 'PATCH',
    token,
    body: toRequest(draft),
  })
  return toPRItem(updated)
}

export function deletePR(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/pr/${id}`, { method: 'DELETE', token })
}

export async function togglePR(token: string, id: number): Promise<PRItem> {
  const item = await apiFetch<PRResponse>(`/api/v1/pr/${id}/toggle`, { method: 'POST', token })
  return toPRItem(item)
}

export async function copyPR(token: string, id: number): Promise<PRItem> {
  const item = await apiFetch<PRResponse>(`/api/v1/pr/${id}/copy`, { method: 'POST', token })
  return toPRItem(item)
}

// นับยอดเข้าชม — คนทั่วไปเรียกได้ ไม่ต้องล็อกอิน
export function viewPR(id: number) {
  return apiFetch<{ message: string }>(`/api/v1/pr/${id}/view`, { method: 'POST' })
}
