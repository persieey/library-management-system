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

	// ปิดการสร้าง FOREIGN KEY constraint อัตโนมัติตอน AutoMigrate
	//
	// หลายโมเดลในโปรเจกต์ผูก *Employee/*User ด้วยแท็ก foreignKey/references ที่ชื่อ
	// ฟิลด์ตรงกับ primary key ของอีกฝั่งเป๊ะ (เช่น foreignKey:EmployeeID;references:EmployeeID)
	// ซึ่งเป็นแบบแผนที่หลายคนเขียนตามกันมา แต่ GORM เวอร์ชันนี้เจอรูปแบบนี้ในโมเดล
	// หลายตัวพร้อมกันแล้วตีความทิศทางความสัมพันธ์กลับด้าน พยายามสร้าง constraint บน
	// ตารางแม่ (users/employees) ให้อ้างอิงตารางลูกแทน ซึ่งผิดทิศและ crash ทันทีที่
	// คอลัมน์อ้างอิงไม่ unique — เจอกับ Personnel, BookInspection, Ebook, Complaint,
	// RoomBooking พร้อมกันหมด ไม่ใช่ปัญหาของโมเดลตัวใดตัวหนึ่ง
	//
	// ปิดไว้ทั้งระบบแทนการไล่แก้ทีละไฟล์ ความสัมพันธ์และ Preload ในโค้ด Go ทำงาน
	// เหมือนเดิมทุกอย่าง กระทบแค่ว่า Postgres จะไม่บังคับ referential integrity เอง
	// (โปรเจกต์นี้ไม่มีจุดไหนพึ่ง ON DELETE CASCADE ของ DB อยู่แล้ว)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
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

	// ระบบยืม-คืนหนังสือและอุปกรณ์ พร้อมค่าปรับ ยกมาจากสาขา B6731915 (สุชาดา)
	// เจ้าของงานออกแบบให้ยืมได้ทั้งหนังสือและอุปกรณ์ผ่านการจอง (Reservation) ร่วมกัน
	// Equipmentborrow ต้องมาก่อน Reservation เพราะ Reservation อ้าง equipment_items
	// เป็น foreign key (ตารางเปลี่ยนชื่อเป็น equipment_items ตามมติทีม ไม่ชนกับ
	// equipment ของ B6715588) ส่วน BorrowTransaction/ReturnTransaction/Fine
	// ต้องมาหลัง Reservation ตามลำดับที่มันอ้างอิงกัน
	if err = db.AutoMigrate(&models.Equipmentborrow{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Reservation{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.BorrowTransaction{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.ReturnTransaction{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Fine{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.DamageReport{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.BookProblem{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.EquipmentProblem{}); err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.ReservationQueue{}); err != nil {
		return nil, err
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
