// ชนิดข้อมูลของระบบร้องเรียน — ตั้งชื่อฟิลด์ให้ตรงกับที่ B6707590 (ธนกร) ออกแบบไว้
// เพื่อให้ต่อกับ backend ของระบบร้องเรียนได้ทันทีตอนรวมโค้ด ไม่ต้องมาแปลงชื่อกันทีหลัง

/** หมวดของเรื่องที่แจ้ง ค่าที่ส่งขึ้น backend เป็นภาษาไทย */
export const COMPLAINT_CATEGORIES = [
  { value: 'อาคารสถานที่', label: 'อาคารสถานที่ (แอร์ ไฟฟ้า ประปา เฟอร์นิเจอร์)' },
  { value: 'บริการ', label: 'บริการและเจ้าหน้าที่' },
  { value: 'ระบบสารสนเทศ', label: 'ระบบสารสนเทศและ Wi-Fi' },
  { value: 'อุปกรณ์โสตทัศน์', label: 'อุปกรณ์โสตทัศน์และโปรเจกเตอร์' },
  { value: 'ข้อเสนอแนะ', label: 'ข้อเสนอแนะทั่วไป' },
] as const

/** ระดับความเร่งด่วน */
export const COMPLAINT_PRIORITIES = [
  { value: 'ปกติ', label: 'ปกติ — ปัญหาทั่วไป ซ่อมบำรุงตามรอบ', dot: '#16a34a' },
  { value: 'ด่วน', label: 'ด่วน — กระทบผู้ใช้บริการ', dot: '#f59e0b' },
  { value: 'ด่วนที่สุด', label: 'ด่วนที่สุด — ฉุกเฉิน ระบบล่ม น้ำท่วม', dot: '#dc2626' },
] as const

/** ข้อมูลที่ส่งขึ้นตอนแจ้งเรื่องใหม่ */
export interface ComplaintDraft {
  topic: string
  category: string
  priority: string
  description: string
  location: string
  /** รูปแนบเป็น data URI ไม่บังคับ */
  attachedImage: string
}

/** รูปแบบที่ backend รับ — snake_case ตามข้อตกลงของทีม */
export interface ComplaintRequest {
  topic: string
  category: string
  priority: string
  description: string
  location: string
  attached_image?: string
  user_id?: number
}
