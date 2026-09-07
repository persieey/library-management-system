package models

import "time"

type Equipment struct {
	EquipmentID uint      `gorm:"primaryKey" json:"equipment_id"`
	Name        string    `gorm:"not null" json:"name"`
	Category    string    `json:"category"`
	Location    string    `json:"location"`
	Status      string    `gorm:"default:available" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}