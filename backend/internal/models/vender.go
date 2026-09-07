package models

type Vender struct {
	VenderId   string `gorm:"primaryKey;column:VenderId" json:"vender_id"`
	VenderName string `gorm:"column:VenderName;not null" json:"vender_name"`
	Contact    string `gorm:"column:Contact" json:"contact"`
}

func (Vender) TableName() string { return "Vender" }
