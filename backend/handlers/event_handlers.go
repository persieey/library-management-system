package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"library-management-system/models"
	"library-management-system/store"
)

// Events รวม handler ทั้งหมดของกิจกรรมหอสมุด
type Events struct{ Items *store.EventStore }

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
func (h *Events) List(c *gin.Context) {
	events, err := h.Items.List()
	if err != nil {
		Fail(c, http.StatusInternalServerError, "อ่านข้อมูลกิจกรรมไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, events)
}

func (h *Events) Create(c *gin.Context) {
	var req eventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	event := &models.Event{}
	req.apply(event)
	if err := h.Items.Create(event); err != nil {
		Fail(c, http.StatusInternalServerError, "บันทึกกิจกรรมไม่สำเร็จ")
		return
	}
	Success(c, http.StatusCreated, event)
}

func (h *Events) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req eventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	event, err := h.Items.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
		return
	}

	req.apply(event)
	if err := h.Items.Save(event); err != nil {
		Fail(c, http.StatusInternalServerError, "บันทึกการแก้ไขไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, event)
}

func (h *Events) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	if err := h.Items.Delete(id); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, gin.H{"message": "ลบกิจกรรมแล้ว"})
}

func (h *Events) failFromStore(c *gin.Context, err error) {
	if errors.Is(err, store.ErrEventNotFound) {
		Fail(c, http.StatusNotFound, "ไม่พบกิจกรรมที่ต้องการ")
		return
	}
	Fail(c, http.StatusInternalServerError, "ทำรายการไม่สำเร็จ")
}
