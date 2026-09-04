package store

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"library-management-system/models"
)

// รองรับสองฐานข้อมูล เลือกด้วย LMS_DB_DRIVER
//
//	sqlite   — ค่าเริ่มต้น ไฟล์เดียว ไม่ต้องติดตั้งอะไรเพิ่ม เหมาะกับตอนพัฒนาและตอนส่งให้อาจารย์ตรวจ
//	postgres — ใช้เซิร์ฟเวอร์จริงที่รันด้วย docker compose ดูข้อมูลผ่าน pgAdmin ได้
const (
	DriverSQLite   = "sqlite"
	DriverPostgres = "postgres"
)

// Postgres ใน container ใช้เวลาสตาร์ทสักพัก ถ้าแอปขึ้นก่อนจะต่อไม่ติด
// จึงลองใหม่สักระยะแทนที่จะล้มทันที
const (
	connectAttempts = 10
	connectBackoff  = 2 * time.Second
)

// Config บอกว่าจะต่อฐานข้อมูลตัวไหนและที่ไหน
type Config struct {
	Driver string
	// DSN ใช้เฉพาะ postgres เช่น
	// postgres://lms:lmsdev@localhost:5432/library?sslmode=disable
	DSN string
	// Path ใช้เฉพาะ sqlite เช่น library.db
	Path string
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// ConfigFromEnv อ่านค่าตั้งต้นจาก environment
// ไม่ตั้งอะไรเลยก็ใช้ SQLite ไฟล์เดียวได้ทันที
func ConfigFromEnv() Config {
	return Config{
		Driver: env("LMS_DB_DRIVER", DriverSQLite),
		DSN:    env("LMS_DB_DSN", "postgres://lms:lmsdev@localhost:5432/library?sslmode=disable"),
		Path:   env("LMS_DB_PATH", "library.db"),
	}
}

// dialector เลือกไดรเวอร์ตามค่าที่ตั้งไว้
// ทั้งสองตัวเป็น Go ล้วน ไม่ต้องมี gcc บนเครื่องที่รัน
func (c Config) dialector() (gorm.Dialector, error) {
	switch c.Driver {
	case DriverPostgres:
		return postgres.Open(c.DSN), nil
	case DriverSQLite:
		return sqlite.Open(fmt.Sprintf("file:%s?_pragma=foreign_keys(1)", c.Path)), nil
	default:
		return nil, fmt.Errorf("ไม่รู้จักฐานข้อมูล %q (รองรับ %s กับ %s)", c.Driver, DriverSQLite, DriverPostgres)
	}
}

// Describe บอกว่ากำลังต่อกับอะไรอยู่ ใช้พิมพ์ลง log ตอนสตาร์ท
// ไม่พิมพ์ DSN ตรงๆ เพราะมีรหัสผ่านอยู่ข้างใน
func (c Config) Describe() string {
	if c.Driver == DriverPostgres {
		return "postgres (ตาม LMS_DB_DSN)"
	}
	return "sqlite ไฟล์ " + c.Path
}

// Open เปิดฐานข้อมูลแล้วสร้างตารางให้ครบ
func Open(cfg Config) (*gorm.DB, error) {
	dialector, err := cfg.dialector()
	if err != nil {
		return nil, err
	}

	db, err := connectWithRetry(dialector, cfg.Driver)
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Personnel{},
		&models.PRItem{},
		&models.Event{},
	); err != nil {
		return nil, fmt.Errorf("สร้างตารางไม่สำเร็จ: %w", err)
	}

	return db, nil
}

// connectWithRetry ลองต่อซ้ำจนกว่าฐานข้อมูลจะพร้อม
// SQLite เป็นไฟล์จึงต่อติดตั้งแต่ครั้งแรก ส่วน Postgres อาจต้องรอ container
func connectWithRetry(dialector gorm.Dialector, driver string) (*gorm.DB, error) {
	attempts := 1
	if driver == DriverPostgres {
		attempts = connectAttempts
	}

	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		db, err := gorm.Open(dialector, &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		if err == nil {
			if sqlDB, pingErr := db.DB(); pingErr == nil {
				if pingErr = sqlDB.Ping(); pingErr == nil {
					return db, nil
				} else {
					err = pingErr
				}
			} else {
				err = pingErr
			}
		}

		lastErr = err
		if attempt < attempts {
			log.Printf("ต่อฐานข้อมูลยังไม่ได้ (ครั้งที่ %d/%d) รออีก %s: %v",
				attempt, attempts, connectBackoff, err)
			time.Sleep(connectBackoff)
		}
	}

	return nil, fmt.Errorf("เปิดฐานข้อมูลไม่สำเร็จ: %w", lastErr)
}
