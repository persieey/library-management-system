package dto

import "encoding/json"

// CreateReservationRequest is shared by the book and equipment subsystems.
// resource_id is used for a book title; equipment_id accepts the equipment code.
type CreateReservationRequest struct {
	ResourceID  uint            `json:"resource_id"`
	EquipmentID json.RawMessage `json:"equipment_id"`
	ReservedFor string          `json:"reserved_for" binding:"required"`
	Days        int             `json:"days" binding:"required,min=1,max=30"`
}

type ReturnReservationRequest struct {
	Condition   string `json:"condition" binding:"omitempty,oneof=good damaged lost"`
	Description string `json:"description" binding:"max=500"`
}

// UpdateFineRequest lets staff assess a damage/loss charge before closing it.
// Paid is true only when the payment has actually been received.
type UpdateFineRequest struct {
	Amount      *float64 `json:"amount" binding:"omitempty,gte=0"`
	Description *string  `json:"description" binding:"omitempty,max=500"`
	Paid        bool     `json:"paid"`
}
