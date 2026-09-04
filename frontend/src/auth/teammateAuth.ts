import { useAuth as useRealAuth } from './useAuth'

/**
 * ตัวเชื่อมสำหรับคอมโพเนนต์ที่ยกมาจาก B6707590 (ธนกร)
 *
 * ของเดิมเขาใช้ authContext จำลองที่มีผู้ใช้ hardcode ไว้และมีปุ่มสลับ role ตอนเดโม
 * ไฟล์นี้แปลงให้ใช้ auth จริงของโปรเจคนี้แทน โดยคงชื่อ prop เดิมไว้ทุกตัว
 * คอมโพเนนต์ของเขาจึงใช้ได้โดยไม่ต้องแก้
 */
export function useAuth() {
  const { user, allows, isEmployee } = useRealAuth()

  return {
    user: user ? { userId: user.user_id, name: user.name, email: user.email } : null,
    isEmployee,
    isManager: allows('manager'),
    // ของเดิมมีไว้สลับ role ตอนเดโม ระบบจริงเปลี่ยนสิทธิ์เองไม่ได้ จึงไม่ทำอะไร
    switchToRole: (_roleType?: string) => {},
  }
}
