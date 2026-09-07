// รูปข้อมูล E-Book ตรงกับ models.Ebook ฝั่ง backend
//
// ต่างจากหนังสือเล่มจริงตรงที่ไม่มีตัวเล่ม ไม่มีตำแหน่งบนชั้น
// แต่มีไฟล์ PDF/EPUB แนบมาด้วย

export interface Ebook{
  ebook_id: number
  isbn: string
  title: string
  author: string
  publisher: string
  category: string
  file_name: string
  file_type: string
  file_path: string
  cover_path: string
  description: string
  employee_id: number | null
  created_at: string
  updated_at: string
}

export interface   EbookDraft{
  isbn: string
  title: string
  author: string
  publisher: string
  category: string
  description: string
}

export interface UploadFileResponse{
  message: string
  file_name: string
  file_type: string
  file_path: string    
}

export interface UploadCoverResponse {
  message: string
  cover_path: string
}