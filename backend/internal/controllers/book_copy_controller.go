package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type BookCopyController struct {
	db *gorm.DB
}

func NewBookCopyController(db *gorm.DB) *BookCopyController {
	return &BookCopyController{db: db}
}

func (bcc *BookCopyController) GetAll(c *gin.Context) {
	var copies []models.BookCopy
	
	bookID := c.Query("book_id")
	query := bcc.db.Model(&models.BookCopy{})
	if bookID != "" {
		query = query.Where("book_id = ?", bookID)
	}
	if err := query.Preload("Book").Order("created_at desc").Find(&copies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"copies": copies})

}

func (bcc *BookCopyController) Create(c *gin.Context) {
	var req dto.CreateBookCopyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var book models.Book
	if err := bcc.db.First(&book, req.BookID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบหนังสือที่ระบุ" })
		return
	}


	copies := models.BookCopy{           
		BookID: req.BookID,           
		CopyNumber: req.CopyNumber,         
		Building: req.Building,           
		Slot: req.Slot,              
	}
	if err := bcc.db.Create(&copies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มเล่มหนังสือไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "เพิ่ม Bookcopy สำเร็จ",
		"copies":    copies,
	})
}

func (bcc *BookCopyController) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req dto.UpdateBookCopyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var copies models.BookCopy
	if err := bcc.db.First(&copies, id).Error; err != nil { // ← DATABASE (อ่าน: SELECT)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบหนังสือเล่มนี้"})
		return
	}

	updates := map[string]interface{}{}

	if req.CopyNumber != nil {
		updates["copy_number"] = *req.CopyNumber
	}
	if req.Building != nil {
		updates["building"] = *req.Building
	}
	if req.Slot != nil {
		updates["slot"] = *req.Slot
	}
	if req.ConditionStatus != nil {
		updates["condition_status"] = *req.ConditionStatus
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลที่ต้องการแก้ไข"})
		return
	}

	if err := bcc.db.Model(&copies).Updates(updates).Error; err != nil { // ← DATABASE (เขียน: UPDATE)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "แก้ไข้หนังสือไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{ //call back
		"message": "แก้ไขหนังสือสำเร็จ",
		"copies":    copies,
	})
}

func (bcc *BookCopyController) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	// กันลบเล่มที่มีคนกำลังจอง/ยืมอยู่ ไม่งั้นประวัติการยืมของคนนั้นจะหาเล่มไม่เจอ
	// (join ผ่าน copy_id ที่ถูกลบไปแล้ว) เหมือนบั๊กที่เคยเจอกับ BookController.Delete
	var activeCount int64
	bcc.db.Model(&models.Reservation{}).
		Where("copy_id = ? AND status IN ?", id, []string{"reserved", "borrowed"}).
		Count(&activeCount)
	if activeCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ลบไม่ได้ เพราะเล่มนี้มีการจอง/ยืมค้างอยู่"})
		return
	}

	result := bcc.db.Delete(&models.BookCopy{}, id)
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
