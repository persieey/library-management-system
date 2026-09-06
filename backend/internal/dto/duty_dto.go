package dto

// DutyShiftRequest มอบหมายคนหนึ่งคนเข้าจุดบริการหนึ่งจุดในช่วงเวรหนึ่งช่วง
type DutyShiftRequest struct {
	Date           string `json:"date" binding:"required,len=10"`
	Period         string `json:"period" binding:"required,oneof=morning afternoon evening"`
	ServicePointID uint   `json:"service_point_id" binding:"required"`
	PersonnelID    uint   `json:"personnel_id" binding:"required"`
	Lead           bool   `json:"lead"`
	Note           string `json:"note"`
}
