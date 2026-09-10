package utils

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func ParseDateRange(c *gin.Context) (time.Time, time.Time, bool) {
	period := c.Query("period")
	startStr := c.Query("startDate")
	endStr := c.Query("endDate")

	if startStr != "" && endStr != "" {
		s, err1 := time.Parse("2006-01-02", startStr)
		e, err2 := time.Parse("2006-01-02", endStr)
		if err1 == nil && err2 == nil {
			return s, e.Add(23*time.Hour + 59*time.Minute + 59*time.Second), true
		}
	}

	p := strings.ToLower(period)
	now := time.Now()

	// เดิมทุกช่วงเวลาผูกกับวันที่ตายตัว (ส.ค. 2569) ไว้ตอนสร้างข้อมูลสาธิต พอเวลาผ่านไป
	// (เช่นตอนนี้เป็น ก.ย. 2569 แล้ว) ตัวกรอง "เดือนนี้"/"สัปดาห์นี้" ยังคงไปดึงข้อมูลของเดือนสิงหาคม
	// อยู่ดี ข้อมูลจริงที่เพิ่งเกิดขึ้นเดือนปัจจุบันเลยไม่โผล่ในหน้าเว็บ เปลี่ยนให้คำนวณจาก
	// เวลาปัจจุบันจริง (time.Now()) แทนค่าตายตัว
	if strings.Contains(period, "สัปดาห์") || strings.Contains(p, "week") {
		to := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 0, time.Local)
		from := time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, time.Local).AddDate(0, 0, -6)
		return from, to, true
	} else if strings.Contains(period, "เดือนนี้") || strings.Contains(p, "this month") {
		from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
		to := from.AddDate(0, 1, 0).Add(-time.Second)
		return from, to, true
	} else if strings.Contains(period, "เดือนที่แล้ว") || strings.Contains(p, "last month") {
		firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
		to := firstOfThisMonth.Add(-time.Second)
		from := time.Date(to.Year(), to.Month(), 1, 0, 0, 0, 0, time.Local)
		return from, to, true
	} else if strings.Contains(period, "ภาคการศึกษา") || strings.Contains(period, "เทอม") || strings.Contains(p, "semester") {
		from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local).AddDate(0, -2, 0)
		to := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local).AddDate(0, 3, 0).Add(-time.Second)
		return from, to, true
	}

	// Default: Full ปีปัจจุบัน / ไม่มีตัวกรอง
	from := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.Local)
	to := time.Date(now.Year(), 12, 31, 23, 59, 59, 0, time.Local)
	return from, to, false
}
