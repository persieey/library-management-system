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
