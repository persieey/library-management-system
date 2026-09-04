package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/SA-1-69/T09/backend/internal/utils"
)

func JWTAuthMiddleware(jwtProvider *utils.JWTProvider) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาเข้าสู่ระบบก่อน"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "รูปแบบ token ไม่ถูกต้อง"})
			c.Abort()
			return
		}

		token, err := jwtProvider.ValidateToken(parts[1])
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token ไม่ถูกต้องหรือหมดอายุ"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token ไม่ถูกต้อง"})
			c.Abort()
			return
		}

		userID, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token ไม่ถูกต้อง"})
			c.Abort()
			return
		}
		role, _ := claims["role"].(string)
		position, _ := claims["position"].(string)
		c.Set("role", role)
		c.Set("position", position)
		c.Set("user_id", uint(userID))
		c.Next()
	}
}