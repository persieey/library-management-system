// backend ของทีมตอบข้อมูลกลับมาตรงๆ ไม่ได้ห่อด้วยซอง {success, data}
// ตอนพลาดจะตอบเป็น {"error": "ข้อความ"} พร้อมรหัสสถานะ HTTP
export interface ApiError {
  error: string
}
