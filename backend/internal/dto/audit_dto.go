package dto

import "time"

type CreateSessionDTO struct {
	Location  string    `json:"location" binding:"required"`
	AuditDate time.Time `json:"audit_date"`
}

type UpdateSessionDTO struct {
	Summary        string `json:"summary"`
	Recommendation string `json:"recommendation"`
	Status         string `json:"status"`
}

type AuditRowInput struct {
	AssetID   string `json:"asset_id"`
	AssetCode string `json:"asset_code"`
	AssetName string `json:"asset_name"`
	Expected  int    `json:"expected"`
	Found     int    `json:"found"`
	Condition string `json:"condition"`
	Note      string `json:"note"`
}

type SaveRowsDTO struct {
	Rows []AuditRowInput `json:"rows"`
}

type CreateDiscrepancyDTO struct {
	AssetCode string `json:"asset_code" binding:"required"`
	AssetName string `json:"asset_name" binding:"required"`
	Type      string `json:"type" binding:"required"`
	Expected  string `json:"expected"`
	Actual    string `json:"actual" binding:"required"`
	Cause     string `json:"cause"`
	Action    string `json:"action"`
}

type SubmitReportDTO struct {
	Note string `json:"note"`
}

type ReviewReportDTO struct {
	Action string `json:"action" binding:"required,oneof=approve reject"`
	Note   string `json:"note"`
}
