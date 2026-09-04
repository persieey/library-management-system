package dto

type CreateComplaintInput struct {
	Topic         string  `json:"topic" binding:"required"`
	Category      string  `json:"category" binding:"required"`
	Description   string  `json:"description" binding:"required"`
	Location      string  `json:"location"`
	Priority      string  `json:"priority"`
	AttachedImage string `json:"attached_image"`
	UserID        *uint  `json:"user_id"`
}

type UpdateComplaintInput struct {
	Status            string  `json:"status"`
	DepartmentID      *string `json:"department_id"`
	ExternalUnit      string  `json:"external_unit"`
	InspectorReport   string  `json:"inspector_report"`
	RejectReason      string  `json:"reject_reason"`
	ResolutionSummary string  `json:"resolution_summary"`
	ResolutionImage   string `json:"resolution_image"`
	EmployeeID        *uint  `json:"employee_id"`
}

type ComplaintResponse struct {
	ComplaintID       string `json:"complaint_id"`
	UserID            *uint  `json:"user_id"`
	DepartmentID      *string `json:"department_id"`
	DepartmentName    string  `json:"department_name"`
	Topic             string  `json:"topic"`
	Category          string  `json:"category"`
	Description       string  `json:"description"`
	Location          string  `json:"location"`
	Priority          string  `json:"priority"`
	AttachedImage     string  `json:"attached_image"`
	SubmitDate        string  `json:"submit_date"`
	SubmitTime        string  `json:"submit_time"`
	Status            string  `json:"status"`
	InspectorReport   string  `json:"inspector_report"`
	RejectReason      string  `json:"reject_reason"`
	ResolutionSummary string  `json:"resolution_summary"`
	ResolutionImage   string  `json:"resolution_image"`
	InspectorName     string  `json:"inspector_name"`
}
