package models

import "time"

// DutyPeriod ช่วงเวรในหนึ่งวัน
type DutyPeriod string

const (
	DutyMorning   DutyPeriod = "morning"
	DutyAfternoon DutyPeriod = "afternoon"
	DutyEvening   DutyPeriod = "evening"
)

func (p DutyPeriod) IsValid() bool {
	return p == DutyMorning || p == DutyAfternoon || p == DutyEvening
}

// DutyShift คือเวรหนึ่งช่วงของหนึ่งวัน มีหัวหน้าเวรหนึ่งคนและผู้ช่วยได้หนึ่งคน
//
// ผูกกับ Personnel ไม่ใช่ User เพราะตารางเวรเป็นเรื่องของทะเบียนบุคลากร
// เจ้าหน้าที่บางคนมีประวัติงานบุคคลแต่ยังไม่มีบัญชีเข้าระบบ ก็ยังจัดเวรให้ได้
type DutyShift struct {
	ShiftID uint `gorm:"primaryKey" json:"id"`

	// เก็บวันที่เป็นข้อความ YYYY-MM-DD เหมือน Personnel.StartDate
	// เป็นวันที่ล้วนไม่มีเวลา ถ้าเก็บเป็น timestamp จะเพี้ยนไปหนึ่งวันเวลาข้ามโซนเวลา
	Date string `gorm:"size:10;index;not null" json:"date"`

	Period DutyPeriod `gorm:"size:20;not null" json:"period"`

	LeadID      uint  `gorm:"not null" json:"lead_id"`
	AssistantID *uint `json:"assistant_id,omitempty"`

	Note string `gorm:"size:255" json:"note"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ชื่อคนสำหรับแสดงผล ไม่ได้เก็บในตาราง คอนโทรลเลอร์เติมให้ตอนอ่าน
	// ไม่ประกาศเป็นความสัมพันธ์ของ GORM ด้วยเหตุผลเดียวกับ LeaveRequest
	LeadName      string `gorm:"-" json:"lead_name"`
	AssistantName string `gorm:"-" json:"assistant_name"`
}
