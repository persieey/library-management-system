import { apiFetch } from './index'
export type Item = {
  ID: string | number; CreatedAt?: string; first_name?: string; last_name?: string;
  user?: Item; resource?: Item; equipment?: Item; title?: string; name?: string;
  barcode?: string; asset_code?: string; category?: string; condition?: string; author?: string;
  status?: string; reserved_for?: string; borrowed_at?: string; due_at?: string;
  fine?: number; fine_paid?: boolean; fine_id?: string; fine_status?: string;
  fine_description?: string; overdue_days?: number; requires_fine?: boolean;
}
export const list=(token:string,path:string,signal?:AbortSignal)=>apiFetch<Item[]>(`/api/v1/${path}`,{token,signal})
export const action=(token:string,path:string,body?:unknown)=>apiFetch<Item>(`/api/v1/${path}`,{token,method:'POST',body})

export type MemberMatch = { user_id: number; university_id: string; name?: string; email?: string; borrow_limit: number }
export const searchMembers = (token: string, q: string, signal?: AbortSignal) =>
  apiFetch<{ members: MemberMatch[] }>(`/api/v1/users/members/search?q=${encodeURIComponent(q)}`, { token, signal }).then((r) => r.members)

// สร้างรายการยืมแทนสมาชิก (walk-in) — path เดียวกับที่ใช้ list() แต่ POST แทน GET
// ผูกกับบัญชีจริงด้วย university_id เสมอ (backend หา user_id เองจากรหัสนี้)
export const createForMember = (token: string, path: string, body: { university_id: string; resource_id?: number; equipment_id?: string; reserved_for: string; days: number }) =>
  apiFetch<Item>(`/api/v1/${path}`, { token, method: 'POST', body })
