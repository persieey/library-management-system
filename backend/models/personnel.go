package models

import "time"

// PersonnelStatus บอกว่าเจ้าหน้าที่คนนี้ยังปฏิบัติงานอยู่หรือไม่
type PersonnelStatus string

const (
	PersonnelActive   PersonnelStatus = "active"
	PersonnelInactive PersonnelStatus = "inactive"
)

// IsValid กันค่าสถานะแปลกปลอมที่ส่งมาจากหน้าเว็บ
func (s PersonnelStatus) IsValid() bool {
	return s == PersonnelActive || s == PersonnelInactive
}

// Personnel คือเจ้าหน้าที่หนึ่งคนในหอสมุด แยกจากตาราง users ที่ใช้ล็อกอิน
// คนที่มีแถวที่นี่อาจยังไม่มีบัญชีล็อกอินก็ได้ และกลับกัน
type Personnel struct {
	ID         int    `gorm:"primaryKey" json:"id"`
	StaffID    string `gorm:"size:30;uniqueIndex;not null" json:"staff_id"`
	FirstName  string `gorm:"size:100;not null" json:"first_name"`
	LastName   string `gorm:"size:100;not null" json:"last_name"`
	Department string `gorm:"size:120;index" json:"department"`
	Position   string `gorm:"size:120" json:"position"`
	Email      string `gorm:"size:150" json:"email"`
	Phone      string `gorm:"size:30" json:"phone"`

	// StartDate เก็บเป็นข้อความรูปแบบ YYYY-MM-DD ไม่ใช่ timestamp
	// เพราะเป็นวันที่ล้วนไม่มีเวลา ถ้าเก็บเป็น timestamp จะเพี้ยนไปหนึ่งวันเวลาข้ามโซนเวลา
	StartDate string `gorm:"size:10" json:"start_date"`

	Status PersonnelStatus `gorm:"size:20;index" json:"status"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
