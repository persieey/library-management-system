package models

import "time"

// PersonnelStatus บอกว่าเจ้าหน้าที่คนนี้ยังปฏิบัติงานอยู่หรือไม่
type PersonnelStatus string

const (
	PersonnelActive   PersonnelStatus = "active"
	PersonnelInactive PersonnelStatus = "inactive"
)

func (s PersonnelStatus) IsValid() bool {
	return s == PersonnelActive || s == PersonnelInactive
}

// Personnel คือข้อมูลบุคลากรฝั่งงานบุคคล — รหัสพนักงาน แผนก วันเริ่มงาน
//
// แยกจาก Employee ที่เป็นเรื่องของสิทธิ์เข้าระบบ เพราะสองอย่างนี้ไม่จำเป็นต้องมีคู่กัน:
// พนักงานบางคนมีประวัติแต่ยังไม่มีบัญชีล็อกอิน และบัญชีบางบัญชีก็ไม่มีประวัติงานบุคคล
// ถ้าเป็นคนเดียวกันให้ผูกกันผ่าน EmployeeID
type Personnel struct {
	PersonnelID uint `gorm:"primaryKey" json:"id"`

	// EmployeeID ผูกกับบัญชีพนักงานถ้าคนนี้มีบัญชีเข้าระบบ ว่างได้
	EmployeeID *uint     `gorm:"uniqueIndex" json:"employee_id,omitempty"`
	Employee *Employee `gorm:"foreignKey:EmployeeID;references:EmployeeID" json:"employee,omitempty"`

	StaffID    string `gorm:"size:30;uniqueIndex;not null" json:"staff_id"`
	FirstName  string `gorm:"size:100;not null" json:"first_name"`
	LastName   string `gorm:"size:100;not null" json:"last_name"`
	Department string `gorm:"size:120;index" json:"department"`
	Position   string `gorm:"size:120" json:"position"`
	Email      string `gorm:"size:150" json:"email"`
	Phone      string `gorm:"size:30" json:"phone"`

	// StartDate เก็บเป็นข้อความ YYYY-MM-DD เพราะเป็นวันที่ล้วนไม่มีเวลา
	// ถ้าเก็บเป็น timestamp จะเพี้ยนไปหนึ่งวันเวลาข้ามโซนเวลา
	StartDate string `gorm:"size:10" json:"start_date"`

	Status PersonnelStatus `gorm:"size:20;index" json:"status"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
