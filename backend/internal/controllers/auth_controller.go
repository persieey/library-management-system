package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

// บันทึกลง record_centers ให้หน้ารายงานสถิติ "ผู้เข้าใช้หอสมุด" มีข้อมูลจริงให้อ่าน
// เดิมตารางนี้ไม่มีใครเขียนเลย (ไว้ดูสถิติภาพรวมล้วน ๆ แต่ไม่เคยต่อกับพฤติกรรมจริง)
// login/logout ของทุก role นับหมด ไม่ใช่แค่สมาชิก เพราะพนักงานก็ถือเป็นคนที่ "เข้าใช้งาน" เช่นกัน
func recordVisit(db *gorm.DB, userID uint, logType string) {
	var memberID *uint
	var member models.Member
	if err := db.Where("user_id = ?", userID).First(&member).Error; err == nil {
		memberID = &member.MemberID
	}
	desc := "เข้าสู่ระบบ"
	if logType == "logout" {
		desc = "ออกจากระบบ"
	}
	db.Create(&models.RecordCenter{
		RecordCenterID: uuid.NewString(),
		MemberID:       memberID,
		Description:    desc,
		Date:           time.Now(),
		LogType:        logType,
		Status:         "Normal",
	})
}

type AuthController struct {
	db *gorm.DB
	jwtProvider *utils.JWTProvider
}

func NewAuthController(db *gorm.DB ,jwtProvider *utils.JWTProvider) *AuthController {
	return &AuthController{db: db, jwtProvider: jwtProvider}
}

func (ac *AuthController) Register(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	ac.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "อีเมลนี้ถูกใช้ไปแล้ว"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสผ่านไม่ได้/รหัสผ่านไม่ถูกต้อง"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: hashed,
	}

	if err := ac.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สมัครสมาชมไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สมัครสำเร็จ",
		"user":    user,
	})

}
func (ac *AuthController) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := ac.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
		return
	}

	if err := utils.CheckPassword(user.Password, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"})
		return
	}
	role := "none"
	position := ""

	// employee_id ส่งกลับไปให้หน้าเว็บรู้ว่าตัวเองเป็นพนักงานคนไหน
	// ระบบจัดซื้อใช้เทียบว่าใบขอซื้อใบไหนเป็นของตัวเอง (Request.EmployeeId)
	// เป็น null ถ้าคนนั้นไม่ใช่พนักงาน
	var employeeID *uint

	var employee models.Employee
	if err := ac.db.Where("user_id = ?", user.UserID).First(&employee).Error; err == nil {
		role = "employee"
		position = employee.Position
		employeeID = &employee.EmployeeID
	} else {
		var member models.Member
		if err := ac.db.Where("user_id = ?", user.UserID).First(&member).Error; err == nil {
			role = "member"
		}
	}

	token, err := ac.jwtProvider.GenerateToken(user.UserID, role, position)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง token ไม่สำเร็จ"})
		return
	}

	recordVisit(ac.db, user.UserID, "login")

	c.JSON(http.StatusOK, gin.H{
		"message": "เข้าสู่ระบบสำเร็จ",
		"token": token,
		"user":    user,
		"role":     role,
		"position": position,
		"employee_id": employeeID,
	})

}

// Logout แค่บันทึกว่าออกจากระบบแล้ว — JWT ไม่มี state ฝั่งเซิร์ฟเวอร์ให้เพิกถอน
// ฝั่งหน้าเว็บเป็นคนลบ token ออกจาก localStorage เอง endpoint นี้มีไว้เก็บสถิติอย่างเดียว
func (ac *AuthController) Logout(c *gin.Context) {
	userID := c.GetUint("user_id")
	recordVisit(ac.db, userID, "logout")
	c.JSON(http.StatusOK, gin.H{"message": "ออกจากระบบสำเร็จ"})
}
