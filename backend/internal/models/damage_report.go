package models

import "time"

type DamageReport struct {
	ReportId    string    `gorm:"primaryKey" json:"report_id"`
	Description string    `json:"description"`
	ReportDate  time.Time `json:"report_date"`
	DamageType  string    `json:"damage_type"`
	ReturnId    string    `json:"return_id"`
	FineId      string    `json:"fine_id"`
}
