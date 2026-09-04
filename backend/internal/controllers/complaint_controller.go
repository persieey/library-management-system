package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type ComplaintController struct {
	DB *gorm.DB
}

func NewComplaintController(db *gorm.DB) *ComplaintController {
	return &ComplaintController{DB: db}
}

// GetComplaints ดึงรายการข้อร้องเรียนทั้งหมด
func (cc *ComplaintController) GetComplaints(c *gin.Context) {
	var complaints []models.Complaint
	if err := cc.DB.Preload("Department").Preload("InspectionRecords.Employee.User").Order("complaint_id desc").Find(&complaints).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := make([]dto.ComplaintResponse, 0)
	for _, cp := range complaints {
		priority := cp.Priority
		if priority == "" {
			priority = "ปกติ"
		}

		res := dto.ComplaintResponse{
			ComplaintID:   cp.ComplaintID,
			UserID:        cp.UserID,
			DepartmentID:  cp.DepartmentID,
			Topic:         cp.Topic,
			Category:      cp.Category,
			Description:   cp.Description,
			Location:      cp.Location,
			Priority:      priority,
			AttachedImage: cp.AttachedImage,
			SubmitDate:    cp.SubmitDate,
			SubmitTime:    cp.SubmitTime,
			Status:        cp.Status,
		}

		if cp.Department != nil {
			res.DepartmentName = cp.Department.DepartmentName
		}

		if len(cp.InspectionRecords) > 0 {
			lastIns := cp.InspectionRecords[len(cp.InspectionRecords)-1]
			res.InspectorReport = lastIns.ResultDetail
			res.RejectReason = lastIns.RejectReason
			res.ResolutionSummary = lastIns.ResolutionSummary
			res.ResolutionImage = lastIns.ResolutionImage
			if lastIns.Employee != nil && lastIns.Employee.User != nil {
				res.InspectorName = lastIns.Employee.User.Name
			}
		}

		response = append(response, res)
	}

	c.JSON(http.StatusOK, response)
}

// CreateComplaint บันทึกข้อร้องเรียนใหม่
func (cc *ComplaintController) CreateComplaint(c *gin.Context) {
	var input dto.CreateComplaintInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	cc.DB.Model(&models.Complaint{}).Count(&count)
	newID := fmt.Sprintf("UP%04d", count+1001)

	now := time.Now()
	thaiMonths := []string{"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."}
	submitDate := fmt.Sprintf("%02d %s %d", now.Day(), thaiMonths[now.Month()], now.Year()+543)
	submitTime := fmt.Sprintf("%02d.%02d น.", now.Hour(), now.Minute())
	var userID *uint
	if input.UserID != nil {
		userID = input.UserID
	} else if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uint); ok {
			userID = &u
		}
	}
	if userID == nil {
		defaultUID := uint(1)
		userID = &defaultUID
	}

	priority := input.Priority
	if priority == "" {
		priority = "ปกติ"
	}

	complaint := models.Complaint{
		ComplaintID:   newID,
		UserID:        userID,
		Topic:         input.Topic,
		Category:      input.Category,
		Description:   input.Description,
		Location:      input.Location,
		Priority:      priority,
		AttachedImage: input.AttachedImage,
		SubmitDate:    submitDate,
		SubmitTime:    submitTime,
		Status:        "รอตรวจสอบ",
	}

	if err := cc.DB.Create(&complaint).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกข้อร้องเรียนสำเร็จ", "data": complaint})
}

