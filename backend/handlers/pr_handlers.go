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

// PR รวม handler ทั้งหมดของระบบประชาสัมพันธ์
type PR struct{ Items *store.PRStore }

// prRequest คือข้อมูลที่หน้าเว็บส่งมาตอนสร้างหรือแก้ไขข่าว
// ไม่มี published_at กับ views เพราะสองอย่างนั้นเซิร์ฟเวอร์เป็นคนกำหนดเอง
type prRequest struct {
	Title   string          `json:"title"`
	Content string          `json:"content"`
	Channel string          `json:"channel"`
	Status  models.PRStatus `json:"status"`
	Pinned  bool            `json:"pinned"`
	// PublishedAt ส่งมาได้เมื่อเจ้าหน้าที่เลือกวันเผยแพร่เอง ถ้าไม่ส่งมาเซิร์ฟเวอร์จะใช้เวลาที่กดเผยแพร่
	PublishedAt *time.Time `json:"published_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
	ScheduledAt *time.Time `json:"scheduled_at"`
}

// validate ตรวจข้อมูลที่รับมาก่อนแตะฐานข้อมูล
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

	// วันเผยแพร่: ถ้าเจ้าหน้าที่เลือกมาเองให้ใช้ค่านั้น
	// ถ้าไม่ได้เลือกและเพิ่งขึ้นเป็นเผยแพร่ ให้จับเวลาตอนนี้ไว้ ส่วนข่าวที่เคยเผยแพร่แล้วคงเวลาเดิม
	switch {
	case r.PublishedAt != nil:
		item.PublishedAt = r.PublishedAt
	case r.Status == models.PRPublished && (!wasPublished || item.PublishedAt == nil):
		item.PublishedAt = &now
	}
}

// List คืนข่าวทั้งหมดให้เจ้าหน้าที่ที่มีสิทธิ์ ส่วนคนทั่วไปเห็นเฉพาะข่าวที่เผยแพร่แล้ว
func (h *PR) List(c *gin.Context) {
	user, loggedIn := UserFrom(c)
	canManage := loggedIn && user.Can(models.PermManagePR)

	var (
		items []models.PRItem
		err   error
	)
	if canManage {
		items, err = h.Items.List()
	} else {
		items, err = h.Items.ListPublished()
	}
	if err != nil {
		Fail(c, http.StatusInternalServerError, "อ่านข้อมูลข่าวไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, items)
}

func (h *PR) Create(c *gin.Context) {
	var req prRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	item := &models.PRItem{}
	req.apply(item, time.Now())

	if err := h.Items.Create(item); err != nil {
		Fail(c, http.StatusInternalServerError, "บันทึกข่าวไม่สำเร็จ")
		return
	}
	Success(c, http.StatusCreated, item)
}

func (h *PR) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req prRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	item, err := h.Items.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
		return
	}

	req.apply(item, time.Now())
	if err := h.Items.Save(item); err != nil {
		Fail(c, http.StatusInternalServerError, "บันทึกการแก้ไขไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, item)
}

func (h *PR) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	if err := h.Items.Delete(id); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, gin.H{"message": "ลบข่าวแล้ว"})
}

// Toggle สลับระหว่างเผยแพร่กับพักไว้เป็นร่าง ใช้กับปุ่มหยุดเผยแพร่ในหน้าหลังบ้าน
func (h *PR) Toggle(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	item, err := h.Items.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
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

	if err := h.Items.Save(item); err != nil {
		Fail(c, http.StatusInternalServerError, "เปลี่ยนสถานะไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, item)
}

// Copy สร้างข่าวใหม่จากข่าวเดิมเป็นฉบับร่าง ไม่ลอกยอดวิวและเวลาเผยแพร่มาด้วย
func (h *PR) Copy(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	source, err := h.Items.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
		return
	}

	copied := &models.PRItem{
		Title:     source.Title + " (สำเนา)",
		Content:   source.Content,
		Channel:   source.Channel,
		Status:    models.PRDraft,
		Pinned:    false,
		ExpiresAt: source.ExpiresAt,
	}
	if err := h.Items.Create(copied); err != nil {
		Fail(c, http.StatusInternalServerError, "คัดลอกข่าวไม่สำเร็จ")
		return
	}
	Success(c, http.StatusCreated, copied)
}

// View บวกยอดเข้าชม เปิดให้คนทั่วไปเรียกได้เพราะเป็นการอ่านข่าวบนหน้าเว็บสาธารณะ
func (h *PR) View(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	if err := h.Items.IncrementView(id); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, gin.H{"message": "นับยอดเข้าชมแล้ว"})
}

func (h *PR) failFromStore(c *gin.Context, err error) {
	if errors.Is(err, store.ErrPRNotFound) {
		Fail(c, http.StatusNotFound, "ไม่พบข่าวที่ต้องการ")
		return
	}
	Fail(c, http.StatusInternalServerError, "ทำรายการไม่สำเร็จ")
}
