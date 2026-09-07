package utils

import "github.com/gin-gonic/gin"

func JSONSuccess(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{"success": true, "data": data})
}

func JSONError(c *gin.Context, status int, message string, detail any) {
	c.JSON(status, gin.H{"success": false, "message": message, "detail": detail})
}