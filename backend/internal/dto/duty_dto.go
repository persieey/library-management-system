package dto

// DutyShiftRequest ใช้ทั้งตอนเพิ่มและตอนแก้เวร รูปเดียวกัน
type DutyShiftRequest struct {
	Date        string `json:"date" binding:"required,len=10"`
	Period      string `json:"period" binding:"required,oneof=morning afternoon evening"`
	LeadID      uint   `json:"lead_id" binding:"required"`
	AssistantID *uint  `json:"assistant_id"`
	Note        string `json:"note"`
}
