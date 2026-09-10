package models

type Member struct{
	MemberID		uint 	`gorm:"primaryKey" json:"member_id"`
	UserID			uint	`gorm:"not null;uniqueIndex" json:"user_id"`
	User *User `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	UniversityID	string 	`gorm:"not null" json:"university_id"`
	MemberType		string	`gorm:"not null" json:"member_type"`
	Borrowlimit		int		`gorm:"not null" json:"borrow_limit"`
}