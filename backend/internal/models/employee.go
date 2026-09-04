package models

type Employee  struct{
	EmployeeID	uint	`gorm:"primaryKey" json:"employee_id"`
	UserID		uint	`gorm:"not null;uniqueIndex" json:"user_id"`
	User 		*User 	`gorm:"foreignKey:UserID" json:"user,omitempty"`
	Position	string	`gorm:"default:staff" json:"position"`
}