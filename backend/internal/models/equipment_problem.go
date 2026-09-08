package models

import "time"

// EquipmentProblem is the quarantine table for damaged or lost equipment.
// It keeps a snapshot after the active equipment row is removed.
type EquipmentProblem struct {
	ProblemID           string    `gorm:"primaryKey" json:"problem_id"`
	OriginalEquipmentID string    `gorm:"uniqueIndex" json:"original_equipment_id"`
	AssetNumber         string    `json:"asset_number"`
	EquipmentName       string    `json:"equipment_name"`
	Category            string    `json:"category"`
	Brand               string    `json:"brand"`
	Model               string    `json:"model"`
	Location            string    `json:"location"`
	ImageURL            string    `json:"image_url"`
	ProblemType         string    `json:"problem_type"` // damaged or lost
	Description         string    `json:"description"`
	ReservationID       string    `json:"reservation_id"`
	BorrowID            string    `json:"borrow_id"`
	ReturnID            string    `json:"return_id"`
	ReportID            string    `json:"report_id"`
	FineID              string    `json:"fine_id"`
	MovedAt             time.Time `json:"moved_at"`
	CreatedAt           time.Time `json:"created_at"`
}

func (EquipmentProblem) TableName() string { return "equipment_problems" }
