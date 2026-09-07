package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type EbookController struct {
	db *gorm.DB
}

func NewEbookController(db *gorm.DB) *EbookController {
	return &EbookController{db: db}
}

func (ec *EbookController) GetAll(c *gin.Context) {
	var ebooks []models.Ebook

	if err := ec.db.Order("created_at desc").Find(&ebooks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูล E-Book ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ebooks": ebooks})
}

func (ec *EbookController) Create(c *gin.Context) {
	var req dto.CreateEbookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var employee models.Employee
	if err := ec.db.Where("user_id = ?", userID).First(&employee).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่พบพนักงาน"})
		return
	}

	ebook := models.Ebook{
		ISBN:        req.ISBN,
		Title:       req.Title,
		Author:      req.Author,
		Publisher:   req.Publisher,
		Category:    req.Category,
		FileName:    req.FileName,
		FileType:    req.FileType,
		FilePath:    req.FilePath,
		CoverPath:   req.CoverPath,
		EmployeeID:  &employee.EmployeeID,
		Description: req.Description,
	}
	if err := ec.db.Create(&ebook).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่ม E-Book ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "เพิ่ม E-Book สำเร็จ",
		"ebook":   ebook,
	})
}

func (ec *EbookController) Delete(c *gin.Context) {
	id := c.Param("id")

	result := ec.db.Delete(&models.Ebook{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบ E-book ไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ E-Book "})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบสำเร็จ"})
}

func (ec *EbookController) Update(c *gin.Context) {
	id := c.Param("id") // ← frontend (อ่านจาก URL)

	var req dto.UpdateEbookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ebook models.Ebook
	if err := ec.db.First(&ebook, id).Error; err != nil { // ← DATABASE (อ่าน: SELECT)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Ebook"})
		return
	}

	updates := map[string]interface{}{}

	if req.ISBN != nil {
		updates["isbn"] = *req.ISBN
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Author != nil {
		updates["author"] = *req.Author
	}
	if req.Publisher != nil {
		updates["publisher"] = *req.Publisher
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.CoverPath != nil {
		updates["cover_path"] = *req.CoverPath
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.FileName != nil {
		updates["file_name"] = *req.FileName
	}
	if req.FileType != nil {
		updates["file_type"] = *req.FileType
	}
	if req.FilePath != nil {
		updates["file_path"] = *req.FilePath
		
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลที่ต้องการแก้ไข"})
		return
	}

	if err := ec.db.Model(&ebook).Updates(updates).Error; err != nil { // ← DATABASE (เขียน: UPDATE)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไข้ E-book ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{ //call back
		"message": "แก้ไข E-Book สำเร็จ",
		"ebook":   ebook,
	})
}

func (ec *EbookController) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์ที่อัปโหลด"})
		return
	}

	if file.Size > 50*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ขนาดไฟล์ใหญ่เกิน 50 MB"})
		return
	}
	safeName := filepath.Base(file.Filename)
	ext := strings.ToLower(filepath.Ext(safeName))
	if ext != ".pdf" && ext != ".epub" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์ pdf และ .epub"}) //.epub ไฟลื Ebook
		return
	}

	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง folder ไม่สำเร็จ "})
		return
	}

	storedName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeName)
	savedPath := filepath.Join("./uploads", storedName)

	if err := c.SaveUploadedFile(file, savedPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "อัปโหลดไฟล์สำเร็จ",
		"file_name": safeName,
		"file_type": ext,
		"file_path": savedPath,
	})

}

func (ec *EbookController) UploadCover(c *gin.Context) {
	cover_file, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์หน้าปกE-Book"})
		return
	}
	if cover_file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ขนาดไฟล์หน้าปกเกิน 5 MB"})
		return
	}

	safeName := filepath.Base(cover_file.Filename)
	ext := strings.ToLower(filepath.Ext(safeName))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับแค่ไฟล์รูป"})
		return
	}

	if err := os.MkdirAll("./uploads/covers", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง folder ไม่สำเร็จ "})
		return
	}

	stroeName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeName)
	savedPath := filepath.Join("./uploads/covers", stroeName)

	if err := c.SaveUploadedFile(cover_file, savedPath); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "อัปโหลดหน้าปก E-Book สำเร็จ",
		"cover_path": savedPath,
	})
}

func (ec *EbookController) GetFile(c *gin.Context) {
	id := c.Param("id")

	var ebook models.Ebook
	if err := ec.db.First(&ebook, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ E-Book "})
		return
	}

	if ebook.FilePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่มีไฟล์ E-Book"})
		return
	}
	c.File(ebook.FilePath)
}

func (ec *EbookController) GetCover(c *gin.Context) {
	id := c.Param("id")

	var ebook models.Ebook
	if err := ec.db.First(&ebook, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Cover Path "})
		return
	}

	if ebook.CoverPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่มีไฟล์ Cover Path"})
		return
	}
	c.File(ebook.CoverPath)
}
