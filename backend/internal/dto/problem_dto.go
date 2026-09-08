package dto

// ProblemFilterDTO is shared by the two staff-only quarantine endpoints.
// Type is optional: damaged or lost.
type ProblemFilterDTO struct {
	Type string `form:"type" binding:"omitempty,oneof=damaged lost"`
}
