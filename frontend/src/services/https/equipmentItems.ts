import { apiFetch } from './index'

// คลังอุปกรณ์ที่เปิดให้สมาชิกยืม (ตาราง equipment_items) — คนละระบบกับ services/https/... ที่
// จัดการครุภัณฑ์/แจ้งซ่อม (models.Equipment) นี่คือรายการที่ป้อนหน้า "จองอุปกรณ์" ของสมาชิก
export interface EquipmentItem {
  equipment_id: string
  asset_number: string
  equipment_name: string
  category: string
  brand: string
  model: string
  location: string
  status: string // "available" | "not_available"
  condition: string // "good" | "damaged" | "lost"
  image_url: string
}

export interface EquipmentItemDraft {
  equipment_name: string
  asset_number: string
  category: string
  brand: string
  model: string
  location: string
}

export const listEquipmentItems = (token: string) =>
  apiFetch<EquipmentItem[]>('/api/v1/equipment-items', { token })

export const createEquipmentItem = (token: string, draft: EquipmentItemDraft) =>
  apiFetch<EquipmentItem>('/api/v1/equipment-items', { method: 'POST', token, body: draft })

export const deleteEquipmentItem = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/api/v1/equipment-items/${encodeURIComponent(id)}`, { method: 'DELETE', token })
