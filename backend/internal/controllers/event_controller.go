package controllers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// EventController ดูแลกิจกรรมของหอสมุด
type EventController struct{ db *gorm.DB }

func NewEventController(db *gorm.DB) *EventController { return &EventController{db: db} }

type eventRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Image       string    `json:"image"`
	StartAt     time.Time `json:"start_at"`
	AllDay      bool      `json:"all_day"`
}

func (r *eventRequest) validate() error {
	r.Title = strings.TrimSpace(r.Title)
	if r.Title == "" {
		return errors.New("กรุณากรอกชื่อกิจกรรม")
	}
	if r.StartAt.IsZero() {
		return errors.New("กรุณาระบุวันที่จัดกิจกรรม")
	}
	return nil
}

func (r *eventRequest) apply(event *models.Event) {
	event.Title = r.Title
	event.Description = r.Description
	event.Location = r.Location
	event.Image = r.Image
	event.StartAt = r.StartAt
	event.AllDay = r.AllDay
}

// List เปิดให้ทุกคนดูได้ เพราะหน้ากิจกรรมเป็นหน้าสาธารณะ
// เรียงจากใกล้ไปไกลเพื่อให้หน้าเว็บเอาไปแสดงได้เลย
func (ec *EventController) List(c *gin.Context) {
	events := []models.Event{}
	if err := ec.db.Order("start_at ASC, event_id ASC").Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลกิจกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (ec *EventController) Create(c *gin.Context) {
	var req eventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := models.Event{}
	req.apply(&event)
	if err := ec.db.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกกิจกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, event)
}

func (ec *EventController) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req eventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var event models.Event
	if err := ec.db.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบกิจกรรมที่ต้องการ"})
		return
	}

	req.apply(&event)
	if err := ec.db.Save(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกการแก้ไขไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, event)
}

func (ec *EventController) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	result := ec.db.Delete(&models.Event{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบกิจกรรมไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบกิจกรรมที่ต้องการ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบกิจกรรมแล้ว"})
}
