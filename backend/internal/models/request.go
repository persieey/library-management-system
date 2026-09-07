package models

import "time"

type Request struct {
	RequestID   string    `gorm:"primaryKey;column:RequestID" json:"id"`
	Title       string    `gorm:"column:Title" json:"title"`
	Category    string    `gorm:"column:Category" json:"category"`
	Quantity    int       `gorm:"column:Quantity" json:"quantity"`
	UnitPrice   float64   `gorm:"column:UnitPrice" json:"unit_price"`
	TotalPrice  float64   `gorm:"column:TotalPrice" json:"total_price"`
	Priority    string    `gorm:"column:Priority;default:ปกติ" json:"priority"`
	Status      string    `gorm:"column:Status;default:pending" json:"status"`
	EmployeeId     string    `gorm:"column:EmployeeId" json:"employee_id"`
	RequesterName  string    `gorm:"column:RequesterName" json:"requester_name"`
	RequestDate time.Time `gorm:"column:RequestDate" json:"request_date"`
	Vendor      string    `gorm:"column:Vendor" json:"vendor"`
	Purpose     string    `gorm:"column:Purpose" json:"purpose"`
	Notes       string    `gorm:"column:Notes" json:"notes"`
}

func (Request) TableName() string { return "Request" }
