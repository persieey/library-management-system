package models

import "time"

// BookProblem is the quarantine table for a physical copy that can no longer
// be borrowed.  It stores a snapshot because the copy is removed from the
// active book_copies catalogue.
type BookProblem struct {
	ProblemID      string    `gorm:"primaryKey" json:"problem_id"`
	OriginalCopyID uint      `gorm:"uniqueIndex" json:"original_copy_id"`
	BookID         uint      `json:"book_id"`
	CopyNumber     int       `json:"copy_number"`
	Title          string    `json:"title"`
	ISBN           string    `json:"isbn"`
	CallNumber     string    `json:"call_number"`
	Location       string    `json:"location"`
	ProblemType    string    `json:"problem_type"` // damaged or lost
	Description    string    `json:"description"`
	ReservationID  string    `json:"reservation_id"`
	BorrowID       string    `json:"borrow_id"`
	ReturnID       string    `json:"return_id"`
	ReportID       string    `json:"report_id"`
	FineID         string    `json:"fine_id"`
	MovedAt        time.Time `json:"moved_at"`
	CreatedAt      time.Time `json:"created_at"`
}

func (BookProblem) TableName() string { return "book_problems" }
