package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type InspectionController struct {
	db *gorm.DB
}

func NewInspectionController(db *gorm.DB) *InspectionController {
	return &InspectionController{db: db}
}

func (ic *InspectionController) GetAll(c *gin.Context) {
	var inspections []models.BookInspection

	query := ic.db.Model(&models.BookInspection{})

	if resolved := c.Query("resolved"); resolved != "" {
		query = query.Where("resolved = ?", resolved == "true")
	}

	if err := query.
		Preload("Copy.Book").
		Preload("Employee.User").
		Order("inspection_date desc").
		Find(&inspections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลการตรวจไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inspections": inspections})
}

func (ic *InspectionController) GetByCopy(c *gin.Context) {
	copyID := c.Param("id")

	var inspections []models.BookInspection
	if err := ic.db.Where("copy_id = ?", copyID).
		Preload("Employee.User").
		Order("inspection_date desc").
		Find(&inspections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลการตรวจไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"inspections": inspections})
}

func (ic *InspectionController) Create(c *gin.Context) {
	var req dto.CreateInspectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var copyRow models.BookCopy
	if err := ic.db.First(&copyRow, req.CopyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบเล่มหนังสือที่ระบุ"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var employee models.Employee
	if err := ic.db.Where("user_id = ?", userID).First(&employee).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่พบข้อมูลพนักงาน"})
		return
	}

	inspection := models.BookInspection{
		CopyID:         req.CopyID,
		EmployeeID:     &employee.EmployeeID,
		Description:    req.Description,
		InspectionDate: time.Now(),
	}

	if err := ic.db.Create(&inspection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกการตรวจไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "บันทึกการตรวจสำเร็จ",
		"inspection": inspection,
	})
}

func (ic *InspectionController) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req dto.UpdateInspectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var inspection models.BookInspection
	if err := ic.db.First(&inspection, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบรายการตรวจนี้"})
		return
	}

	updates := map[string]interface{}{}

	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Resolved != nil {
		updates["resolved"] = *req.Resolved
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลที่ต้องการแก้ไข"})
		return
	}

	if err := ic.db.Model(&inspection).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไขรายการตรวจไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "แก้ไขรายการตรวจสำเร็จ",
		"inspection": inspection,
	})
}

func (ic *InspectionController) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	result := ic.db.Delete(&models.BookInspection{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบรายการตรวจไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบรายการตรวจนี้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบสำเร็จ"})
}	