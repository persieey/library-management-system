package config

import (
	"fmt"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

// SeedMembers ใส่บัญชีสมาชิก (นักศึกษา) ตัวอย่างไว้ทดสอบ/ทำ mockup
// รหัสนักศึกษาเรียง U00001-U00010 ตามที่ทีมต้องการ แยกจากรหัส B67xxxxx ของจริง
// จะได้แยกออกชัดเจนว่าเป็นข้อมูลจำลอง ไม่ปนกับ B6700000 ที่มีอยู่แล้ว
// รันซ้ำกี่ครั้งก็ไม่เพิ่มข้อมูลซ้ำ (เช็คจากอีเมล เหมือน seedStaffAccounts)
func SeedMembers(db *gorm.DB, cfg *Config) error {
	if cfg.SeedAdminPassword == "" {
		return nil
	}

	hashed, err := utils.HashPassword(cfg.SeedAdminPassword)
	if err != nil {
		return err
	}

	for i := 1; i <= 10; i++ {
		universityID := fmt.Sprintf("U%05d", i)
		email := fmt.Sprintf("student%02d@lib.ac.th", i)
		name := fmt.Sprintf("นักศึกษาทดสอบ %02d", i)

		var count int64
		db.Model(&models.User{}).Where("email = ?", email).Count(&count)
		if count > 0 {
			continue
		}

		user := models.User{Name: name, Email: email, Password: hashed}
		member := models.Member{UniversityID: universityID, MemberType: "student", Borrowlimit: 5}

		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
			member.UserID = user.UserID
			return tx.Create(&member).Error
		})
		if err != nil {
			return err
		}
	}
	return nil
}
