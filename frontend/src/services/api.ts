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
