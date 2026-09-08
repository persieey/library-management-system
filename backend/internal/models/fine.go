package models

import "time"

type Fine struct {
	FineId      string             `gorm:"primaryKey" json:"fine_id"`
	OverdueDays int                `json:"overdue_days"`
	Amount      float64            `json:"amount"`
	PaidStatus  string             `json:"paid_status"`
	PaidDate    *time.Time         `json:"paid_date"`
	Description string             `json:"description"`
	ReportId    string             `json:"report_id"`
	BorrowId    string             `gorm:"not null;uniqueIndex" json:"borrow_id"`
	Borrow      *BorrowTransaction `gorm:"belongsTo;foreignKey:BorrowId;references:BorrowId" json:"-"`
}
