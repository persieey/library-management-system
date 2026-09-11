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

type RequestController struct {
	db *gorm.DB
}

func NewRequestController(db *gorm.DB) *RequestController {
	return &RequestController{db: db}
}

func (rc *RequestController) nextRequestID() string {
	var count int64
	rc.db.Model(&models.Request{}).Count(&count)
	return fmt.Sprintf("REQ-%04d", count+1)
}

func (rc *RequestController) GetAll(c *gin.Context) {
	var requests []models.Request
	if err := rc.db.Order(`"RequestDate" desc`).Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": requests})
}

func (rc *RequestController) GetByID(c *gin.Context) {
	id := c.Param("id")
	var request models.Request
	if err := rc.db.Where(`"RequestID" = ?`, id).First(&request).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "ไม่พบข้อมูล"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": request})
}

func (rc *RequestController) Create(c *gin.Context) {
	var body dto.CreateRequestDTO
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
	requesterName := ""
	if err := rc.db.Where("user_id = ?", uid).First(&employee).Error; err == nil {
		employeeId = fmt.Sprint(employee.EmployeeID)
	}
	var user models.User
	if err := rc.db.First(&user, uid).Error; err == nil {
		requesterName = user.Name
	}

	request := models.Request{
		RequestID:   rc.nextRequestID(),
		Title:       body.Title,
		Category:    body.Category,
		Quantity:    body.Quantity,
		UnitPrice:   body.UnitPrice,
		TotalPrice:  body.TotalPrice,
		Priority:    body.Priority,
		Vendor:      body.Vendor,
		Purpose:     body.Purpose,
		Notes:       body.Notes,
		EmployeeId:    employeeId,
		RequesterName: requesterName,
		RequestDate: time.Now(),
		Status:      "pending",
	}

	if err := rc.db.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": request})
}

func (rc *RequestController) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var body dto.UpdateStatusDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	updates := map[string]interface{}{"Status": body.Status}
	// เดิมเหตุผลปฏิเสธที่พิมพ์มาไม่เคยถูกบันทึกเลย (DTO ไม่มีฟิลด์นี้) หัวหน้าปฏิเสธ
	// คำขอไปแล้วผู้ยื่นไม่มีทางรู้เหตุผล — เก็บลงคอลัมน์ Notes ที่มีอยู่แล้ว
	if body.Status == "rejected" && body.Reason != "" {
		updates["Notes"] = body.Reason
	}
	if err := rc.db.Model(&models.Request{}).Where(`"RequestID" = ?`, id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "อัปเดตไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": fmt.Sprintf("อัปเดตสถานะเป็น %s สำเร็จ", body.Status)})
}
