package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// PRController ดูแลข่าวประชาสัมพันธ์
type PRController struct{ db *gorm.DB }

func NewPRController(db *gorm.DB) *PRController { return &PRController{db: db} }

// prRequest คือข้อมูลที่หน้าเว็บส่งมาตอนสร้างหรือแก้ไขข่าว
// ไม่มี views เพราะเซิร์ฟเวอร์เป็นคนนับเอง
type prRequest struct {
	Title       string          `json:"title"`
	Content     string          `json:"content"`
	Channel     string          `json:"channel"`
	Status      models.PRStatus `json:"status"`
	Pinned      bool            `json:"pinned"`
	PublishedAt *time.Time      `json:"published_at"`
	ExpiresAt   *time.Time      `json:"expires_at"`
	ScheduledAt *time.Time      `json:"scheduled_at"`
}

func (r *prRequest) validate() error {
	r.Title = strings.TrimSpace(r.Title)
	if r.Title == "" {
		return errors.New("กรุณากรอกหัวข้อข่าว")
	}
	if !r.Status.IsValid() {
		return errors.New("สถานะไม่ถูกต้อง: " + string(r.Status))
	}
	if r.Status == models.PRScheduled && r.ScheduledAt == nil {
		return errors.New("ข่าวที่ตั้งเวลาต้องระบุวันเวลาที่จะเผยแพร่")
	}
	if r.Channel == "" {
		r.Channel = "website"
	}
	return nil
}

// apply ย้ายค่าจากคำขอลงบนข่าว แล้วจัดการเวลาเผยแพร่ให้ถูกตามสถานะ
func (r *prRequest) apply(item *models.PRItem, now time.Time) {
	wasPublished := item.Status == models.PRPublished

	item.Title = r.Title
	item.Content = r.Content
	item.Channel = r.Channel
	item.Status = r.Status
	item.Pinned = r.Pinned
	item.ExpiresAt = r.ExpiresAt

	if r.Status == models.PRScheduled {
		item.ScheduledAt = r.ScheduledAt
	} else {
		item.ScheduledAt = nil
	}

	switch {
	case r.PublishedAt != nil:
		item.PublishedAt = r.PublishedAt
	case r.Status == models.PRPublished && (!wasPublished || item.PublishedAt == nil):
		item.PublishedAt = &now
	}
}

// ordered เรียงข่าวแบบที่หน้าเว็บต้องการ ปักหมุดขึ้นก่อน แล้วเรียงตามเวลาเผยแพร่ล่าสุด
func ordered(tx *gorm.DB) *gorm.DB {
	return tx.Order("pinned DESC, COALESCE(published_at, created_at) DESC, pr_id DESC")
}

// List คนทั่วไปเห็นเฉพาะข่าวที่เผยแพร่แล้ว เจ้าหน้าที่ที่ล็อกอินเห็นทั้งหมด
func (pc *PRController) List(c *gin.Context) {
	position, _ := c.Get("position")
	canManage := position == "librarian" || position == "manager"

	items := []models.PRItem{}
	tx := pc.db
	if !canManage {
		tx = tx.Where("status = ?", models.PRPublished)
	}
	if err := ordered(tx).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลข่าวไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (pc *PRController) Create(c *gin.Context) {
	var req prRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := models.PRItem{}
	req.apply(&item, time.Now())
	if err := pc.db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข่าวไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (pc *PRController) Update(c *gin.Context) {
	item, ok := pc.find(c)
	if !ok {
		return
	}

	var req prRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.apply(item, time.Now())
	if err := pc.db.Save(item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกการแก้ไขไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (pc *PRController) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	result := pc.db.Delete(&models.PRItem{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข่าวไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข่าวที่ต้องการ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข่าวแล้ว"})
}

// Toggle สลับระหว่างเผยแพร่กับพักไว้เป็นร่าง
func (pc *PRController) Toggle(c *gin.Context) {
	item, ok := pc.find(c)
	if !ok {
		return
	}

	if item.Status == models.PRPublished {
		item.Status = models.PRDraft
	} else {
		now := time.Now()
		item.Status = models.PRPublished
		item.ScheduledAt = nil
		if item.PublishedAt == nil {
			item.PublishedAt = &now
		}
	}

	if err := pc.db.Save(item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เปลี่ยนสถานะไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Copy สร้างข่าวใหม่จากข่าวเดิมเป็นฉบับร่าง ไม่ลอกยอดวิวและเวลาเผยแพร่มาด้วย
func (pc *PRController) Copy(c *gin.Context) {
	source, ok := pc.find(c)
	if !ok {
		return
	}

	copied := models.PRItem{
		Title:     source.Title + " (สำเนา)",
		Content:   source.Content,
		Channel:   source.Channel,
		Status:    models.PRDraft,
		ExpiresAt: source.ExpiresAt,
	}
	if err := pc.db.Create(&copied).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "คัดลอกข่าวไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, copied)
}

// View บวกยอดเข้าชม เปิดให้คนทั่วไปเรียกได้เพราะเป็นการอ่านข่าวบนหน้าสาธารณะ
// ทำเป็น UPDATE ทีเดียวเพื่อไม่ให้ยอดหายเวลามีคนเปิดพร้อมกัน
func (pc *PRController) View(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	result := pc.db.Model(&models.PRItem{}).Where("pr_id = ?", id).
		UpdateColumn("views", gorm.Expr("views + 1"))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "นับยอดเข้าชมไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข่าวที่ต้องการ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "นับยอดเข้าชมแล้ว"})
}

func (pc *PRController) find(c *gin.Context) (*models.PRItem, bool) {
	id, ok := idParam(c)
	if !ok {
		return nil, false
	}
	var item models.PRItem
	if err := pc.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข่าวที่ต้องการ"})
		return nil, false
	}
	return &item, true
}

// idParam อ่าน :id จาก path แล้วแปลงเป็นตัวเลข ใช้ร่วมกันทุก controller
func idParam(c *gin.Context) (uint, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รหัสในลิงก์ไม่ถูกต้อง"})
		return 0, false
	}
	return uint(id), true
}
