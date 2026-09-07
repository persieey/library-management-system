package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

type AuditController struct {
	db *gorm.DB
}

func NewAuditController(db *gorm.DB) *AuditController {
	return &AuditController{db: db}
}

func (ac *AuditController) GetStats(c *gin.Context) {
	var totalAssets int64
	ac.db.Model(&models.Asset{}).Count(&totalAssets)

	var submitted int64
	ac.db.Model(&models.InspectReport{}).Where(`"Status" = ?`, "submitted").Count(&submitted)

	var draft int64
	ac.db.Model(&models.InspectReport{}).Where(`"Status" = ?`, "draft").Count(&draft)

	var discTotal int64
	ac.db.Model(&models.Discrepancy{}).Count(&discTotal)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_assets":  totalAssets,
			"pending_audit": draft,
			"audited":       submitted,
			"discrepancies": discTotal,
		},
	})
}

func (ac *AuditController) ListSessions(c *gin.Context) {
	var reports []models.InspectReport
	if err := ac.db.Order(`"ReportDate" desc`).Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": reports})
}

func (ac *AuditController) CreateSession(c *gin.Context) {
	var body dto.CreateSessionDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	// โปรเจกต์ของเจ้าของงาน fork มาตอน Employee ยังเป็น PK แบบ string ตาราง "Employee"
	// และ user_id ใน token เป็น string ตอนนี้ของทีมเป็น uint ตาราง employees/users
	// จึงปรับเฉพาะบรรทัดที่อ่านค่าจาก token กับ query ให้ตรงกับโมเดลปัจจุบัน ตรรกะเดิมคงไว้
	uid, _ := userID.(uint)

	var employee models.Employee
	employeeId := ""
	auditorName := "Unknown"
	if err := ac.db.Where("user_id = ?", uid).First(&employee).Error; err == nil {
		employeeId = fmt.Sprint(employee.EmployeeID)
	}
	var user models.User
	if ac.db.First(&user, uid).Error == nil {
		auditorName = user.Name
	}

	auditDate := body.AuditDate
	if auditDate.IsZero() {
		auditDate = time.Now()
	}

	report := models.InspectReport{
		ReportDate:  auditDate,
		Location:    body.Location,
		EmployeeId:  employeeId,
		AuditorName: auditorName,
		Status:      "draft",
	}

	if err := ac.db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": report})
}

func (ac *AuditController) GetSession(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var report models.InspectReport
	if err := ac.db.Preload("Rows").Preload("Discrepancies").First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "ไม่พบข้อมูล"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}

func (ac *AuditController) UpdateSession(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body dto.UpdateSessionDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if body.Summary != "" {
		updates["Summary"] = body.Summary
	}
	if body.Recommendation != "" {
		updates["Recommendation"] = body.Recommendation
	}
	if body.Status != "" {
		updates["Status"] = body.Status
	}

	if len(updates) > 0 {
		if err := ac.db.Model(&models.InspectReport{}).Where(`"ReportID" = ?`, id).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "อัปเดตไม่สำเร็จ"})
			return
		}
	}

	var report models.InspectReport
	ac.db.Preload("Rows").Preload("Discrepancies").First(&report, id)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}

func (ac *AuditController) SaveRows(c *gin.Context) {
	reportID, _ := strconv.Atoi(c.Param("id"))
	var body dto.SaveRowsDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	// โปรเจกต์ของเจ้าของงาน fork มาตอน Employee ยังเป็น PK แบบ string ตาราง "Employee"
	// และ user_id ใน token เป็น string ตอนนี้ของทีมเป็น uint ตาราง employees/users
	// จึงปรับเฉพาะบรรทัดที่อ่านค่าจาก token กับ query ให้ตรงกับโมเดลปัจจุบัน ตรรกะเดิมคงไว้
	uid, _ := userID.(uint)
	var employee models.Employee
	employeeId := ""
	if err := ac.db.Where("user_id = ?", uid).First(&employee).Error; err == nil {
		employeeId = fmt.Sprint(employee.EmployeeID)
	}

	ac.db.Where(`"ReportID" = ?`, reportID).Delete(&models.Inspect{})

	rows := make([]models.Inspect, len(body.Rows))
	for i, r := range body.Rows {
		rows[i] = models.Inspect{
			InspectID:   utils.GenID("INS"),
			ReportID:    reportID,
			EmployeeId:  employeeId,
			AssetID:     r.AssetID,
			AssetCode:   r.AssetCode,
			AssetName:   r.AssetName,
			ExpectedQty: r.Expected,
			FoundQty:    r.Found,
			Condition:   r.Condition,
			Note:        r.Note,
		}
	}

	if len(rows) > 0 {
		if err := ac.db.Create(&rows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกไม่สำเร็จ"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": rows})
}

func (ac *AuditController) AddDiscrepancy(c *gin.Context) {
	sessionID, _ := strconv.Atoi(c.Param("id"))
	var body dto.CreateDiscrepancyDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	disc := models.Discrepancy{
		SessionID: sessionID,
		AssetCode: body.AssetCode,
		AssetName: body.AssetName,
		Type:      body.Type,
		Expected:  body.Expected,
		Actual:    body.Actual,
		Cause:     body.Cause,
		Action:    body.Action,
	}

	if err := ac.db.Create(&disc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": disc})
}

func (ac *AuditController) DeleteDiscrepancy(c *gin.Context) {
	discID, _ := strconv.Atoi(c.Param("disc_id"))
	if err := ac.db.Delete(&models.Discrepancy{}, discID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "ลบไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (ac *AuditController) ReviewReport(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body dto.ReviewReportDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	// โปรเจกต์ของเจ้าของงาน fork มาตอน Employee ยังเป็น PK แบบ string ตาราง "Employee"
	// และ user_id ใน token เป็น string ตอนนี้ของทีมเป็น uint ตาราง employees/users
	// จึงปรับเฉพาะบรรทัดที่อ่านค่าจาก token กับ query ให้ตรงกับโมเดลปัจจุบัน ตรรกะเดิมคงไว้
	uid, _ := userID.(uint)
	reviewerName := "Manager"
	var user models.User
	if ac.db.First(&user, uid).Error == nil {
		reviewerName = user.Name
	}

	status := "approved"
	if body.Action == "reject" {
		status = "rejected"
	}

	now := time.Now()
	if err := ac.db.Model(&models.InspectReport{}).Where(`"ReportID" = ?`, id).Updates(map[string]interface{}{
		"Status":       status,
		"ReviewNote":   body.Note,
		"ReviewedAt":   &now,
		"ReviewerName": reviewerName,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกผลการตรวจสอบไม่สำเร็จ"})
		return
	}

	var report models.InspectReport
	ac.db.Preload("Rows").Preload("Discrepancies").First(&report, id)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}

func (ac *AuditController) SubmitReport(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	now := time.Now()
	if err := ac.db.Model(&models.InspectReport{}).Where(`"ReportID" = ?`, id).Updates(map[string]interface{}{
		"Status":      "submitted",
		"SubmittedAt": &now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "ส่งรายงานไม่สำเร็จ"})
		return
	}

	var report models.InspectReport
	ac.db.Preload("Rows").Preload("Discrepancies").First(&report, id)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}
