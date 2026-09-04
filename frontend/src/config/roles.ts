import type { Role } from '../interface/IUserInterface'

// ต้องตรงกับ backend — ไฟล์นี้ใช้ตัดสินแค่ว่าจะแสดงเมนูอะไร
// การบังคับสิทธิ์จริงอยู่ที่เซิร์ฟเวอร์เสมอ
export const ROLE_LABELS: Record<Role, string> = {
  user: 'ผู้ใช้ทั่วไป',
  librarian: 'บรรณารักษ์',
  staff: 'เจ้าหน้าที่',
  manager: 'Manager',
  admin: 'ผู้ดูแลระบบ',
}

export const PERMISSIONS = {
  BORROW_RESOURCES: 'borrow:resources',
  BOOK_ROOM: 'room:book',
  SUBMIT_FEEDBACK: 'feedback:submit',
  ACCESS_BACKOFFICE: 'backoffice:access',
  MANAGE_CATALOG: 'catalog:manage',
  APPROVE_LOANS: 'loans:approve',
  MANAGE_PR: 'pr:manage',
  MANAGE_ROOMS: 'rooms:manage',
  MANAGE_EQUIPMENT: 'equipment:manage',
  MANAGE_PERSONNEL: 'personnel:manage',
  ASSIGN_ROLES: 'roles:assign',
} as const

export interface NavAction {
  label: string
  to?: string
  permission?: string
  /** คีย์ไอคอน แปลงเป็นไอคอนจริงด้วย navIcon() ตอนแสดงใน <Sidebar> */
  icon?: string
  children?: NavAction[]
}

// เมนูของหน้าหลังบ้าน — ตอนนี้เหลือเฉพาะระบบที่ทำเสร็จจริง
// ระบบของเพื่อนในทีมค่อยเติมกลับเข้ามาที่นี่ทีละอันตอนที่โค้ดพร้อม
export const BACK_OFFICE_MENU: NavAction[] = [
  { icon: 'recordingRoom', label: 'Recording Room', to: '/employees/recording-room', permission: PERMISSIONS.MANAGE_ROOMS },
  {
    icon: 'equipment',
    label: 'Equipment',
    permission: PERMISSIONS.MANAGE_EQUIPMENT,
    children: [
      { icon: 'equipment', label: 'Equipment', to: '/employees/equipment' },
      { icon: 'repair', label: 'Repair request', to: '/employees/repair-request' },
      { icon: 'repairTrack', label: 'Track the repair', to: '/employees/repair-track' },
    ],
  },
  {
    // ระบบเดียวที่มีหัวข้อย่อยจริง จึงกางเป็นกลุ่มได้ ระบบอื่นยังเป็นเมนูเดี่ยว
    // กลุ่มไม่ต้องมี to เพราะเมนูย่อยตัวแรกเป็นหน้าหลักของระบบอยู่แล้ว
    icon: 'activities',
    label: 'ประชาสัมพันธ์',
    permission: PERMISSIONS.MANAGE_PR,
    children: [
      { icon: 'overview', label: 'ภาพรวม', to: '/employees/pr' },
      { icon: 'activities', label: 'กิจกรรม', to: '/employees/pr/events' },
      { icon: 'leave', label: 'ประกาศ', to: '/employees/pr/announcements' },
    ],
  },
  { icon: 'personnel', label: 'Personnel', to: '/employees/personnel', permission: PERMISSIONS.MANAGE_PERSONNEL },
]

export function backOfficeMenuFor(can: (permission: string) => boolean): NavAction[] {
  return BACK_OFFICE_MENU.filter((item) => !item.permission || can(item.permission))
}

// ชื่อที่โชว์บนปุ่ม dropdown ของ header — ใช้ชื่อสิทธิ์ของผู้ใช้แทนคำว่า Employees
// เช่น librarian -> "Librarian" อยากได้ภาษาไทยให้เปลี่ยนไปคืน ROLE_LABELS[role] แทน
export function roleDisplayName(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// ปุ่มพิเศษบน header ของหน้าเว็บฝั่งผู้ใช้ — label จะถูกแทนด้วยชื่อสิทธิ์ตอนแสดงผล
// เพิ่มเมนูจัดการระบบใหม่ทีหลังแค่เติมใน children ที่นี่ที่เดียว
export const HEADER_ACTIONS: NavAction[] = [
  {
    // ปุ่มเดียวพาเข้าหน้ารวมระบบเลย ไม่ต้องกางเมนูให้เลือกอีกชั้น
    // เพราะ sidebar ในหน้านั้นแสดงทุกระบบที่สิทธิ์ของผู้ใช้เข้าถึงได้อยู่แล้ว
    label: 'Employees',
    to: '/employees',
    permission: PERMISSIONS.ACCESS_BACKOFFICE,
  },
]

function visible(item: NavAction, can: (permission: string) => boolean): boolean {
  if (item.permission && !can(item.permission)) return false
  if (item.children && !item.children.some((child) => visible(child, can))) return false
  return true
}

export function actionsFor(can: (permission: string) => boolean): NavAction[] {
  return HEADER_ACTIONS.filter((item) => visible(item, can)).map((item) =>
    item.children ? { ...item, children: item.children.filter((child) => visible(child, can)) } : item,
  )
}
