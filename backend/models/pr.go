package models

import "time"

// PRStatus คือสถานะของข่าวประชาสัมพันธ์ เก็บเป็นข้อความไทยตรงกับที่แสดงบนหน้าเว็บ
// จงใจไม่แปลงเป็นรหัสอังกฤษ เพราะทั้งหน้าเว็บและผู้ใช้อ่านค่านี้ตรงๆ อยู่แล้ว
type PRStatus string

const (
	PRPublished PRStatus = "เผยแพร่"
	PRDraft     PRStatus = "ร่าง"
	PRScheduled PRStatus = "ตั้งเวลา"
	PRExpired   PRStatus = "หมดอายุ"
)

// IsValid กันค่าสถานะแปลกปลอมที่ส่งมาจากหน้าเว็บ
func (s PRStatus) IsValid() bool {
	switch s {
	case PRPublished, PRDraft, PRScheduled, PRExpired:
		return true
	}
	return false
}

// PRItem คือข่าวประชาสัมพันธ์หนึ่งชิ้น
// เวลาทุกช่องเก็บเป็น timestamp จริง ไม่ใช่ข้อความที่จัดรูปแล้ว
// การจัดรูปวันที่แบบไทยเป็นหน้าที่ของฝั่งหน้าเว็บ
type PRItem struct {
	ID      int      `gorm:"primaryKey" json:"id"`
	Title   string   `gorm:"size:300;not null" json:"title"`
	Content string   `gorm:"type:text" json:"content"`
	Channel string   `gorm:"size:50" json:"channel"`
	Status  PRStatus `gorm:"size:30;index" json:"status"`
	Pinned  bool     `json:"pinned"`
	Views   int      `json:"views"`

	// PublishedAt คือเวลาที่เผยแพร่จริง ว่างแปลว่ายังไม่เคยขึ้นเว็บ
	PublishedAt *time.Time `json:"published_at"`
	// ExpiresAt คือวันหมดอายุ ว่างแปลว่าไม่มีกำหนด
	ExpiresAt *time.Time `json:"expires_at"`
	// ScheduledAt มีค่าเฉพาะตอนสถานะเป็น "ตั้งเวลา" — ตัวจับเวลาฝั่งเซิร์ฟเวอร์ใช้ค่านี้
	ScheduledAt *time.Time `json:"scheduled_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
