package models

import "time"

type BorrowTransaction struct {
	BorrowId      string       `gorm:"primaryKey" json:"borrow_id"`
	BorrowDate    time.Time    `json:"borrow_date"`
	DueDate       time.Time    `json:"due_date"`
	Status        string       `json:"status"`
	ReservationId string       `gorm:"not null;uniqueIndex" json:"reservation_id"`
	Reservation   *Reservation `gorm:"belongsTo;foreignKey:ReservationId;references:ReservationId" json:"-"`
}
