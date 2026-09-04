package dto

type CreateMemberRequest struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Phone        string `json:"phone"`
	Password     string `json:"password" binding:"required,min=6"`
	UniversityID string `json:"university_id" binding:"required"`
	BorrowLimit  int    `json:"borrow_limit" binding:"required,min=1"`
}

type CreateEmployeeRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required,min=6"`
	Position string `json:"position" binding:"required,oneof=manager librarian"`
}

type CreateMemberProfileRequest struct {
	UserID       uint   `json:"user_id" binding:"required"`
	UniversityID string `json:"university_id" binding:"required"`
	BorrowLimit  int    `json:"borrow_limit" binding:"required,min=1"`
}