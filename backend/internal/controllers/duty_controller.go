package controllers

import (
	"fmt"
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

// ListServicePoints จุดบริการทั้งหมดที่ยังเปิดใช้ พนักงานทุกตำแหน่งดูได้
func (dc *DutyController) ListServicePoints(c *gin.Context) {
	var points []models.ServicePoint
	if err := dc.db.Where("active = ?", true).
		Order("sort_order ASC, service_point_id ASC").Find(&points).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านจุดบริการไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, points)
}

// enrich เติมชื่อคน แผนก ชื่อจุดบริการ และสถานะลา ด้วยคำสั่งชุดเดียวไม่ว่าจะกี่แถว
//
// ทำเองแทน Preload เพราะความสัมพันธ์ของทีมทำให้ AutoMigrate ล้ม ดูหมายเหตุใน models/leave.go
func (dc *DutyController) enrich(shifts []models.DutyShift) []models.DutyShift {
	if len(shifts) == 0 {
		return shifts
	}

	personIDs := map[uint]bool{}
	pointIDs := map[uint]bool{}
	dates := map[string]bool{}
	for _, s := range shifts {
		personIDs[s.PersonnelID] = true
		pointIDs[s.ServicePointID] = true
		dates[s.Date] = true
	}

	keys := func(m map[uint]bool) []uint {
		out := make([]uint, 0, len(m))
		for k := range m {
			out = append(out, k)
		}
		return out
	}

	var people []models.Personnel
	dc.db.Select("personnel_id", "first_name", "last_name", "department", "employee_id").
		Where("personnel_id IN ?", keys(personIDs)).Find(&people)
	name := map[uint]string{}
	dept := map[uint]string{}
	// map จาก personnel ไปหา user เพื่อเช็คว่าลาอยู่ไหม คนที่ไม่มีบัญชีก็เช็คไม่ได้ ถือว่าไม่ลา
	empOf := map[uint]uint{}
	for _, p := range people {
		name[p.PersonnelID] = p.FirstName + " " + p.LastName
		dept[p.PersonnelID] = p.Department
		if p.EmployeeID != nil {
			empOf[p.PersonnelID] = *p.EmployeeID
		}
	}

	var points []models.ServicePoint
	dc.db.Select("service_point_id", "name").Where("service_point_id IN ?", keys(pointIDs)).Find(&points)
	pointName := map[uint]string{}
	for _, p := range points {
		pointName[p.ServicePointID] = p.Name
	}

	// หาว่าใครลาอนุมัติแล้วคร่อมวันไหนบ้าง แปลง employee_id กลับเป็น user_id ก่อน
	onLeave := map[string]bool{} // คีย์คือ "userID|date"
	if len(empOf) > 0 {
		empIDs := make([]uint, 0, len(empOf))
		for _, e := range empOf {
			empIDs = append(empIDs, e)
		}
		var emps []models.Employee
		dc.db.Select("employee_id", "user_id").Where("employee_id IN ?", empIDs).Find(&emps)
		userOfEmp := map[uint]uint{}
		userIDs := make([]uint, 0, len(emps))
		for _, e := range emps {
			userOfEmp[e.EmployeeID] = e.UserID
			userIDs = append(userIDs, e.UserID)
		}

		dateList := make([]string, 0, len(dates))
		for d := range dates {
			dateList = append(dateList, d)
		}
		var leaves []models.LeaveRequest
		dc.db.Where("status = ? AND user_id IN ?", models.LeaveApproved, userIDs).Find(&leaves)
		for _, l := range leaves {
			for _, d := range dateList {
				if d >= l.StartDate && d <= l.EndDate {
					onLeave[keyOf(l.UserID, d)] = true
				}
			}
		}

		for i := range shifts {
			if emp, ok := empOf[shifts[i].PersonnelID]; ok {
				if uid, ok2 := userOfEmp[emp]; ok2 {
					shifts[i].OnLeave = onLeave[keyOf(uid, shifts[i].Date)]
				}
			}
		}
	}

	for i := range shifts {
		shifts[i].PersonnelName = name[shifts[i].PersonnelID]
		shifts[i].Department = dept[shifts[i].PersonnelID]
		shifts[i].ServicePointName = pointName[shifts[i].ServicePointID]
	}
	return shifts
}

func keyOf(userID uint, date string) string {
	return fmt.Sprintf("%d|%s", userID, date)
}

// List ตารางเวรในช่วงวันที่ที่ขอมา พนักงานทุกตำแหน่งดูได้ เพราะต้องรู้ว่าตัวเองเข้าเวรจุดไหน
func (dc *DutyController) List(c *gin.Context) {
	var shifts []models.DutyShift
	q := dc.db.Model(&models.DutyShift{})

	if from := c.Query("from"); from != "" {
		q = q.Where("date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("date <= ?", to)
	}
	if sp := c.Query("service_point_id"); sp != "" {
		q = q.Where("service_point_id = ?", sp)
	}

	// เรียงตามวัน ช่วงเวร จุดบริการ แล้วให้ผู้รับผิดชอบหลักขึ้นก่อนในแต่ละกลุ่ม
	order := "date ASC, CASE period WHEN 'morning' THEN 0 WHEN 'afternoon' THEN 1 ELSE 2 END, service_point_id ASC, lead DESC"
	if err := q.Order(order).Find(&shifts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านตารางเวรไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, dc.enrich(shifts))
}

// Create มอบหมายคนหนึ่งคนเข้าจุดบริการหนึ่งจุดในช่วงเวรหนึ่งช่วง เฉพาะหัวหน้าหอสมุด
func (dc *DutyController) Create(c *gin.Context) {
	var req dto.DutyShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรอกข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง"})
		return
	}

	var n int64
	dc.db.Model(&models.Personnel{}).Where("personnel_id = ?", req.PersonnelID).Count(&n)
	if n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบเจ้าหน้าที่คนนี้ในทะเบียนบุคลากร"})
		return
	}
	dc.db.Model(&models.ServicePoint{}).Where("service_point_id = ? AND active = ?", req.ServicePointID, true).Count(&n)
	if n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบจุดบริการนี้"})
		return
	}

	// คนเดียวกันอยู่สองจุดพร้อมกันไม่ได้ ตัวคนไม่ได้แยกร่าง
	dc.db.Model(&models.DutyShift{}).
		Where("date = ? AND period = ? AND personnel_id = ?", req.Date, req.Period, req.PersonnelID).Count(&n)
	if n > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "คนนี้มีเวรในช่วงเวลานี้อยู่แล้ว"})
		return
	}

	shift := models.DutyShift{
		Date:           req.Date,
		Period:         models.DutyPeriod(req.Period),
		ServicePointID: req.ServicePointID,
		PersonnelID:    req.PersonnelID,
		Lead:           req.Lead,
		Note:           req.Note,
	}
	if err := dc.db.Create(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, dc.enrich([]models.DutyShift{shift})[0])
}

// Delete ถอนคนออกจากเวร เฉพาะหัวหน้าหอสมุด
func (dc *DutyController) Delete(c *gin.Context) {
	if err := dc.db.Delete(&models.DutyShift{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ถอนออกจากเวรเรียบร้อย"})
}
