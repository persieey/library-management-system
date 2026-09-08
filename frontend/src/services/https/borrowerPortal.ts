import { apiFetch } from './index'

export type QueueRequest = { ID: number; kind: 'book' | 'equipment'; item_id: string | number; title: string; days: number; status: 'waiting' | 'fulfilled' | 'cancelled'; position: number; ready: boolean }
export const getMyQueue = (token: string, signal?: AbortSignal) => apiFetch<QueueRequest[]>('/api/v1/my-queue', { token, signal })
export const joinQueue = (token: string, kind: 'book' | 'equipment', itemId: string | number, days: number) => apiFetch<QueueRequest>('/api/v1/my-queue', { method: 'POST', token, body: { kind, item_id: itemId, days } })
export const cancelQueue = (token: string, id: number) => apiFetch(`/api/v1/my-queue/${id}/cancel`, { method: 'POST', token })

export type CatalogResource = {
  ID: number
  barcode: string
  title: string
  author: string
  category: string
  resource_type: string
  call_number: string
  location: string
  status: string
  access_level: string
  image_url: string
}

export type CatalogEquipment = {
  ID: string
  asset_code: string
  name: string
  category: string
  location: string
  condition: string
  status: string
  image_url: string
}

export type BookLoan = {
  ID: string
  resource_id: number
  resource: CatalogResource
  reserved_for: string
  borrowed_at: string
  due_at: string
  returned_at: string | null
  cancelled_at?: string | null
  cancellation_reason?: string
  fine: number
  fine_paid: boolean
  note?: string
  status: string
}

export type EquipmentLoan = {
  ID: string
  fine: number
  fine_paid: boolean
  equipment_id: string
  equipment: CatalogEquipment
  reserved_for: string
  borrowed_at: string
  due_at: string
  returned_at: string | null
  cancelled_at?: string | null
  cancellation_reason?: string
  condition_out?: string
  condition_in?: string
  note?: string
  status: string
}

export const getResources = (signal?: AbortSignal, date?: string, days = 1) => apiFetch<CatalogResource[]>(`/api/v1/books/catalog${date ? `?reserved_for=${date}&days=${days}` : ''}`, { signal })
export const getEquipment = (signal?: AbortSignal, date?: string, days = 1) => apiFetch<CatalogEquipment[]>(`/api/v1/equipment/catalog${date ? `?reserved_for=${date}&days=${days}` : ''}`, { signal })
export const getMyLoans = (token: string, signal?: AbortSignal) => apiFetch<BookLoan[]>('/api/v1/books/reservations', { token, signal })
export const getMyEquipmentLoans = (token: string, signal?: AbortSignal) => apiFetch<EquipmentLoan[]>('/api/v1/equipment/reservations', { token, signal })
export const requestBook = (token: string, resourceId: number, reservedFor: string, days: number) => apiFetch<BookLoan>('/api/v1/books/reservations', { method: 'POST', token, body: { resource_id: resourceId, reserved_for: reservedFor, days } })
export const requestEquipment = (token: string, equipmentId: string, reservedFor: string, days: number) => apiFetch<EquipmentLoan>('/api/v1/equipment/reservations', { method: 'POST', token, body: { equipment_id: equipmentId, reserved_for: reservedFor, days } })
export const cancelBookReservation = (token: string, loanId: string | number, reason: string) => apiFetch<BookLoan>(`/api/v1/books/reservations/${loanId}/cancel`, { method: 'POST', token, body: { reason } })
export const cancelEquipmentReservation = (token: string, loanId: string | number, reason: string) => apiFetch<EquipmentLoan>(`/api/v1/equipment/reservations/${loanId}/cancel`, { method: 'POST', token, body: { reason } })
