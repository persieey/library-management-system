package config

import (
	"log"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

func SeedAdmin(db *gorm.DB, cfg *Config) error {
	if cfg.SeedAdminEmail == "" || cfg.SeedAdminPassword == "" {
		log.Println("ไม่ได้ตั้งค่า seed admin ข้ามขั้นตอนนี้")
		return nil
	}

	var count int64
	db.Model(&models.Employee{}).Where("position = ?", "manager").Count(&count)
	if count > 0 {
		return nil
	}

	hashed, err := utils.HashPassword(cfg.SeedAdminPassword)
	if err != nil {
		return err
	}

	user := models.User{
		Name:     cfg.SeedAdminName,
		Email:    cfg.SeedAdminEmail,
		Password: hashed,
	}
	employee := models.Employee{Position: "manager"}

	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		employee.UserID = user.UserID
		return tx.Create(&employee).Error
	})
	if err != nil {
		return err
	}

	log.Printf("สร้าง manager คนแรกแล้ว: %s", cfg.SeedAdminEmail)
	return nil
}