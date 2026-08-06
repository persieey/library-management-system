// ต้องตรงกับ backend/models/role.go
// หมายเหตุ: ไฟล์นี้ใช้ตัดสินแค่ว่า "จะแสดงปุ่มอะไร" เท่านั้น
// การบังคับสิทธิ์จริงต้องทำฝั่งเซิร์ฟเวอร์เสมอ ห้ามเชื่อค่าจากฝั่ง client
export const ROLES = {
  USER: "user",
  LIBRARIAN: "librarian",
  STAFF: "staff",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.USER]: "ผู้ใช้ทั่วไป",
  [ROLES.LIBRARIAN]: "บรรณารักษ์",
  [ROLES.STAFF]: "เจ้าหน้าที่",
  [ROLES.ADMIN]: "ผู้ดูแลระบบ",
};

// ปุ่มพิเศษบน header ของแต่ละ role — ทุกคนที่ล็อกอินเป็น user ปกติได้อยู่แล้ว
export const ROLE_ACTIONS = {
  [ROLES.USER]: [],
  [ROLES.LIBRARIAN]: [{ label: "Employees", to: "/employees" }],
  [ROLES.STAFF]: [{ label: "Employees", to: "/employees" }],
  [ROLES.ADMIN]: [{ label: "Employees", to: "/employees" }],
};

// เมนูในหน้าหลังบ้าน แยกตาม role
export const BACK_OFFICE_MENU = {
  [ROLES.LIBRARIAN]: [
    { label: "Catalog", to: "/employees/catalog" },
    { label: "Loans", to: "/employees/loans" },
    { label: "Announcements", to: "/employees/pr" },
  ],
  [ROLES.STAFF]: [
    { label: "Recording Room", to: "/employees/recording-room" },
    { label: "Equipment", to: "/employees/equipment" },
    { label: "Repair request", to: "/employees/repair-request" },
    { label: "Track the repair", to: "/employees/repair-track" },
  ],
  [ROLES.ADMIN]: [
    { label: "Catalog", to: "/employees/catalog" },
    { label: "Loans", to: "/employees/loans" },
    { label: "Announcements", to: "/employees/pr" },
    { label: "Recording Room", to: "/employees/recording-room" },
    { label: "Equipment", to: "/employees/equipment" },
    { label: "Repair request", to: "/employees/repair-request" },
    { label: "Track the repair", to: "/employees/repair-track" },
    { label: "Personnel", to: "/personnel" },
  ],
};

export function actionsFor(role) {
  return ROLE_ACTIONS[role] || [];
}

export function backOfficeMenuFor(role) {
  return BACK_OFFICE_MENU[role] || [];
}
