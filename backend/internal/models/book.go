package models

import "time"

type Book struct {
	BookID        uint      `gorm:"primaryKey" json:"book_id"`
	ISBN          string    `json:"isbn"` //ซ้ำได้เพราะบางครั่งหนังสือมีซ้ำกัน
	Title         string    `gorm:"not null" json:"title"`
	Author        string    `gorm:"not null" json:"author"`
	Publisher     string    `json:"publisher"`
	Category      string    `json:"category"`
	CallNumber    string    `json:"call_number"`
	Description   string    `gorm:"type:text" json:"description"`
	CoverImageURL string    `json:"cover_image_url"`
	CoverPath     string    `json:"cover_path"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
