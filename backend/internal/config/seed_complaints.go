package config

import (
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// SeedExternalDepartments ใส่รายชื่อหน่วยงานภายนอกที่หน้าอนุมัติเรื่องร้องเรียนใช้เลือก
//
// เดิมตาราง external_departments ว่างเปล่า ทำให้ตอนหัวหน้ากดอนุมัติแล้วเลือกหน่วยงาน
// (ComplaintDetailCard.tsx ส่ง external_unit เป็นชื่อหน่วยงาน) ฝั่ง backend หาแถวที่ชื่อตรงกัน
// ไม่เจอ (complaint_controller.go UpdateComplaint) จึงไม่ตั้ง department_id ให้เลย — หน่วยงานที่เลือก
// ไว้เลยหายไปเงียบ ๆ หลังบันทึก ต้องมีข้อมูลตรงนี้ก่อน ชื่อต้องตรงกับตัวเลือกใน dropdown เป๊ะ ๆ
func SeedExternalDepartments(db *gorm.DB) error {
	var count int64
	db.Model(&models.ExternalDepartment{}).Count(&count)
	if count > 0 {
		return nil
	}

	departments := []models.ExternalDepartment{
		{DepartmentID: "DEPT001", DepartmentName: "กองอาคารสถานที่"},
		{DepartmentID: "DEPT002", DepartmentName: "ศูนย์คอมพิวเตอร์"},
		{DepartmentID: "DEPT003", DepartmentName: "งานเทคโนโลยีการศึกษา"},
	}
	return db.Create(&departments).Error
}
