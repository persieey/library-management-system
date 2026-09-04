package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

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

	var employee models.Employee
	if err := ac.db.Where("user_id = ?", user.UserID).First(&employee).Error; err == nil {
		role = "employee"
		position = employee.Position
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


	c.JSON(http.StatusOK, gin.H{
		"message": "เข้าสู่ระบบสำเร็จ",
		"token": token,
		"user":    user,
		"role":     role,
		"position": position,
	})
	
}
