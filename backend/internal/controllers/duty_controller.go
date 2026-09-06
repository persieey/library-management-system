package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type DutyController struct {
	db *gorm.DB
}

func NewDutyController(db *gorm.DB) *DutyController {
	return &DutyController{db: db}
}

// fillNames เติมชื่อหัวหน้าเวรและผู้ช่วยด้วยคำสั่งเดียวไม่ว่าจะกี่แถว
// ทำเองแทน Preload เพราะความสัมพันธ์ของทีมทำให้ AutoMigrate ล้ม ดูหมายเหตุใน models/leave.go
func (dc *DutyController) fillNames(shifts []models.DutyShift) []models.DutyShift {
	ids := map[uint]bool{}
	for _, s := range shifts {
		ids[s.LeadID] = true
		if s.AssistantID != nil {
			ids[*s.AssistantID] = true
		}
	}
	if len(ids) == 0 {
		return shifts
	}

	list := make([]uint, 0, len(ids))
	for id := range ids {
		list = append(list, id)
	}

	var people []models.Personnel
	dc.db.Select("personnel_id", "first_name", "last_name").Where("personnel_id IN ?", list).Find(&people)
	name := map[uint]string{}
	for _, p := range people {
		name[p.PersonnelID] = p.FirstName + " " + p.LastName
	}

	for i := range shifts {
		shifts[i].LeadName = name[shifts[i].LeadID]
		if shifts[i].AssistantID != nil {
			shifts[i].AssistantName = name[*shifts[i].AssistantID]
		}
	}
	return shifts
}

// List ตารางเวรในช่วงวันที่ที่ขอมา พนักงานทุกตำแหน่งดูได้ เพราะต้องรู้ว่าตัวเองเข้าเวรวันไหน
func (dc *DutyController) List(c *gin.Context) {
	var shifts []models.DutyShift
	q := dc.db.Model(&models.DutyShift{})

	// ไม่ส่งช่วงวันมาก็คืนทั้งหมด หน้าเว็บส่งมาเป็นสัปดาห์
	if from := c.Query("from"); from != "" {
		q = q.Where("date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("date <= ?", to)
	}

	// เรียงตามวันแล้วตามช่วงเวร เช้าก่อนบ่ายก่อนเย็น
	order := "date ASC, CASE period WHEN 'morning' THEN 0 WHEN 'afternoon' THEN 1 ELSE 2 END"
	if err := q.Order(order).Find(&shifts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านตารางเวรไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, dc.fillNames(shifts))
}

// ensurePeople ตรวจว่าคนที่จะจัดเวรให้มีอยู่จริงในทะเบียนบุคลากร
func (dc *DutyController) ensurePeople(leadID uint, assistantID *uint) (string, bool) {
	var n int64
	dc.db.Model(&models.Personnel{}).Where("personnel_id = ?", leadID).Count(&n)
	if n == 0 {
		return "ไม่พบหัวหน้าเวรคนนี้ในทะเบียนบุคลากร", false
	}
	if assistantID != nil {
		if *assistantID == leadID {
			return "หัวหน้าเวรกับผู้ช่วยต้องเป็นคนละคน", false
		}
		dc.db.Model(&models.Personnel{}).Where("personnel_id = ?", *assistantID).Count(&n)
		if n == 0 {
			return "ไม่พบผู้ช่วยเวรคนนี้ในทะเบียนบุคลากร", false
		}
	}
	return "", true
}

// Create เพิ่มเวรหนึ่งช่วง เฉพาะหัวหน้าหอสมุด
func (dc *DutyController) Create(c *gin.Context) {
	var req dto.DutyShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรอกข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง"})
		return
	}
	if msg, ok := dc.ensurePeople(req.LeadID, req.AssistantID); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// วันเดียวช่วงเดียวมีได้เวรเดียว กันจัดซ้อนกันเอง
	var dup int64
	dc.db.Model(&models.DutyShift{}).Where("date = ? AND period = ?", req.Date, req.Period).Count(&dup)
	if dup > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "วันนี้ช่วงนี้มีเวรอยู่แล้ว แก้ของเดิมแทนการเพิ่มใหม่"})
		return
	}

	shift := models.DutyShift{
		Date:        req.Date,
		Period:      models.DutyPeriod(req.Period),
		LeadID:      req.LeadID,
		AssistantID: req.AssistantID,
		Note:        req.Note,
	}
	if err := dc.db.Create(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, dc.fillNames([]models.DutyShift{shift})[0])
}

// Update แก้เวรที่มีอยู่ เฉพาะหัวหน้าหอสมุด
func (dc *DutyController) Update(c *gin.Context) {
	var shift models.DutyShift
	if err := dc.db.First(&shift, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบเวรนี้"})
		return
	}

	var req dto.DutyShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรอกข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง"})
		return
	}
	if msg, ok := dc.ensurePeople(req.LeadID, req.AssistantID); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	var dup int64
	dc.db.Model(&models.DutyShift{}).
		Where("date = ? AND period = ? AND shift_id <> ?", req.Date, req.Period, shift.ShiftID).Count(&dup)
	if dup > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "วันนี้ช่วงนี้มีเวรอยู่แล้ว"})
		return
	}

	shift.Date = req.Date
	shift.Period = models.DutyPeriod(req.Period)
	shift.LeadID = req.LeadID
	shift.AssistantID = req.AssistantID
	shift.Note = req.Note
	if err := dc.db.Save(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, dc.fillNames([]models.DutyShift{shift})[0])
}

// Delete ลบเวร เฉพาะหัวหน้าหอสมุด
func (dc *DutyController) Delete(c *gin.Context) {
	if err := dc.db.Delete(&models.DutyShift{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบเวรเรียบร้อย"})
}
