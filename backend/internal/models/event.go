package models

import "time"

// Event คือกิจกรรมของหอสมุดที่ประกาศบนหน้าเว็บ
type Event struct {
	EventID     uint   `gorm:"primaryKey" json:"id"`
	Title       string `gorm:"size:300;not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	Location    string `gorm:"size:300" json:"location"`

	// Image เก็บได้สองแบบ — ชื่อรูปที่มากับหน้าเว็บ เช่น "event-1" หรือ data URI ที่อัปโหลดเอง
	Image string `gorm:"type:text" json:"image"`

	StartAt time.Time `gorm:"index" json:"start_at"`
	AllDay  bool      `json:"all_day"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
