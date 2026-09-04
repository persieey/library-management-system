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

	if strings.Contains(period, "สัปดาห์") || strings.Contains(p, "week") {
		from := time.Date(2026, 8, 24, 0, 0, 0, 0, time.Local)
		to := time.Date(2026, 8, 31, 23, 59, 59, 0, time.Local)
		return from, to, true
	} else if strings.Contains(period, "เดือนนี้") || strings.Contains(period, "ส.ค.") || strings.Contains(p, "aug") || strings.Contains(p, "this month") {
		from := time.Date(2026, 8, 1, 0, 0, 0, 0, time.Local)
		to := time.Date(2026, 8, 31, 23, 59, 59, 0, time.Local)
		return from, to, true
	} else if strings.Contains(period, "เดือนที่แล้ว") || strings.Contains(period, "ก.ค.") || strings.Contains(p, "jul") || strings.Contains(p, "last month") {
		from := time.Date(2026, 7, 1, 0, 0, 0, 0, time.Local)
		to := time.Date(2026, 7, 31, 23, 59, 59, 0, time.Local)
		return from, to, true
	} else if strings.Contains(period, "ภาคการศึกษา") || strings.Contains(period, "เทอม") || strings.Contains(p, "semester") {
		from := time.Date(2026, 6, 1, 0, 0, 0, 0, time.Local)
		to := time.Date(2026, 10, 31, 23, 59, 59, 0, time.Local)
		return from, to, true
	}

	// Default: Full year / no restrictive filter
	from := time.Date(2026, 1, 1, 0, 0, 0, 0, time.Local)
	to := time.Date(2026, 12, 31, 23, 59, 59, 0, time.Local)
	return from, to, false
}
