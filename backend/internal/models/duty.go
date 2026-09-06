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

// ServicePoint คือจุดบริการที่ต้องมีคนประจำ เช่น เคาน์เตอร์ยืม-คืน หรือเคาน์เตอร์ตอบคำถาม
//
// หอสมุดจริงจัดเวรตามจุดบริการ ไม่ใช่จัดรวมทั้งห้องสมุดเป็นเวรเดียว
// เพราะแต่ละจุดเปิดคนละชั้น ต้องการคนคนละจำนวน และบางจุดไม่ได้เปิดทุกช่วง
type ServicePoint struct {
	ServicePointID uint `gorm:"primaryKey" json:"id"`

	Name     string `gorm:"size:120;not null" json:"name"`
	Location string `gorm:"size:120" json:"location"`

	// MinStaff จำนวนคนขั้นต่ำที่จุดนี้ต้องมีในหนึ่งช่วงเวร ใช้เตือนเมื่อจัดคนไม่ครบ
	MinStaff int `gorm:"default:1" json:"min_staff"`

	// SortOrder คุมลำดับที่แสดงในตาราง ให้จุดบริการหลักอยู่บน
	SortOrder int  `gorm:"default:0" json:"sort_order"`
	Active    bool `gorm:"default:true" json:"active"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DutyShift คือการมอบหมายหนึ่งครั้ง = คนหนึ่งคน ประจำจุดหนึ่งจุด ในช่วงเวรหนึ่งช่วงของวันหนึ่ง
//
// หนึ่งช่วงเวรของจุดหนึ่งมีได้หลายคน จึงเก็บเป็นหนึ่งแถวต่อหนึ่งคน
// ไม่ใช่หัวหน้าเวรกับผู้ช่วยอย่างละคนเหมือนตอนแรก ซึ่งไม่ตรงกับการใช้งานจริง
//
// ผูกกับ Personnel ไม่ใช่ User เพราะตารางเวรเป็นเรื่องของทะเบียนบุคลากร
// เจ้าหน้าที่บางคนมีประวัติงานบุคคลแต่ยังไม่มีบัญชีเข้าระบบ ก็ยังจัดเวรให้ได้
type DutyShift struct {
	ShiftID uint `gorm:"primaryKey" json:"id"`

	// เก็บวันที่เป็นข้อความ YYYY-MM-DD เหมือน Personnel.StartDate
	// เป็นวันที่ล้วนไม่มีเวลา ถ้าเก็บเป็น timestamp จะเพี้ยนไปหนึ่งวันเวลาข้ามโซนเวลา
	Date   string     `gorm:"size:10;index;not null" json:"date"`
	Period DutyPeriod `gorm:"size:20;not null" json:"period"`

	ServicePointID uint `gorm:"index;not null" json:"service_point_id"`
	PersonnelID    uint `gorm:"index;not null" json:"personnel_id"`

	// Lead บอกว่าคนนี้เป็นผู้รับผิดชอบหลักของจุดนั้นในช่วงนั้น
	Lead bool   `gorm:"default:false" json:"lead"`
	Note string `gorm:"size:255" json:"note"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ข้อมูลสำหรับแสดงผล ไม่ได้เก็บในตาราง คอนโทรลเลอร์เติมให้ตอนอ่าน
	// ไม่ประกาศเป็นความสัมพันธ์ของ GORM ด้วยเหตุผลเดียวกับ LeaveRequest
	PersonnelName    string `gorm:"-" json:"personnel_name"`
	Department       string `gorm:"-" json:"department"`
	ServicePointName string `gorm:"-" json:"service_point_name"`
	// OnLeave เตือนว่าคนนี้ยื่นลาและได้รับอนุมัติในวันนั้นแล้ว
	OnLeave bool `gorm:"-" json:"on_leave"`
}
