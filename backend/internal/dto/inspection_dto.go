package dto
type CreateInspectionRequest struct {
	CopyID      uint   `json:"copy_id" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type UpdateInspectionRequest struct {
	Description *string `json:"description"`
	Resolved    *bool   `json:"resolved"`
}