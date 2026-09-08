package models

type Equipmentborrow struct {
	EquipmentId   string `gorm:"primaryKey" json:"equipment_id"`
	AssetNumber   string `json:"asset_number"`
	EquipmentName string `json:"equipment_name"`
	Category      string `json:"category"`
	Brand         string `json:"brand"`
	Model         string `json:"model"`
	Location      string `json:"location"`
	Status        string `json:"status"`
	BorrowId      string `json:"borrow_id"`
	Condition     string `gorm:"default:good" json:"condition"`
	ImageURL      string `json:"image_url"`
}

// TableName ตั้งเป็น equipment_items ไม่ใช่ equipment เพราะ equipment ถูกใช้แล้ว
// โดยตาราง Equipment ของ B6715588 (บรรพต) คนละ schema กันเลย (bigint PK vs string PK)
// ทีมโหวตให้แยกตาราง (ทาง B) เก็บของสองระบบไว้คนละชุด แทนที่จะรวม schema เข้าด้วยกัน
func (Equipmentborrow) TableName() string { return "equipment_items" }
