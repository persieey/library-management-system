package models

import "time"

type Order struct {
	OrderID   string    `gorm:"column:OrderID;primaryKey" json:"OrderID"`
	OrderDate time.Time `gorm:"column:OrderDate" json:"OrderDate"`
	RequestID string    `gorm:"column:RequestID" json:"RequestID"`
	VenderId  string    `gorm:"column:VenderId" json:"VenderId"`
}

func (Order) TableName() string { return "Order" }