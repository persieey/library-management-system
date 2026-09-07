package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type RepairController struct {
	db *gorm.DB
}

func NewRepairController(db *gorm.DB) *RepairController {
	return &RepairController{db: db}
}

// allowed image extensions for the optional supporting photo
var allowedPhotoExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

// POST /api/v1/repairs — ใครก็แจ้งซ่อมได้ (ทั้ง student และ staff)
// รับได้ทั้ง JSON และ multipart/form-data (multipart ใช้ตอนแนบรูป)
func (rc *RepairController) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาเข้าสู่ระบบก่อน"})
		return
	}

	var (
		equipmentID uint
		description string
		urgency     string
		photoURL    string
	)

	contentType := c.ContentType()
	if strings.HasPrefix(contentType, "multipart/form-data") ||
		strings.HasPrefix(contentType, "application/x-www-form-urlencoded") {
		idStr := strings.TrimSpace(c.PostForm("equipment_id"))
		parsed, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil || parsed == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "equipment_id ไม่ถูกต้อง"})
			return
		}
		equipmentID = uint(parsed)
		description = strings.TrimSpace(c.PostForm("description"))
		urgency = strings.TrimSpace(c.PostForm("urgency"))

		if description == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกรายละเอียดปัญหา"})
			return
		}

		// optional supporting photo
		if file, err := c.FormFile("photo"); err == nil && file != nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if !allowedPhotoExt[ext] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif)"})
				return
			}
			if file.Size > 5<<20 { // 5 MB
				c.JSON(http.StatusBadRequest, gin.H{"error": "ไฟล์รูปต้องไม่เกิน 5 MB"})
				return
			}
			if err := os.MkdirAll(filepath.Join("uploads", "repairs"), 0o755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกรูปไม่สำเร็จ"})
				return
			}
			name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
			dst := filepath.Join("uploads", "repairs", name)
			if err := c.SaveUploadedFile(file, dst); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกรูปไม่สำเร็จ"})
				return
			}
			photoURL = "/uploads/repairs/" + name
		}
	} else {
		var req dto.CreateRepairRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		equipmentID = req.EquipmentID
		description = req.Description
		urgency = req.Urgency
	}

	if urgency == "" {
		urgency = "Medium"
	}

	// อุปกรณ์หนึ่งชิ้นมีคำแจ้งซ่อมที่ยังไม่เสร็จได้ครั้งละ 1 รายการ —
	// ต้องรอให้ซ่อมเสร็จ (completed) หรือยกเลิก (cancelled) ก่อนถึงจะแจ้งใหม่ได้
	var openCount int64
	if err := rc.db.Model(&models.RepairRequest{}).
		Where("equipment_id = ? AND status IN ?", equipmentID, []string{"pending", "in_progress"}).
		Count(&openCount).Error; err != nil {
		if photoURL != "" {
			_ = os.Remove(filepath.Join("uploads", "repairs", filepath.Base(photoURL)))
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบสถานะอุปกรณ์ไม่สำเร็จ"})
		return
	}
	if openCount > 0 {
		if photoURL != "" {
			_ = os.Remove(filepath.Join("uploads", "repairs", filepath.Base(photoURL)))
		}
		c.JSON(http.StatusConflict, gin.H{
			"error": "อุปกรณ์นี้มีคำแจ้งซ่อมที่ยังไม่เสร็จอยู่แล้ว ต้องรอให้ซ่อมเสร็จก่อนจึงจะแจ้งซ่อมใหม่ได้",
		})
		return
	}

	item := models.RepairRequest{
		UserID:      userID.(uint),
		EquipmentID: equipmentID,
		Description: description,
		Urgency:     urgency,
		PhotoURL:    photoURL,
		Status:      "pending",
	}

	// Creating the request and marking the equipment as under maintenance
	// must happen together — if one fails, roll back both.
	err := rc.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		return tx.Model(&models.Equipment{}).
			Where("equipment_id = ?", equipmentID).
			Update("status", "maintenance").Error
	})

	if err != nil {
		// the row never landed — don't leave an orphan upload behind
		if photoURL != "" {
			_ = os.Remove(filepath.Join("uploads", "repairs", filepath.Base(photoURL)))
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ส่งคำขอแจ้งซ่อมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// GET /api/v1/repairs — staff เท่านั้น เห็นทุกคำขอ
func (rc *RepairController) List(c *gin.Context) {
	var items []models.RepairRequest
	if err := rc.db.Preload("User").Preload("Equipment").
		Order("request_id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลแจ้งซ่อมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"repair_requests": items})
}

// GET /api/v1/repairs/mine — เห็นแค่ของตัวเอง (ไม่ต้องเป็น staff)
func (rc *RepairController) MyRepairs(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var items []models.RepairRequest
	if err := rc.db.Preload("Equipment").
		Where("user_id = ?", userID).
		Order("request_id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"repair_requests": items})
}

// PATCH /api/v1/repairs/:id/status — staff เท่านั้น เปลี่ยนสถานะ + บันทึก log
func (rc *RepairController) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateRepairStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status ไม่ถูกต้อง"})
		return
	}

	var item models.RepairRequest
	if err := rc.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำขอแจ้งซ่อม"})
		return
	}

	err := rc.db.Transaction(func(tx *gorm.DB) error {
		item.Status = req.Status
		if err := tx.Save(&item).Error; err != nil {
			return err
		}

		log := models.RepairLog{
			RepairRequestID: item.RequestID,
			ActionDate:      time.Now(),
			Detail:          req.Detail,
		}
		if err := tx.Create(&log).Error; err != nil {
			return err
		}

		// Equipment goes back to "available" only once the repair is
		// actually done. Cancelled repairs also free it up (nothing wrong
		// with the equipment after all).
		if req.Status == "completed" || req.Status == "cancelled" {
			return tx.Model(&models.Equipment{}).
				Where("equipment_id = ?", item.EquipmentID).
				Update("status", "available").Error
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}
