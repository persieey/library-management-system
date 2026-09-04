package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"library-management-system/auth"
	"library-management-system/models"
	"library-management-system/store"
)

const userContextKey = "currentUser"

// UserFrom ดึงผู้ใช้ที่ผ่านการยืนยันตัวตนแล้วออกจาก request
func UserFrom(c *gin.Context) (*models.User, bool) {
	value, exists := c.Get(userContextKey)
	if !exists {
		return nil, false
	}
	user, ok := value.(*models.User)
	return user, ok
}

// Auth รวมของที่ middleware และ handler ฝั่งบัญชีผู้ใช้ต้องใช้ร่วมกัน
type Auth struct {
	Users    store.UserStore
	Sessions *auth.SessionStore
}

// current อ่าน Bearer token จาก header แล้วหาเจ้าของ
func (a *Auth) current(c *gin.Context) (*models.User, bool) {
	header := c.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return nil, false
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if token == "" {
		return nil, false
	}

	userID, ok := a.Sessions.UserID(token)
	if !ok {
		return nil, false
	}
	user, err := a.Users.ByID(userID)
	if err != nil {
		return nil, false
	}
	return user, true
}

// RequireAuth ปล่อยผ่านเฉพาะคำขอที่ล็อกอินแล้ว
func (a *Auth) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := a.current(c)
		if !ok {
			AbortFail(c, http.StatusUnauthorized, "ต้องเข้าสู่ระบบก่อน")
			return
		}
		c.Set(userContextKey, user)
		c.Next()
	}
}

// RequirePermission ปล่อยผ่านเฉพาะคนที่มีสิทธิ์นั้นจริง
// นี่คือจุดบังคับสิทธิ์จริง ฝั่งหน้าเว็บแค่ซ่อนปุ่มเท่านั้น เชื่อไม่ได้
func (a *Auth) RequirePermission(perm models.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := a.current(c)
		if !ok {
			AbortFail(c, http.StatusUnauthorized, "ต้องเข้าสู่ระบบก่อน")
			return
		}
		if !user.Can(perm) {
			AbortFail(c, http.StatusForbidden, "ไม่มีสิทธิ์เข้าถึงส่วนนี้")
			return
		}
		c.Set(userContextKey, user)
		c.Next()
	}
}

// OptionalAuth ไม่กันใครออก แค่บอกต่อว่าคนเรียกเป็นใครถ้าล็อกอินมา
// ใช้กับ endpoint ที่คนทั่วไปก็ดูได้ แต่เจ้าหน้าที่ควรเห็นมากกว่า
func (a *Auth) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if user, ok := a.current(c); ok {
			c.Set(userContextKey, user)
		}
		c.Next()
	}
}

// CORS อนุญาต localhost ทุก port เพื่อรองรับ dev server ที่ใช้ port ต่างกัน
// ใน production ควรเปลี่ยนเป็น origin จริงแทน
func CORS(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		allowed := origin != "" && (origin == allowedOrigin ||
			strings.HasPrefix(origin, "http://localhost:") ||
			strings.HasPrefix(origin, "http://127.0.0.1:"))

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Vary", "Origin")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
