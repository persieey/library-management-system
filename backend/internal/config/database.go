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
	if err = db.AutoMigrate(&models.Personnel{},
		&models.LeaveRequest{},
		&models.ServicePoint{},
		&models.DutyShift{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.PRItem{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Event{}); err != nil {
		return nil, err
	}

	// ระบบจัดการหนังสือและ E-Book ยกมาจากสาขา B6729615 (กร) เจ้าของสองระบบนี้
	// ต้องมาก่อน BorrowTransaction ในลูปข้างล่าง เพราะตารางนั้นอ้าง books.book_id เป็น foreign key
	if err = db.AutoMigrate(&models.Book{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.BookCopy{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.BookInspection{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Ebook{}); err != nil {
		return nil, err
	}

	// ระบบจองห้อง แจ้งซ่อม และอุปกรณ์ ยกมาจากสาขา B6715588 (บรรพต) เจ้าของสามระบบนี้
	// Equipment ต้องมาก่อน RepairRequest เพราะตารางนั้นอ้าง equipment เป็น foreign key
	// และ Room ต้องมาก่อน RoomBooking ด้วยเหตุผลเดียวกัน
	if err = db.AutoMigrate(&models.Equipment{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.RepairRequest{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.RepairLog{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Room{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.RoomBooking{}); err != nil {
		return nil, err
	}

	// ระบบจัดซื้อทรัพย์สินและตรวจนับทรัพย์สิน ยกมาจากสาขา B6710248 (สุรทิน) เจ้าของสองระบบนี้
	// ตารางของสองระบบนี้ตั้งชื่อแบบ PascalCase ผ่าน TableName() เช่น "Asset" "Request"
	// จึงไม่ชนกับตาราง snake_case ของระบบอื่นในโปรเจกต์
	//
	// Vender กับ Request ต้องมาก่อน Asset และ InspectReport ต้องมาก่อน Inspect
	// ตามลำดับที่เจ้าของงานเรียงไว้
	for _, m := range []interface{}{
		&models.Vender{},
		&models.Request{},
		&models.Asset{},
		&models.InspectReport{},
		&models.Inspect{},
		&models.Discrepancy{},
	} {
		if err := db.AutoMigrate(m); err != nil {
			return nil, err
		}
	}

	// ระบบร้องเรียนและสถิติ ยกมาจากสาขา B6707590 (ธนกร) เจ้าของสองระบบนี้
	// ใช้ loop เพราะมีหลายตาราง และให้เตือนแทนการหยุดทำงาน
	// เผื่อตารางไหนชนกับของเดิมจะได้ยังสตาร์ทเซิร์ฟเวอร์ได้
	complaintAndStats := []interface{}{
		&models.ExternalDepartment{},
		&models.Complaint{},
		&models.InspectionRecord{},
		&models.StatRoom{},
		&models.StatRoomBooking{},
		&models.BorrowTransaction{},
		&models.ReturnTransaction{},
		&models.Fine{},
		&models.EbookSearchLog{},
		&models.RecordCenter{},
		&models.StatEquipment{},
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
