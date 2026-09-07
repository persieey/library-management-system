// ยกมาจาก B6707590 (ธนกร) เจ้าของระบบร้องเรียนและสถิติ
// แก้สองจุดให้เข้ากับโปรเจคนี้: คีย์ token เป็น auth_token และ base path เป็น /api/v1
export function getApiBaseUrl(): string {
  // ใช้ตัวแปรเดียวกับ services/https/index.tsx เพื่อให้ชี้ไป backend ตัวเดียวกันเสมอ
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const base = (fromEnv && fromEnv.trim().length > 0 ? fromEnv : 'http://localhost:8080').replace(/\/$/, '');
  return `${base}/api/v1`;
}

export const API_BASE = getApiBaseUrl();

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const url = `${getApiBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

/**
 * ตัวเรียก API ของระบบจัดซื้อ (B6710248)
 *
 * ไฟล์นี้เดิมเป็นของ B6707590 และมี complaintService กับ statisticsService ใช้ request() อยู่
 * จึงเพิ่ม api เข้ามาต่อท้ายแทนการเขียนทับทั้งไฟล์ หน้าจัดซื้อของเจ้าของงานจึงใช้ได้ตามเดิม
 *
 * path ไม่ต้องมี /api/v1 นำหน้า เพราะ getApiBaseUrl() ใส่ให้แล้ว
 *
 * backend ของระบบนี้ห่อผลลัพธ์เป็น {success, data} จึงแกะซองก่อนคืนให้หน้าเว็บ
 */
function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
    return (res as { data: T }).data
  }
  return res as T
}

export const api = {
  requests: {
    getAll: () => request<unknown>('/requests').then(unwrap<any[]>),
    getById: (id: string | number) => request<unknown>(`/requests/${id}`).then(unwrap<any>),
    create: (body: unknown) => request<unknown>('/requests', { method: 'POST', body: JSON.stringify(body) }).then(unwrap<any>),
    updateStatus: (id: string | number, status: string) =>
      request<unknown>(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then(unwrap<any>),
  },
  assets: {
    getAll: () => request<unknown>('/assets').then(unwrap<any[]>),
    create: (body: unknown) => request<unknown>('/assets', { method: 'POST', body: JSON.stringify(body) }).then(unwrap<any>),
  },
}
