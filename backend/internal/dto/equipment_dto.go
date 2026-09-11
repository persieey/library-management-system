package dto

type CreateEquipmentRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category"`
	Location string `json:"location"`
}

type UpdateEquipmentStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=available maintenance"`
}

// CreateEquipmentItemRequest สร้างอุปกรณ์เข้าคลังให้ยืม (equipment_items) — คนละตาราง
// กับ CreateEquipmentRequest ด้านบนที่เป็นของระบบครุภัณฑ์/แจ้งซ่อม
type CreateEquipmentItemRequest struct {
	EquipmentName string `json:"equipment_name" binding:"required"`
	AssetNumber   string `json:"asset_number"`
	Category      string `json:"category"`
	Brand         string `json:"brand"`
	Model         string `json:"model"`
	Location      string `json:"location"`
}