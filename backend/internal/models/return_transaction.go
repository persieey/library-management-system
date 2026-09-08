package models

import "time"

type ReturnTransaction struct {
	ReturnId      string             `gorm:"primaryKey" json:"return_id"`
	ReturnDate    time.Time          `json:"return_date"`
	BookCondition string             `json:"book_condition"`
	BorrowId      string             `gorm:"not null;uniqueIndex" json:"borrow_id"`
	Borrow        *BorrowTransaction `gorm:"belongsTo;foreignKey:BorrowId;references:BorrowId" json:"-"`
}
