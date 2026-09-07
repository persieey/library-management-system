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

type AssetController struct {
	db *gorm.DB
}

func NewAssetController(db *gorm.DB) *AssetController {
	return &AssetController{db: db}
}

func (ac *AssetController) nextAssetID() string {
	var count int64
	ac.db.Model(&models.Asset{}).Count(&count)
	return fmt.Sprintf("AST-%04d", count+1)
}

func (ac *AssetController) GetAll(c *gin.Context) {
	var assets []models.Asset
	q := ac.db.Order(`"RegisterDate" desc`)
	if loc := c.Query("location"); loc != "" {
		q = q.Where(`"Location" = ?`, loc)
	}
	if err := q.Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": assets})
}

func (ac *AssetController) Create(c *gin.Context) {
	var body dto.CreateAssetDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	now := time.Now()
	qty := body.Quantity
	if qty <= 0 {
		qty = 1
	}
	assetID := ac.nextAssetID()
	asset := models.Asset{
		AssetID:      assetID,
		Barcode:      assetID,
		Name:         body.Name,
		Type:         body.Type,
		Location:     body.Location,
		Condition:    body.Condition,
		PrRef:        body.PrRef,
		SerialNo:     body.SerialNo,
		Notes:        body.Notes,
		Quantity:     qty,
		RegisterDate: &now,
	}

	if err := ac.db.Create(&asset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": asset})
}
