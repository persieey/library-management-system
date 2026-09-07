package models

import "time"

type Asset struct {
	AssetID      string     `gorm:"primaryKey;column:AssetID" json:"id"`
	Barcode      string     `gorm:"column:Barcode" json:"barcode"`
	Quantity     int        `gorm:"column:Quantity;default:1" json:"quantity"`
	Name         string     `gorm:"column:Name;not null" json:"name"`
	Type         string     `gorm:"column:Type" json:"type"`
	Location     string     `gorm:"column:Location" json:"location"`
	Condition    string     `gorm:"column:Condition" json:"condition"`
	PrRef        string     `gorm:"column:PrRef" json:"pr_ref"`
	SerialNo     string     `gorm:"column:SerialNo" json:"serial_no"`
	Notes        string     `gorm:"column:Notes" json:"notes"`
	RegisterDate *time.Time `gorm:"column:RegisterDate" json:"register_date"`
}

func (Asset) TableName() string { return "Asset" }
