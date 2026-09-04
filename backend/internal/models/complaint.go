package models

// Complaint ข้อมูลข้อร้องเรียน
type Complaint struct {
	ComplaintID   string  `gorm:"primaryKey;column:complaint_id;size:50" json:"complaint_id"`
	DepartmentID  *string `gorm:"column:department_id;size:50" json:"department_id"`
	UserID        *uint   `gorm:"column:user_id" json:"user_id"`
	Topic         string  `gorm:"column:topic;size:255;not null" json:"topic"`
	Category      string  `gorm:"column:category;size:100;not null" json:"category"`
	Description   string  `gorm:"column:description;type:text;not null" json:"description"`
	Location      string  `gorm:"column:location;size:255" json:"location"`
	AttachedImage string  `gorm:"column:attached_image;type:text" json:"attached_image"`
	SubmitDate    string  `gorm:"column:submit_date;size:50" json:"submit_date"`
	SubmitTime    string  `gorm:"column:submit_time;size:50" json:"submit_time"`
	Status        string  `gorm:"column:status;size:50;default:'รอตรวจสอบ'" json:"status"`
	Priority      string  `gorm:"column:priority;size:50;default:'ปกติ'" json:"priority"`

	User              *User               `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Department        *ExternalDepartment `gorm:"foreignKey:DepartmentID;references:DepartmentID" json:"department,omitempty"`
	InspectionRecords []InspectionRecord  `gorm:"foreignKey:ComplaintID;references:ComplaintID" json:"inspection_records,omitempty"`
}

func (Complaint) TableName() string {
	return "complaints"
}

// InspectionRecord บันทึกผลการตรวจสอบข้อร้องเรียน
type InspectionRecord struct {
	InspectionID      string `gorm:"primaryKey;column:inspection_id;size:50" json:"inspection_id"`
	EmployeeID        *uint  `gorm:"column:employee_id" json:"employee_id"`
	ComplaintID       string `gorm:"column:complaint_id;size:50;not null" json:"complaint_id"`
	ResultDetail      string  `gorm:"column:result_detail;type:text" json:"result_detail"`
	RejectReason      string  `gorm:"column:reject_reason;type:text" json:"reject_reason"`
	InspectionDate    string  `gorm:"column:inspection_date;size:50" json:"inspection_date"`
	ResolutionSummary string  `gorm:"column:resolution_summary;size:255" json:"resolution_summary"`
	ResolutionImage   string  `gorm:"column:resolution_image;type:text" json:"resolution_image"`

	Employee *Employee `gorm:"foreignKey:EmployeeID;references:EmployeeID" json:"employee,omitempty"`
}

func (InspectionRecord) TableName() string {
	return "inspection_records"
}
