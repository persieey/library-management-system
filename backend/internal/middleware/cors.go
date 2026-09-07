package middleware

import "github.com/gin-gonic/gin"

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		// ต้องมี PATCH ด้วย — หน้าเว็บใช้ PATCH ตอนแก้ข่าว แก้บุคลากร รับห้อง/คืนห้อง
		// และเปลี่ยนสถานะแจ้งซ่อม ถ้าไม่ใส่ เบราว์เซอร์จะบล็อกหลัง preflight
		// แล้วปุ่มพวกนั้นจะกดไม่ติดโดยไม่มี error ให้เห็นฝั่ง server
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}