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

type BookController struct {
	db *gorm.DB
}

func NewBookController(db *gorm.DB) *BookController {
	return &BookController{db: db}
}

func (ec *BookController) GetAll(c *gin.Context) {
	var books []models.Book

	if err := ec.db.Order("created_at desc").Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลหนังสือไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"books": books})

}

func (ec *BookController) Create(c *gin.Context) {
	var req dto.CreateBookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	book := models.Book{
		ISBN:        req.ISBN,
		Title:       req.Title,
		Author:      req.Author,
		Publisher:   req.Publisher,
		Category:    req.Category,
		CallNumber:  req.CallNumber,
		Description: req.Description,
	}
	if err := ec.db.Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่ม Book ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "เพิ่ม Book สำเร็จ",
		"book":    book,
	})
}

func (ec *BookController) Update(c *gin.Context) {
	id := c.Param("id") // ← frontend (อ่านจาก URL)

	var req dto.UpdateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var book models.Book
	if err := ec.db.First(&book, id).Error; err != nil { // ← DATABASE (อ่าน: SELECT)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหนังสือ"})
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
	if req.CallNumber != nil {
		updates["call_number"] = *req.CallNumber
	}
	if req.CoverPath != nil {
		updates["cover_path"] = *req.CoverPath
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลที่ต้องการแก้ไข"})
		return
	}

	if err := ec.db.Model(&book).Updates(updates).Error; err != nil { // ← DATABASE (เขียน: UPDATE)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไข้หนังสือไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{ //call back
		"message": "แก้ไขหนังสือสำเร็จ",
		"book":    book,
	})
}

func (ec *BookController) Delete(c *gin.Context) {
	id := c.Param("id")
	var count int64
	ec.db.Model(&models.BookCopy{}).Where("book_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ลบไม่ได้ เพราะยังมีเล่มอยู่ในระบบ กรุณาลบเล่มทั้งหมดก่อน"})
		return
	}
	result := ec.db.Delete(&models.Book{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบหนังสือไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหนังสือ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบสำเร็จ"})
}
func (bc *BookController) UploadCover(c *gin.Context) {
	file, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์รูปปก"})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ขนาดไฟล์เกิน 5 MB"})
		return
	}

	safeName := filepath.Base(file.Filename)
	ext := strings.ToLower(filepath.Ext(safeName))

	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์รูปภาพ"})
		return
	}

	if err := os.MkdirAll("./uploads/book-covers", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างโฟลเดอร์ไม่สำเร็จ"})
		return
	}

	storedName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeName)
	savedPath := filepath.ToSlash(filepath.Join("./uploads/book-covers", storedName))

	if err := c.SaveUploadedFile(file, savedPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "อัปโหลดรูปปกสำเร็จ",
		"cover_path": savedPath,
	})
}

func (bc *BookController) GetCover(c *gin.Context) {
	id := c.Param("id")

	var book models.Book
	if err := bc.db.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหนังสือเล่มนี้"})
		return
	}

	if book.CoverPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "หนังสือเล่มนี้ยังไม่มีรูปปก"})
		return
	}

	c.File(book.CoverPath)
}
