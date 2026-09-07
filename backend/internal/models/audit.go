package models

import "time"

type InspectReport struct {
	ReportID       int           `gorm:"primaryKey;autoIncrement;column:ReportID" json:"id"`
	ReportDate     time.Time     `gorm:"column:ReportDate;autoCreateTime" json:"audit_date"`
	Status         string        `gorm:"column:Status;default:draft" json:"status"`
	EmployeeId     string        `gorm:"column:EmployeeId" json:"employee_id"`
	Location       string        `gorm:"column:Location" json:"location"`
	AuditorName    string        `gorm:"column:AuditorName" json:"auditor_name"`
	Summary        string        `gorm:"column:Summary" json:"summary"`
	Recommendation string        `gorm:"column:Recommendation" json:"recommendation"`
	SubmittedAt    *time.Time    `gorm:"column:SubmittedAt" json:"submitted_at"`
	ReviewerName   string        `gorm:"column:ReviewerName" json:"reviewer_name"`
	ReviewNote     string        `gorm:"column:ReviewNote" json:"review_note"`
	ReviewedAt     *time.Time    `gorm:"column:ReviewedAt" json:"reviewed_at"`
	Rows           []Inspect     `gorm:"foreignKey:ReportID" json:"rows,omitempty"`
	Discrepancies  []Discrepancy `gorm:"foreignKey:SessionID;references:ReportID" json:"discrepancies,omitempty"`
}

func (InspectReport) TableName() string { return "InspectReport" }

type Inspect struct {
	InspectID     string    `gorm:"primaryKey;column:InspectID" json:"inspect_id"`
	InspectDate   time.Time `gorm:"column:InspectDate;autoCreateTime" json:"inspect_date"`
	InspectStatus string    `gorm:"column:InspectStatus;default:pending" json:"inspect_status"`
	FoundQty      int       `gorm:"column:FoundQty" json:"found"`
	Condition     string    `gorm:"column:Condition;default:ปกติ" json:"condition"`
	EmployeeId    string    `gorm:"column:EmployeeId" json:"employee_id"`
	ReportID      int       `gorm:"column:ReportID" json:"report_id"`
	AssetID       string    `gorm:"column:AssetID" json:"asset_id"`
	AssetCode     string    `gorm:"column:AssetCode" json:"asset_code"`
	AssetName     string    `gorm:"column:AssetName" json:"asset_name"`
	ExpectedQty   int       `gorm:"column:ExpectedQty" json:"expected"`
	Note          string    `gorm:"column:Note" json:"note"`
}

func (Inspect) TableName() string { return "Inspect" }

type Discrepancy struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	SessionID int    `json:"session_id"`
	AssetCode string `json:"asset_code"`
	AssetName string `json:"asset_name"`
	Type      string `json:"type"`
	Expected  string `json:"expected"`
	Actual    string `json:"actual"`
	Cause     string `json:"cause"`
	Action    string `json:"action"`
}
