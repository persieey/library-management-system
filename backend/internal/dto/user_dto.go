package dto

type CreateMemberRequest struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Phone        string `json:"phone"`
	Password     string `json:"password" binding:"required,min=6"`
	UniversityID string `json:"university_id" binding:"required"`
	BorrowLimit  int    `json:"borrow_limit" binding:"required,min=1"`
}

type CreateEmployeeRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required,min=6"`
	Position string `json:"position" binding:"required,oneof=manager librarian"`
}

type CreateMemberProfileRequest struct {
	UserID       uint   `json:"user_id" binding:"required"`
	UniversityID string `json:"university_id" binding:"required"`
	BorrowLimit  int    `json:"borrow_limit" binding:"required,min=1"`
}

// แก้ข้อมูลตัวเองจากหน้าโปรไฟล์ ไม่รวมรหัสผ่านกับตำแหน่ง
// ตำแหน่งเปลี่ยนเองไม่ได้ ต้องให้หัวหน้าเป็นคนแก้ ไม่งั้นใครก็เลื่อนขั้นตัวเองได้
type UpdateProfileRequest struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required,email"`
	Phone string `json:"phone"`
}

// เปลี่ยนรหัสผ่าน ต้องยืนยันรหัสเดิมก่อนเสมอ
// กันกรณีมีคนมานั่งที่เครื่องที่เปิดค้างไว้แล้วเปลี่ยนรหัสยึดบัญชี
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
