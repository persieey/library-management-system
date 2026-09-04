package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireEmployee() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "employee" {
			c.JSON(http.StatusForbidden, gin.H{"error": "เฉพาะพนักงานเท่านั้น"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequirePosition(positions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "employee" {
			c.JSON(http.StatusForbidden, gin.H{"error": "เฉพาะพนักงานเท่านั้น"})
			c.Abort()
			return
		}

		userPosition, _ := c.Get("position")
		for _, p := range positions {
			if userPosition == p {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่มีสิทธิ์ใช้งานส่วนนี้"})
		c.Abort()
	}
}