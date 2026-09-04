package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/SA-1-69/T09/backend/internal/utils"
)

// OptionalAuth ไม่กันใครออก แค่บอกต่อว่าคนเรียกเป็นใครถ้าส่ง token มาด้วย
//
// ใช้กับ endpoint ที่คนทั่วไปก็ดูได้ แต่เจ้าหน้าที่ควรเห็นมากกว่า
// เช่นหน้าข่าว คนทั่วไปเห็นเฉพาะข่าวที่เผยแพร่แล้ว ส่วนบรรณารักษ์เห็นข่าวร่างด้วย
func OptionalAuth(jwtProvider *utils.JWTProvider) gin.HandlerFunc {
	return func(c *gin.Context) {
		parts := strings.Split(c.GetHeader("Authorization"), " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		token, err := jwtProvider.ValidateToken(parts[1])
		if err != nil || !token.Valid {
			c.Next()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.Next()
			return
		}

		if userID, ok := claims["user_id"].(float64); ok {
			c.Set("user_id", uint(userID))
		}
		if role, ok := claims["role"].(string); ok {
			c.Set("role", role)
		}
		if position, ok := claims["position"].(string); ok {
			c.Set("position", position)
		}
		c.Next()
	}
}
