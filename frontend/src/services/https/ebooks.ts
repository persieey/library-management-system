import { apiFetch, apiUpload } from './index'
import type {
  Ebook,
  EbookDraft,
  UploadCoverResponse,
  UploadFileResponse,
} from '../../interface/IEbookInterface'

export async function listEbooks(token: string): Promise<Ebook[]> {
  const res = await apiFetch<{ ebooks: Ebook[] }>('/api/v1/ebooks', { token })
  return res.ebooks ?? []
}


/**
 * รายชื่อ E-Book สำหรับหน้าสาธารณะ /ebooks
 *
 * endpoint เดียวกับ listEbooks แต่ไม่แนบ token เพราะ GET /api/v1/ebooks
 * ถูกวางไว้ก่อน JWTAuthMiddleware ใน routes.go
 * ได้แค่ข้อมูลบรรณานุกรมกับรูปปก ตัวไฟล์ยังต้องล็อกอินถึงจะเปิดได้
 */
export async function listPublicEbooks(signal?: AbortSignal): Promise<Ebook[]> {
  const res = await apiFetch<{ ebooks: Ebook[] }>('/api/v1/ebooks', { signal })
  return res.ebooks ?? []
}

/**
 * บันทึก log คำค้นหา E-Book จริง ให้หน้ารายงานสถิติมีข้อมูลจริง
 * การค้นหาเองกรองฝั่งเบราว์เซอร์ล้วน ๆ (useCatalogFilter) ไม่ได้ยิง API ต่อการพิมพ์แต่ละตัวอักษร
 * endpoint นี้แยกไว้ต่างหากสำหรับเก็บสถิติอย่างเดียว ไม่ล็อกอินก็เรียกได้ (หน้า /ebooks เปิดสาธารณะ)
 */
export function logEbookSearch(keyword: string, token?: string | null) {
  return apiFetch<{ message: string }>('/api/v1/ebooks/search-log', {
    method: 'POST',
    token: token ?? undefined,
    body: { keyword },
  })
}

export async function createEbook(
  token: string,
  draft: EbookDraft & Partial<Pick<Ebook, 'file_name' | 'file_type' | 'file_path' | 'cover_path'>>,
): Promise<Ebook> {
  const res = await apiFetch<{ ebook: Ebook }>('/api/v1/ebooks', {
    method: 'POST',
    token,
    body: draft,
  })
  return res.ebook
}

export async function updateEbook(
  token: string,
  id: number,
 patch: Partial<EbookDraft & Pick<Ebook, 'file_name' | 'file_type' | 'file_path' | 'cover_path'>>,
): Promise<Ebook> {
  const res = await apiFetch<{ ebook: Ebook }>(`/api/v1/ebooks/${id}`, {
    method: 'PUT',
    token,
    body: patch,
  })
  return res.ebook
}

export function deleteEbook(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/ebooks/${id}`, { method: 'DELETE', token })
}

/** อัปโหลดไฟล์ PDF/EPUB คืนข้อมูลไฟล์ที่ต้องเอาไปผูกกับ ebook */
export function uploadEbookFile(token: string, file: File): Promise<UploadFileResponse> {
  return apiUpload<UploadFileResponse>('/api/v1/ebooks/upload', 'file', file, token)
}

export async function uploadEbookCover(token: string, file: File): Promise<string> {
  const res = await apiUpload<UploadCoverResponse>('/api/v1/ebooks/upload-cover', 'cover', file, token)
  return res.cover_path
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** URL รูปปก — เปิดสาธารณะ ใส่ใน <img src> ได้ตรงๆ */
export function ebookCoverUrl(id: number, updatedAt?: string): string {
  const url = `${BASE}/api/v1/ebooks/${id}/cover`
  return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url
}

/**
 * URL ไฟล์ E-Book — ต้องล็อกอินก่อนถึงเปิดได้
 * เปิดใน <a href> ตรงๆ ไม่ได้เพราะแนบ token ไม่ได้ ต้องโหลดมาเป็น blob
 */
export async function openEbookFile(token: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/ebooks/${id}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('เปิดไฟล์ไม่สำเร็จ')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')

  // คืนหน่วยความจำหลังเบราว์เซอร์เปิดแท็บแล้ว
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}