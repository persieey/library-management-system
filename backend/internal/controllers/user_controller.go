package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

type UserController struct {
	db *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{db: db}
}

func (uc *UserController) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var user models.User
	if err := uc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบผู้ใช้"})
		return
	}

	// ส่ง role กับ position กลับไปด้วย หน้าเว็บจะได้รู้สิทธิ์ตอนกู้สถานะล็อกอินหลังรีเฟรช
	// สองค่านี้ middleware อ่านจาก token มาใส่ context ไว้แล้ว
	role, _ := c.Get("role")
	position, _ := c.Get("position")
	c.JSON(http.StatusOK, gin.H{"user": user, "role": role, "position": position})
}

func (uc *UserController) CreateMember(c *gin.Context) {
	var req dto.CreateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	uc.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "อีเมลนี้ถูกใช้ไปแล้ว"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสผ่านไม่สำเร็จ"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: hashed,
	}
	member := models.Member{
		UniversityID: req.UniversityID,
		MemberType:   "student",
		Borrowlimit:  req.BorrowLimit,
	}

	err = uc.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		member.UserID = user.UserID
		return tx.Create(&member).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสมาชิกไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างสมาชิกสำเร็จ",
		"user":    user,
		"member":  member,
	})
}

func (uc *UserController) CreateEmployee(c *gin.Context) {
	var req dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	uc.db.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "อีเมลนี้ถูกใช้ไปแล้ว"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เข้ารหัสผ่านไม่สำเร็จ"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: hashed,
	}
	employee := models.Employee{
		Position: req.Position,
	}

	err = uc.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		employee.UserID = user.UserID
		return tx.Create(&employee).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างพนักงานไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "สร้างพนักงานสำเร็จ",
		"user":     user,
		"employee": employee,
	})
}
