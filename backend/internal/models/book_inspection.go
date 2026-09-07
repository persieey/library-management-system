package models

import "time"

type BookInspection struct {
	InspectionID   uint      `gorm:"primaryKey" json:"inspection_id"`
	CopyID         uint      `gorm:"not null;index" json:"copy_id"`
	Copy           *BookCopy `gorm:"foreignKey:CopyID;references:CopyID" json:"copy,omitempty"`
	EmployeeID     *uint     `json:"employee_id"`
	Employee       *Employee `gorm:"foreignKey:EmployeeID;references:EmployeeID" json:"employee,omitempty"`
	InspectionDate time.Time `json:"inspection_date"`
	Description    string    `json:"description"`
	Resolved       bool      `gorm:"default:false" json:"resolved"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
