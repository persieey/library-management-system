package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// ทุก endpoint ตอบด้วยซองเดียวกันเสมอ
// สำเร็จ: {"success": true, "data": ...}
// ล้มเหลว: {"success": false, "error": {"message": "..."}}
func Success(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{"success": true, "data": data})
}

func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "error": gin.H{"message": message}})
}

// AbortFail หยุด chain ของ middleware แล้วตอบ error กลับไปเลย
func AbortFail(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, gin.H{"success": false, "error": gin.H{"message": message}})
}

// idParam อ่าน :id จาก path แล้วแปลงเป็นตัวเลข
// คืน ok=false พร้อมตอบ error ให้แล้ว ผู้เรียกแค่ return ต่อได้เลย
func idParam(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		Fail(c, 400, "รหัสในลิงก์ไม่ถูกต้อง")
		return 0, false
	}
	return id, true
}
