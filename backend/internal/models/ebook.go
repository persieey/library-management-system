package models

import "time"

type Ebook struct {
	EbookID     uint      `gorm:"primaryKey" json:"ebook_id"`
	ISBN        string    `json:"isbn"`
	Title       string    `gorm:"not null" json:"title"`
	Author      string    `gorm:"not null" json:"author"`
	Publisher   string    `json:"publisher"`
	Category    string    `json:"category"`
	Description string    `gorm:"type:text" json:"description"`
	FileName    string    `json:"file_name"`
	FileType    string    `json:"file_type"`
	FilePath    string    `json:"file_path"`
	CoverPath   string    `json:"cover_path"`
	EmployeeID  *uint     `json:"employee_id"`
	Employee    *Employee `gorm:"foreignKey:EmployeeID;references:EmployeeID" json:"employee,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
