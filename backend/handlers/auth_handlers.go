package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"library-management-system/auth"
	"library-management-system/models"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type userResponse struct {
	ID          int                 `json:"id"`
	Username    string              `json:"username"`
	Role        models.Role         `json:"role"`
	Permissions []models.Permission `json:"permissions"`
}

func toUserResponse(user *models.User) userResponse {
	return userResponse{
		ID:          user.ID,
		Username:    user.Username,
		Role:        user.Role,
		Permissions: user.Role.Permissions(),
	}
}

// Login ตรวจรหัสผ่านแล้วออก token ให้หน้าเว็บเก็บไว้ใช้เรียก endpoint อื่น
func (a *Auth) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		Fail(c, http.StatusBadRequest, "กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน")
		return
	}

	// ตอบข้อความเดียวกันทั้งกรณีไม่มีบัญชีและรหัสผ่านผิด เพื่อไม่ให้เดาได้ว่าชื่อผู้ใช้ไหนมีอยู่จริง
	user, err := a.Users.ByUsername(req.Username)
	if err != nil || !auth.CheckPassword(user.PasswordHash, req.Password) {
		Fail(c, http.StatusUnauthorized, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	token, err := a.Sessions.Create(user.ID)
	if err != nil {
		Fail(c, http.StatusInternalServerError, "สร้าง session ไม่สำเร็จ")
		return
	}

	Success(c, http.StatusOK, gin.H{"token": token, "user": toUserResponse(user)})
}

// Profile คืนข้อมูลผู้ใช้ปัจจุบัน หน้าเว็บเรียกตอนโหลดเพื่อกู้สถานะล็อกอินคืนหลังรีเฟรช
func (a *Auth) Profile(c *gin.Context) {
	user, ok := UserFrom(c)
	if !ok {
		Fail(c, http.StatusUnauthorized, "ต้องเข้าสู่ระบบก่อน")
		return
	}
	Success(c, http.StatusOK, toUserResponse(user))
}

// Logout ทิ้ง token ที่ใช้อยู่ เรียกซ้ำได้ไม่พัง
func (a *Auth) Logout(c *gin.Context) {
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		a.Sessions.Destroy(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
	}
	Success(c, http.StatusOK, gin.H{"message": "ออกจากระบบแล้ว"})
}
