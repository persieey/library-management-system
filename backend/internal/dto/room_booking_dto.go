package dto

type CreateRoomBookingRequest struct {
	RoomID        uint   `json:"room_id" binding:"required"`
	BookingType   string `json:"booking_type"`
	StartDateTime string `json:"start_datetime" binding:"required"` // RFC3339
	EndDateTime   string `json:"end_datetime" binding:"required"`
}

type UpdateRoomBookingStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending confirmed cancelled completed"`
}