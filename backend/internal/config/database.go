package config

import (
	"fmt"
	"log"

	"github.com/SA-1-69/T09/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase(cfg *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Bangkok",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.User{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Member{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Employee{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Personnel{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.PRItem{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Event{}); err != nil {
		return nil, err
	}

	// ระบบร้องเรียนและสถิติ ยกมาจากสาขา B6707590 (ธนกร) เจ้าของสองระบบนี้
	// ใช้ loop เพราะมีหลายตาราง และให้เตือนแทนการหยุดทำงาน
	// เผื่อตารางไหนชนกับของเดิมจะได้ยังสตาร์ทเซิร์ฟเวอร์ได้
	complaintAndStats := []interface{}{
		&models.ExternalDepartment{},
		&models.Complaint{},
		&models.InspectionRecord{},
		&models.Room{},
		&models.RoomBooking{},
		&models.Book{},
		&models.BorrowTransaction{},
		&models.ReturnTransaction{},
		&models.Fine{},
		&models.EbookSearchLog{},
		&models.RecordCenter{},
		&models.Equipment{},
		&models.EquipmentRental{},
	}
	for _, m := range complaintAndStats {
		if err := db.AutoMigrate(m); err != nil {
			log.Printf("AutoMigrate %T ไม่สำเร็จ: %v", m, err)
		}
	}

	log.Println("AutoMigrate สำเร็จ")
	log.Println("เชื่อมต่อ Postgres ได้แล้ววว")
	return db, nil
}
