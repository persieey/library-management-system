import { apiFetch, apiUpload } from './index'
import type {
  Book,
  BookCopy,
  BookCopyDraft,
  BookDraft,
  BookInspection,
  InspectionDraft,
} from '../../interface/IBookInterface'

// ---------- หนังสือ (เรื่อง) ----------

export async function listBooks(token: string): Promise<Book[]> {
  const res = await apiFetch<{ books: Book[] }>('/api/v1/books', { token })
  return res.books ?? []
}

export async function createBook(token: string, draft: BookDraft): Promise<Book> {
  const res = await apiFetch<{ book: Book }>('/api/v1/books', {
    method: 'POST',
    token,
    body: draft,
  })
  return res.book
}

export async function updateBook(
  token: string,
  id: number,
  patch: Partial<BookDraft & { cover_path: string }>,
): Promise<Book> {
  const res = await apiFetch<{ book: Book }>(`/api/v1/books/${id}`, {
    method: 'PUT',
    token,
    body: patch,
  })
  return res.book
}

export function deleteBook(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/books/${id}`, { method: 'DELETE', token })
}

/** อัปโหลดรูปปกแล้วได้ path กลับมา ต้องเอาไป updateBook เองอีกที */
export async function uploadBookCover(token: string, file: File): Promise<string> {
  const res = await apiUpload<{ cover_path: string }>('/api/v1/books/upload-cover', 'cover', file, token)
  return res.cover_path
}

/**
 * รายการหนังสือสำหรับหน้าสาธารณะ (หน้าแรก, /books, /books/:id)
 *
 * endpoint เดียวกับ listBooks แต่ไม่แนบ token เพราะ GET /api/v1/books
 * ถูกวางไว้ก่อน JWTAuthMiddleware ใน routes.go คนที่ยังไม่ล็อกอินจึงเรียกได้
 */
export async function listPublicBooks(signal?: AbortSignal): Promise<Book[]> {
  const res = await apiFetch<{ books: Book[] }>('/api/v1/books', { signal })
  return res.books ?? []
}

/** URL รูปปก — เปิดสาธารณะ ไม่ต้องแนบ token จึงใส่ใน <img src> ได้ตรงๆ */
export function bookCoverUrl(id: number, updatedAt?: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
  const url = `${base}/api/v1/books/${id}/cover`
  return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url
}

// ---------- เล่มหนังสือ ----------

export async function listCopies(token: string, bookId?: number): Promise<BookCopy[]> {
  const path = bookId ? `/api/v1/book-copies?book_id=${bookId}` : '/api/v1/book-copies'
  const res = await apiFetch<{ copies: BookCopy[] }>(path, { token })
  return res.copies ?? []
}

export async function createCopy(
  token: string,
  bookId: number,
  draft: BookCopyDraft,
): Promise<BookCopy> {
  const res = await apiFetch<{ copies: BookCopy }>('/api/v1/book-copies', {
    method: 'POST',
    token,
    body: {
      book_id: bookId,
      copy_number: draft.copy_number,
      building: draft.building,
      slot: draft.slot,
    },
  })
  return res.copies
}

export async function updateCopy(
  token: string,
  id: number,
  patch: Partial<BookCopyDraft>,
): Promise<BookCopy> {
  const res = await apiFetch<{ book: BookCopy }>(`/api/v1/book-copies/${id}`, {
    method: 'PUT',
    token,
    body: patch,
  })
  return res.book
}

export function deleteCopy(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/book-copies/${id}`, { method: 'DELETE', token })
}

// ---------- การตรวจสอบ ----------

export async function listInspections(token: string, resolved?: boolean): Promise<BookInspection[]> {
  const path =
    resolved === undefined ? '/api/v1/inspections' : `/api/v1/inspections?resolved=${resolved}`
  const res = await apiFetch<{ inspections: BookInspection[] }>(path, { token })
  return res.inspections ?? []
}

export async function listInspectionsByCopy(
  token: string,
  copyId: number,
): Promise<BookInspection[]> {
  const res = await apiFetch<{ inspections: BookInspection[] }>(
    `/api/v1/book-copies/${copyId}/inspections`,
    { token },
  )
  return res.inspections ?? []
}

export async function createInspection(
  token: string,
  draft: InspectionDraft,
): Promise<BookInspection> {
  const res = await apiFetch<{ inspection: BookInspection }>('/api/v1/inspections', {
    method: 'POST',
    token,
    body: draft,
  })
  return res.inspection
}

export function updateInspection(
  token: string,
  id: number,
  patch: Partial<{ description: string; resolved: boolean }>,
) {
  return apiFetch<{ inspection: BookInspection }>(`/api/v1/inspections/${id}`, {
    method: 'PUT',
    token,
    body: patch,
  })
}

export function deleteInspection(token: string, id: number) {
  return apiFetch<{ message: string }>(`/api/v1/inspections/${id}`, { method: 'DELETE', token })
}