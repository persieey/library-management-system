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
  children?: NavAction[]
}

export const BACK_OFFICE_MENU: NavAction[] = [
  { label: 'Homepage', to: '/employees' },
  { label: 'Recording Room', to: '/employees/recording-room', permission: PERMISSIONS.MANAGE_ROOMS },
  {
    label: 'Equipment',
    permission: PERMISSIONS.MANAGE_EQUIPMENT,
    children: [
      { label: 'Equipment', to: '/employees/equipment' },
      { label: 'Repair request', to: '/employees/repair-request' },
      { label: 'Track the repair', to: '/employees/repair-track' },
    ],
  },
  { label: 'Catalog', to: '/employees/catalog', permission: PERMISSIONS.MANAGE_CATALOG },
  { label: 'Loans', to: '/employees/loans', permission: PERMISSIONS.APPROVE_LOANS },
  { label: 'Announcements', to: '/employees/pr', permission: PERMISSIONS.MANAGE_PR },
  { label: 'Personnel', to: '/employees/personnel', permission: PERMISSIONS.MANAGE_PERSONNEL },
]

export function backOfficeMenuFor(can: (permission: string) => boolean): NavAction[] {
  return BACK_OFFICE_MENU.filter((item) => !item.permission || can(item.permission))
}

// ปุ่มพิเศษบน header ของหน้าเว็บฝั่งผู้ใช้ — "Employees" เป็น dropdown
// เพิ่มเมนูจัดการระบบใหม่ทีหลังแค่เติมใน children ที่นี่ที่เดียว
export const HEADER_ACTIONS: NavAction[] = [
  {
    label: 'Employees',
    permission: PERMISSIONS.ACCESS_BACKOFFICE,
    children: [
      { label: 'จัดการบุคลากร', to: '/manager', permission: PERMISSIONS.MANAGE_PERSONNEL },
      { label: 'Catalog', to: '/employees/catalog', permission: PERMISSIONS.MANAGE_CATALOG },
      { label: 'Recording Room', to: '/employees/recording-room', permission: PERMISSIONS.MANAGE_ROOMS },
      { label: 'Manage PR', to: '/employees/pr', permission: PERMISSIONS.MANAGE_PR },
    ],
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