// GetComplaintByID ดึงข้อมูลข้อร้องเรียนตาม ID
func (cc *ComplaintController) GetComplaintByID(c *gin.Context) {
	id := c.Param("id")
	var cp models.Complaint
	if err := cc.DB.Preload("Department").Preload("InspectionRecords.Employee.User").First(&cp, "complaint_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อร้องเรียน"})
		return
	}

	priority := cp.Priority
	if priority == "" {
		priority = "ปกติ"
	}

	res := dto.ComplaintResponse{
		ComplaintID:   cp.ComplaintID,
		UserID:        cp.UserID,
		DepartmentID:  cp.DepartmentID,
		Topic:         cp.Topic,
		Category:      cp.Category,
		Description:   cp.Description,
		Location:      cp.Location,
		Priority:      priority,
		AttachedImage: cp.AttachedImage,
		SubmitDate:    cp.SubmitDate,
		SubmitTime:    cp.SubmitTime,
		Status:        cp.Status,
	}

	if cp.Department != nil {
		res.DepartmentName = cp.Department.DepartmentName
	}

	if len(cp.InspectionRecords) > 0 {
		lastIns := cp.InspectionRecords[len(cp.InspectionRecords)-1]
		res.InspectorReport = lastIns.ResultDetail
		res.RejectReason = lastIns.RejectReason
		res.ResolutionSummary = lastIns.ResolutionSummary
		res.ResolutionImage = lastIns.ResolutionImage
		if lastIns.Employee != nil && lastIns.Employee.User != nil {
			res.InspectorName = lastIns.Employee.User.Name
		}
	}

	c.JSON(http.StatusOK, res)
}

// UpdateComplaint อัปเดตสถานะและการตรวจสอบข้อร้องเรียน
func (cc *ComplaintController) UpdateComplaint(c *gin.Context) {
	id := c.Param("id")
	var complaint models.Complaint
	if err := cc.DB.First(&complaint, "complaint_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อร้องเรียน"})
		return
	}

	var input dto.UpdateComplaintInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Status != "" {
		updates["status"] = input.Status
	}
	if input.DepartmentID != nil {
		updates["department_id"] = input.DepartmentID
	} else if input.ExternalUnit != "" && input.ExternalUnit != "-" {
		var dept models.ExternalDepartment
		if err := cc.DB.Where("department_name = ?", input.ExternalUnit).First(&dept).Error; err == nil {
			updates["department_id"] = dept.DepartmentID
		}
	}

	cc.DB.Model(&complaint).Updates(updates)

	if input.InspectorReport != "" || input.RejectReason != "" || input.ResolutionSummary != "" || input.ResolutionImage != "" {
		var ins models.InspectionRecord
		err := cc.DB.Where("complaint_id = ?", id).First(&ins).Error
		var empID *uint
		if input.EmployeeID != nil {
			empID = input.EmployeeID
		} else if uid, exists := c.Get("user_id"); exists {
			var emp models.Employee
			if err := cc.DB.Where("user_id = ?", uid).First(&emp).Error; err == nil {
				empID = &emp.EmployeeID
			}
		}
		if empID == nil {
			defaultEmp := uint(1)
			empID = &defaultEmp
		}

		now := time.Now()
		thaiMonths := []string{"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."}
		insDate := fmt.Sprintf("%02d %s %d", now.Day(), thaiMonths[now.Month()], now.Year()+543)

		if err != nil {
			var insCount int64
			cc.DB.Model(&models.InspectionRecord{}).Count(&insCount)
			newIns := models.InspectionRecord{
				InspectionID:      fmt.Sprintf("INS%03d", insCount+1),
				EmployeeID:        empID,
				ComplaintID:       id,
				ResultDetail:      input.InspectorReport,
				RejectReason:      input.RejectReason,
				InspectionDate:    insDate,
				ResolutionSummary: input.ResolutionSummary,
				ResolutionImage:   input.ResolutionImage,
			}
			cc.DB.Create(&newIns)
		} else {
			insUpdates := map[string]interface{}{}
			if input.InspectorReport != "" {
				insUpdates["result_detail"] = input.InspectorReport
			}
			if input.RejectReason != "" {
				insUpdates["reject_reason"] = input.RejectReason
			}
			if input.ResolutionSummary != "" {
				insUpdates["resolution_summary"] = input.ResolutionSummary
			}
			if input.ResolutionImage != "" {
				insUpdates["resolution_image"] = input.ResolutionImage
			}
			cc.DB.Model(&ins).Updates(insUpdates)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลและบันทึกการตรวจสอบเรียบร้อยแล้ว"})
}
