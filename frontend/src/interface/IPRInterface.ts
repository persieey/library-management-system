export type PRStatus = 'เผยแพร่' | 'ร่าง' | 'ตั้งเวลา' | 'หมดอายุ'

export interface PRItem {
  id: number
  pinned: boolean
  status: PRStatus
  title: string
  content: string
  channel: string
  publishedAt: string
  expiresAt: string
  views: number
  // วันเวลาที่จะเผยแพร่จริง (ISO string) — มีค่าเฉพาะตอนสถานะเป็น "ตั้งเวลา"
  scheduledAt: string | null
  // เวลาที่เผยแพร่จริง (epoch ms) — ใช้เรียงข่าวใหม่ล่าสุดในกระดิ่งแจ้งเตือน ไม่มีถ้ายังไม่เคยเผยแพร่
  publishedTimestamp: number | null
}

export interface PRDraft {
  title: string
  content: string
  channel: string
  status: PRStatus
  pinned: boolean
  publishedAt: string
  expiresAt: string
  scheduledAt: string | null
}
