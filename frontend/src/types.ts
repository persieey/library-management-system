// Shared API/domain types for the pages ยกมาจากสาขา B6715588
// (ระบบอุปกรณ์ / จองห้อง / แจ้งซ่อม) backend ส่ง JSON เป็น snake_case ทั้งหมด

export interface Equipment {
  equipment_id: number;
  name: string;
  category: string;
  location: string;
  status: string; // "available" | "maintenance"
}

export interface UserRef {
  name: string;
}

export interface RoomRef {
  room_name: string;
}

export interface RoomBooking {
  room_booking_id: number;
  status: string; // "pending" | "confirmed" | "completed" | "cancelled"
  start_datetime: string;
  end_datetime: string;
  room?: RoomRef;
  user?: UserRef;
}

export interface RepairRequest {
  request_id: number;
  status: string; // "pending" | "in_progress" | "completed" | "cancelled"
  description: string;
  urgency?: string;
  photo_url?: string;
  created_at: string;
  equipment_id?: number;
  equipment?: { name: string; category?: string; location?: string };
  user?: UserRef;
}

export interface Room {
  room_id: number;
  room_name: string;
  room_type: string; // "individual" | "group"
}

export interface BookedSlot {
  start_datetime: string;
  end_datetime: string;
}

// Narrows `catch (e)` (typed `unknown`) down to a display string.
export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

// Backend origin — ใช้ตัวแปรเดียวกับ services/https/index.tsx ของโปรเจคนี้
export const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8080"
).replace(/\/$/, "");

// Turn a server-relative upload path ("/uploads/…") into an absolute URL the
// browser can load from the API origin. Passes through absolute URLs as-is.
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
