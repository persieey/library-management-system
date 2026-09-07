import type { ApiError as ApiErrorBody } from '../../interface/IApiInterface'

const DEFAULT_BASE_URL = 'http://localhost:8080'

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (fromEnv && fromEnv.trim().length > 0 ? fromEnv : DEFAULT_BASE_URL).replace(/\/$/, '')
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalized}`
}

/**
 * เรียก API ของ backend ทีม (SA-1-69/T09)
 *
 * ตอบกลับเป็นข้อมูลตรงๆ ไม่มีซอง {success, data} ครอบ
 * ตอนพลาดจะได้ {"error": "ข้อความ"} ซึ่งฟังก์ชันนี้แปลงเป็น ApiError ให้
 */
export async function apiFetch<T>(
  path: string,
  options?: { method?: string; token?: string | null; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options?.token) headers.Authorization = `Bearer ${options.token}`

  let body: string | undefined
  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path), {
      method: options?.method ?? 'GET',
      headers,
      body,
      signal: options?.signal,
    })
  } catch {
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจว่ารัน backend อยู่หรือไม่', 0)
  }

  if (res.status === 204) return undefined as T

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    // ตอบกลับไม่ใช่ JSON เช่นหน้า 404 ของ Gin ที่เป็นข้อความล้วน
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as ApiErrorBody).error)
        : `คำขอไม่สำเร็จ (${res.status})`
    throw new ApiError(message, res.status)
  }

  return payload as T
}

/**
 * อัปโหลดไฟล์ด้วย multipart/form-data
 *
 * แยกจาก apiFetch เพราะตัวนั้นแปลง body เป็น JSON เสมอ ส่งไฟล์ไม่ได้
 * และห้ามตั้ง Content-Type เอง เบราว์เซอร์ต้องเป็นคนใส่ boundary ให้
 *
 * @param field ชื่อ field ที่ backend รอรับ เช่น 'cover' หรือ 'file'
 */
export async function apiUpload<T>(
  path: string,
  field: string,
  file: File,
  token: string,
): Promise<T> {
  const form = new FormData()
  form.append(field, file)

  let res: Response
  try {
    res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: form,
    })
  } catch {
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจว่ารัน backend อยู่หรือไม่', 0)
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    // ตอบกลับไม่ใช่ JSON
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `อัปโหลดไม่สำเร็จ (${res.status})`
    throw new ApiError(message, res.status)
  }

  return payload as T
}
