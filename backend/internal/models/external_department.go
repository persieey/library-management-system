package models

// ExternalDepartment หน่วยงานภายนอกที่ประสานงาน
type ExternalDepartment struct {
	DepartmentID   string `gorm:"primaryKey;column:department_id;size:50" json:"department_id"`
	DepartmentName string `gorm:"column:department_name;size:100;not null" json:"department_name"`
}

func (ExternalDepartment) TableName() string {
	return "external_departments"
}
