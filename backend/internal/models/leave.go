package models

import "time"

// LeaveStatus สถานะคำขอลา
type LeaveStatus string

const (
	LeavePending  LeaveStatus = "pending"
	LeaveApproved LeaveStatus = "approved"
	LeaveRejected LeaveStatus = "rejected"
	LeaveCanceled LeaveStatus = "canceled"
)

func (s LeaveStatus) IsValid() bool {
	return s == LeavePending || s == LeaveApproved || s == LeaveRejected || s == LeaveCanceled
}

// LeaveType ประเภทการลา
type LeaveType string

const (
	LeaveSick     LeaveType = "sick"
	LeavePersonal LeaveType = "personal"
	LeaveVacation LeaveType = "vacation"
)

func (t LeaveType) IsValid() bool {
	return t == LeaveSick || t == LeavePersonal || t == LeaveVacation
}

// LeaveRequest คือคำขอลาหนึ่งใบ พนักงานยื่น หัวหน้าหอสมุดเป็นคนอนุมัติ
//
// ผูกกับ UserID ไม่ใช่ EmployeeID เพราะ user_id มากับ token อยู่แล้วทุกคำขอ
// ไม่ต้องไปค้นตาราง employees ซ้ำ และคำขอจะไม่หายถ้าแถวใน employees ถูกแก้
type LeaveRequest struct {
	LeaveID uint `gorm:"primaryKey" json:"id"`

	UserID uint `gorm:"index;not null" json:"user_id"`

	LeaveType LeaveType `gorm:"size:20;not null" json:"leave_type"`

	// เก็บวันที่เป็นข้อความ YYYY-MM-DD เหมือน Personnel.StartDate
	// เป็นวันที่ล้วนไม่มีเวลา ถ้าเก็บเป็น timestamp จะเพี้ยนไปหนึ่งวันเวลาข้ามโซนเวลา
	StartDate string `gorm:"size:10;not null" json:"start_date"`
	EndDate   string `gorm:"size:10;not null" json:"end_date"`

	Reason string `gorm:"type:text" json:"reason"`

	Status LeaveStatus `gorm:"size:20;index;default:'pending'" json:"status"`

	// ApproverID กับ DecidedAt ว่างอยู่จนกว่าหัวหน้าจะตัดสิน
	ApproverID   *uint      `json:"approver_id,omitempty"`
	DecidedAt    *time.Time `json:"decided_at,omitempty"`
	DecisionNote string     `gorm:"type:text" json:"decision_note"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ชื่อคนสำหรับแสดงผล ไม่ได้เก็บในตาราง คอนโทรลเลอร์เติมให้ตอนอ่าน
	//
	// จงใจไม่ประกาศเป็นความสัมพันธ์ของ GORM เพราะ Member ของทีมประกาศ
	// ความสัมพันธ์กับ User ไว้กำกวม พอ GORM ไล่กราฟความสัมพันธ์จะสร้าง
	// foreign key ผิดทิศแล้ว AutoMigrate ล้มทั้งชุด ดึงชื่อเองปลอดภัยกว่า
	UserName     string `gorm:"-" json:"user_name"`
	ApproverName string `gorm:"-" json:"approver_name"`
}
