package dto

type CreateRepairRequest struct {
	EquipmentID uint   `json:"equipment_id" binding:"required"`
	Description string `json:"description" binding:"required"`
	Urgency     string `json:"urgency" binding:"omitempty,oneof=Low Medium High Critical"`
}

type UpdateRepairStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending in_progress completed cancelled"`
	Detail string `json:"detail"`
}