package dto

// CreateLeaveRequest คำขอลาที่พนักงานยื่นเข้ามา
// ไม่มี user_id เพราะเซิร์ฟเวอร์ยึดจาก token เสมอ ไม่งั้นยื่นลาแทนคนอื่นได้
type CreateLeaveRequest struct {
	LeaveType string `json:"leave_type" binding:"required,oneof=sick personal vacation"`
	StartDate string `json:"start_date" binding:"required,len=10"`
	EndDate   string `json:"end_date" binding:"required,len=10"`
	Reason    string `json:"reason" binding:"required"`
}

// DecideLeaveRequest คำตัดสินของหัวหน้า อนุมัติหรือไม่อนุมัติ
type DecideLeaveRequest struct {
	Status       string `json:"status" binding:"required,oneof=approved rejected"`
	DecisionNote string `json:"decision_note"`
}
