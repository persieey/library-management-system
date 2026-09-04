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
	log.Println("AutoMigrate สำเร็จ")
	log.Println("เชื่อมต่อ Postgres ได้แล้ววว")
	return db, nil
}
