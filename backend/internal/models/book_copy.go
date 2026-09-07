package models

import "time"

type BookCopy struct {
	CopyID             uint      `gorm:"primaryKey" json:"copy_id"`
	BookID             uint      `gorm:"not null;index" json:"book_id"`
	Book               *Book     `gorm:"foreignKey:BookID;references:BookID" json:"book,omitempty"`
	CopyNumber         int       `gorm:"not null" json:"copy_number"` //เล่ม 1,2,3,...
	Building           string    `json:"building"`
	Slot               string    `json:"slot"`
	AvailabilityStatus string    `gorm:"default:available" json:"availability_status"`
	ConditionStatus    string    `gorm:"default:good" json:"condition_status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
