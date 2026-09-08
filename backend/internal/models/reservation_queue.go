package models

import "time"

// ReservationQueue ต่อคิวรอหนังสือ/อุปกรณ์ที่ถูกยืมหมด
//
// ตัดมาจาก integration.go ของ B6731915 เฉพาะส่วนนี้ ส่วน ExternalIdentity กับ
// HostAssertionUse เป็นของระบบ SSO ข้ามแอปที่โปรเจกต์นี้ไม่ได้ใช้ (รันรวมเป็น
// backend เดียว ไม่ได้ฝัง iframe แยกระบบ) จึงไม่เอามาด้วย
type ReservationQueue struct {
	ID        uint   `gorm:"primaryKey" json:"ID"`
	UserID    uint   `gorm:"uniqueIndex:waiting_member_item,where:status = 'waiting'" json:"user_id"`
	Kind      string `gorm:"uniqueIndex:waiting_member_item,where:status = 'waiting'" json:"kind"`
	ItemID    string `gorm:"uniqueIndex:waiting_member_item,where:status = 'waiting'" json:"item_id"`
	Title     string `json:"title"`
	Days      int    `json:"days"`
	Status    string `json:"status"`
	CreatedAt time.Time
}
