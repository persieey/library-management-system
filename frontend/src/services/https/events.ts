import { apiFetch } from './index'
import type { EventDraft, EventItem } from '../../interface/IEventInterface'
import imgEvent1 from '../../assets/event-1.png'
import imgEvent2 from '../../assets/event-2.png'
import imgEvent3 from '../../assets/event-3.png'

interface EventResponse {
  id: number
  title: string
  description: string
  location: string
  image: string
  start_at: string
  all_day: boolean
}

// รูปที่มากับหน้าเว็บ — เซิร์ฟเวอร์เก็บแค่ชื่อ ฝั่งนี้เป็นคนแปลงเป็นไฟล์จริง
// ส่วนรูปที่เจ้าหน้าที่อัปโหลดเองจะมาเป็น data URI จึงใช้ค่านั้นได้ตรงๆ
const BUNDLED_IMAGES: Record<string, string> = {
  'event-1': imgEvent1,
  'event-2': imgEvent2,
  'event-3': imgEvent3,
}

function resolveImage(image: string): string {
  return BUNDLED_IMAGES[image] ?? image
}

export function toEventItem(res: EventResponse): EventItem {
  return {
    id: res.id,
    image: resolveImage(res.image),
    date: res.start_at,
    allDay: res.all_day,
    title: res.title,
    location: res.location,
    description: res.description,
  }
}

function toRequest(draft: EventDraft) {
  return {
    title: draft.title,
    description: draft.description,
    location: draft.location,
    image: draft.image,
    start_at: draft.date,
    all_day: draft.allDay,
  }
}

export async function listEvents(): Promise<EventItem[]> {
  const events = await apiFetch<EventResponse[]>('/api/v1/events')
  return events.map(toEventItem)
}

export async function createEvent(token: string, draft: EventDraft): Promise<EventItem> {
  const created = await apiFetch<EventResponse>('/api/v1/events', {
    method: 'POST',
    token,
    body: toRequest(draft),
  })
  return toEventItem(created)
}

export async function updateEvent(token: string, id: number, draft: EventDraft): Promise<EventItem> {
  const updated = await apiFetch<EventResponse>(`/api/v1/events/${id}`, {
    method: 'PATCH',
    token,
    body: toRequest(draft),
  })
  return toEventItem(updated)
}

export function deleteEvent(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/events/${id}`, { method: 'DELETE', token })
}
