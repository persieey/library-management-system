package models

import "time"

type User struct {
	UserID		uint 		`gorm:"primaryKey" json:"user_id"`
	Name		string		`gorm:"not null" json:"name"`
	Phone		string		`json:"phone"`
	Email		string		`gorm:"uniqueIndex;not null" json:"email"`
	Password	string		`gorm:"not null" json:"-"`
	Status		string		`gorm:"default:active" json:"status"`
	CreatedAt	time.Time	`json:"created_at"`
	UpdatedAt	time.Time	`json:"updated_at"`
}