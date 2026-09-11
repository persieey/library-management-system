package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

// EquipmentCatalogController จัดการคลังอุปกรณ์ที่เปิดให้สมาชิกยืมได้ (ตาราง equipment_items /
// models.Equipmentborrow) — คนละระบบกับ EquipmentController ที่ดูแลครุภัณฑ์/แจ้งซ่อม
// (models.Equipment) เดิมตารางนี้ไม่มีหน้าจัดการเลย มีแต่โค้ดที่อ่าน/อัปเดตสถานะตอนยืม-คืน
// ทำให้คลังว่างเปล่า สมาชิกเข้าหน้า "จองอุปกรณ์" แล้วไม่เจออะไรเลย
//
// ตอบกลับแบบ {"error": ...} ธรรมดา (ไม่ใช่ utils.JSONError ที่ห่อ {success,message}) เพราะ
// services/https/index.tsx (apiFetch) ฝั่งหน้าเว็บอ่าน error จาก key "error" เท่านั้น
type EquipmentCatalogController struct {
	db *gorm.DB
}

func NewEquipmentCatalogController(db *gorm.DB) *EquipmentCatalogController {
	return &EquipmentCatalogController{db: db}
}

// GET /api/v1/equipment-items — บรรณารักษ์/หัวหน้าเท่านั้น เห็นทุกสถานะ (ต่างจาก
// /equipment/catalog สาธารณะที่คำนวณ available/reserved ตามช่วงเวลาที่จะยืม)
func (ec *EquipmentCatalogController) List(c *gin.Context) {
	var items []models.Equipmentborrow
	if err := ec.db.Order("equipment_id").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลอุปกรณ์ไม่สำเร็จ"})
		return
	}
	utils.JSONSuccess(c, http.StatusOK, items)
}

// POST /api/v1/equipment-items — เพิ่มอุปกรณ์เข้าคลังให้ยืม
func (ec *EquipmentCatalogController) Create(c *gin.Context) {
	var req dto.CreateEquipmentItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกชื่ออุปกรณ์"})
		return
	}

	item := models.Equipmentborrow{
		EquipmentId:   utils.GenID("EQ"),
		AssetNumber:   req.AssetNumber,
		EquipmentName: req.EquipmentName,
		Category:      req.Category,
		Brand:         req.Brand,
		Model:         req.Model,
		Location:      req.Location,
		Status:        "available",
		Condition:     "good",
	}
	if err := ec.db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มอุปกรณ์ไม่สำเร็จ"})
		return
	}
	utils.JSONSuccess(c, http.StatusCreated, item)
}

// DELETE /api/v1/equipment-items/:id — ลบเฉพาะอุปกรณ์ที่ไม่มีการจอง/ยืมค้างอยู่
func (ec *EquipmentCatalogController) Delete(c *gin.Context) {
	id := c.Param("id")

	var activeCount int64
	ec.db.Model(&models.Reservation{}).
		Where("equipment_id = ? AND status IN ?", id, []string{"reserved", "borrowed"}).
		Count(&activeCount)
	if activeCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ลบไม่ได้ เพราะอุปกรณ์ชิ้นนี้มีการจอง/ยืมค้างอยู่"})
		return
	}

	result := ec.db.Where("equipment_id = ?", id).Delete(&models.Equipmentborrow{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบอุปกรณ์ไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอุปกรณ์"})
		return
	}
	utils.JSONSuccess(c, http.StatusOK, gin.H{"message": "ลบสำเร็จ"})
}
