package dto

type CreateEquipmentRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category"`
	Location string `json:"location"`
}

type UpdateEquipmentStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=available maintenance"`
}