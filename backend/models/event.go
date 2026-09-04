package models

import "time"

// Event คือกิจกรรมของหอสมุดที่ประกาศบนหน้าเว็บ
// ชื่อฟิลด์ตั้งให้ตรงกับ Event ในสาขา B6731915 เพื่อให้รวม schema กันได้ง่ายตอนรวมงาน
type Event struct {
	ID          int    `gorm:"primaryKey" json:"id"`
	Title       string `gorm:"size:300;not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	Location    string `gorm:"size:300" json:"location"`

	// Image เก็บได้สองแบบ — URL เต็ม หรือชื่อรูปที่มากับหน้าเว็บ เช่น "event-1"
	// ฝั่งหน้าเว็บเป็นคนแปลชื่อเป็นไฟล์จริง
	Image string `gorm:"type:text" json:"image"`

	StartAt time.Time `gorm:"index" json:"start_at"`
	AllDay  bool      `json:"all_day"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
