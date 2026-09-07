package models

import "time"

type RepairRequest struct {
	RequestID   uint      `gorm:"primaryKey" json:"request_id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID;references:UserID" json:"user"`
	EquipmentID uint      `gorm:"not null" json:"equipment_id"`
	Equipment   Equipment `gorm:"foreignKey:EquipmentID;references:EquipmentID" json:"equipment"`
	Description string    `json:"description"`
	Urgency     string    `gorm:"default:Medium" json:"urgency"`
	PhotoURL    string    `json:"photo_url"`
	Status      string    `gorm:"default:pending" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RepairLog struct {
	LogID           uint      `gorm:"primaryKey" json:"log_id"`
	RepairRequestID uint      `gorm:"not null" json:"repair_request_id"`
	ActionDate      time.Time `json:"action_date"`
	Detail          string    `json:"detail"`
	CreatedAt       time.Time `json:"created_at"`
}