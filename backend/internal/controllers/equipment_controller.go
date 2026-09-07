package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type EquipmentController struct {
	db *gorm.DB
}

func NewEquipmentController(db *gorm.DB) *EquipmentController {
	return &EquipmentController{db: db}
}

func (ec *EquipmentController) List(c *gin.Context) {
	var items []models.Equipment
	if err := ec.db.Order("equipment_id asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลอุปกรณ์ไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"equipment": items})
}

func (ec *EquipmentController) Create(c *gin.Context) {
	var req dto.CreateEquipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := models.Equipment{
		Name:     req.Name,
		Category: req.Category,
		Location: req.Location,
		Status:   "available",
	}

	if err := ec.db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มอุปกรณ์ไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (ec *EquipmentController) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateEquipmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status ต้องเป็น available หรือ maintenance"})
		return
	}

	var item models.Equipment
	if err := ec.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอุปกรณ์"})
		return
	}

	item.Status = req.Status
	if err := ec.db.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}