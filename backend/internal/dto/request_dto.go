package dto

type CreateRequestDTO struct {
	Title      string  `json:"title" binding:"required"`
	Category   string  `json:"category" binding:"required"`
	Quantity   int     `json:"quantity" binding:"required,min=1"`
	UnitPrice  float64 `json:"unit_price" binding:"required,min=0"`
	TotalPrice float64 `json:"total_price"`
	Priority   string  `json:"priority"`
	Vendor     string  `json:"vendor"`
	Purpose    string  `json:"purpose" binding:"required"`
	Notes      string  `json:"notes"`
}

type UpdateStatusDTO struct {
	Status string `json:"status" binding:"required"`
	// เหตุผลตอนปฏิเสธคำขอ (ไม่บังคับ) — ผู้ยื่นจะได้รู้ว่าทำไมถึงถูกปฏิเสธ
	Reason string `json:"reason"`
}
