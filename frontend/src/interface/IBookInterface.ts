// รูปข้อมูลหนังสือ ตรงกับ models ฝั่ง backend (SA-1-69/T09)
//
// หนังสือหนึ่งเรื่อง (Book) มีได้หลายเล่ม (BookCopy)
// การยืมและตำแหน่งบนชั้นผูกกับเล่ม ไม่ใช่กับเรื่อง

export interface Book {
  book_id: number
  isbn: string
  title: string
  author: string
  publisher: string
  category: string
  call_number: string
  description: string
  cover_path: string
  created_at: string
  updated_at: string
}

export interface BookCopy {
  copy_id: number
  book_id: number
  /** มาเฉพาะตอน backend ใช้ Preload */
  book?: Book
  copy_number: number
  building: string
  slot: string
  /** ของระบบยืม-คืน หน้าจัดการหนังสือไม่แก้ค่านี้ */
  availability_status: string
  condition_status: string
  created_at: string
  updated_at: string
}

export interface BookInspection {
  inspection_id: number
  copy_id: number
  copy?: BookCopy
  employee_id: number | null
  employee?: {
    employee_id: number
    position: string
    user?: { user_id: number; name: string }
  }
  inspection_date: string
  description: string
  resolved: boolean
}

// ---- payload ที่ส่งไป backend ----

export interface BookDraft {
  isbn: string
  title: string
  author: string
  publisher: string
  category: string
  call_number: string
  description: string
}

export interface BookCopyDraft {
  copy_number: number
  building: string
  slot: string
  condition_status: string
}

export interface InspectionDraft {
  copy_id: number
  description: string
}
