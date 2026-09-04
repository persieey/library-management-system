package config

import (
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

// SeedLibrary ใส่ข้อมูลตัวอย่างของงานหอสมุด ทำเฉพาะตอนตารางยังว่าง
// รันซ้ำกี่ครั้งก็ไม่เพิ่มข้อมูลซ้ำ
func SeedLibrary(db *gorm.DB, cfg *Config) error {
	if err := seedStaffAccounts(db, cfg); err != nil {
		return err
	}
	if err := seedPersonnel(db); err != nil {
		return err
	}
	if err := seedPR(db); err != nil {
		return err
	}
	return seedEvents(db)
}

// seedStaffAccounts เพิ่มบัญชีบรรณารักษ์และเจ้าหน้าที่ไว้ทดสอบ
// SeedAdmin ของเดิมสร้างแค่ manager คนเดียว แต่หน้าเว็บต้องใช้หลาย position
// ใช้รหัสผ่านเดียวกับ admin เพื่อไม่ต้องเพิ่มตัวแปรใหม่
func seedStaffAccounts(db *gorm.DB, cfg *Config) error {
	if cfg.SeedAdminPassword == "" {
		return nil
	}

	staff := []struct {
		name     string
		email    string
		position string
	}{
		{"Librarian", "librarian@lib.ac.th", "librarian"},
		{"Staff", "staff@lib.ac.th", "staff"},
	}

	hashed, err := utils.HashPassword(cfg.SeedAdminPassword)
	if err != nil {
		return err
	}

	for _, s := range staff {
		var count int64
		db.Model(&models.User{}).Where("email = ?", s.email).Count(&count)
		if count > 0 {
			continue
		}

		user := models.User{Name: s.name, Email: s.email, Password: hashed}
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
			return tx.Create(&models.Employee{UserID: user.UserID, Position: s.position}).Error
		})
		if err != nil {
			return err
		}
		log.Printf("สร้างบัญชี %s แล้ว: %s", s.position, s.email)
	}
	return nil
}

func seedPersonnel(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Personnel{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	people := []models.Personnel{
		{StaffID: "ST001", FirstName: "สมชาย", LastName: "ใจดี", Department: "งานบริการยืม-คืน", Position: "บรรณารักษ์", Email: "somchai@lib.ac.th", Phone: "081-234-5678", StartDate: "2018-05-01", Status: models.PersonnelActive},
		{StaffID: "ST002", FirstName: "วิภา", LastName: "รักเรียน", Department: "งานประชาสัมพันธ์", Position: "เจ้าหน้าที่", Email: "wipa@lib.ac.th", Phone: "082-345-6789", StartDate: "2020-03-15", Status: models.PersonnelActive},
		{StaffID: "ST003", FirstName: "ประยูร", LastName: "แสงทอง", Department: "งานพัฒนาทรัพยากร", Position: "บรรณารักษ์", Email: "prayoon@lib.ac.th", Phone: "083-456-7890", StartDate: "2015-09-01", Status: models.PersonnelActive},
		{StaffID: "ST004", FirstName: "นภา", LastName: "ดวงดี", Department: "งานบริการสารสนเทศ", Position: "เจ้าหน้าที่", Email: "napa@lib.ac.th", Phone: "084-567-8901", StartDate: "2021-06-01", Status: models.PersonnelActive},
		{StaffID: "ST005", FirstName: "อนุชา", LastName: "ศรีสุข", Department: "งานเทคโนโลยีสารสนเทศ", Position: "นักวิชาการ", Email: "anucha@lib.ac.th", Phone: "085-678-9012", StartDate: "2019-01-07", Status: models.PersonnelActive},
		{StaffID: "ST006", FirstName: "มาลี", LastName: "บุญมาก", Department: "งานบริการยืม-คืน", Position: "เจ้าหน้าที่", Email: "malee@lib.ac.th", Phone: "086-789-0123", StartDate: "2017-11-20", Status: models.PersonnelInactive},
	}
	return db.Create(&people).Error
}

// seedPR ข่าวตัวอย่างครบทุกสถานะ วันที่ผูกกับเวลาที่รันครั้งแรก
// ข่าวตัวอย่างจะได้ไม่หมดอายุไปก่อนที่จะได้ดู
func seedPR(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.PRItem{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := time.Now()
	publishedAt := now.AddDate(0, 0, -7)
	expiresAt := now.AddDate(0, 1, 0)
	// ตั้งเวลาไว้อีกหนึ่งนาที จะได้เห็นระบบเผยแพร่อัตโนมัติทำงานจริงโดยไม่ต้องรอนาน
	scheduledAt := now.Add(time.Minute)

	items := []models.PRItem{
		{
			Title:       "ปิดปรับปรุงระบบยืม-คืนชั่วคราว",
			Content:     "หอสมุดจะปิดปรับปรุงระบบยืม-คืนชั่วคราว ขออภัยในความไม่สะดวก",
			Channel:     "website",
			Status:      models.PRPublished,
			Pinned:      true,
			Views:       1240,
			PublishedAt: &publishedAt,
			ExpiresAt:   &expiresAt,
		},
		{
			Title:   "หอสมุดเปิดให้บริการยืมระหว่างห้องสมุดกับมหาวิทยาลัยเครือข่าย",
			Content: "นักศึกษาและอาจารย์สามารถยืมทรัพยากรจากห้องสมุดเครือข่ายได้โดยไม่มีค่าใช้จ่ายเพิ่มเติม",
			Channel: "website",
			Status:  models.PRDraft,
		},
		{
			Title:       "เปิดตัวฐานข้อมูลวิจัยอิเล็กทรอนิกส์ใหม่ 3 ฐานข้อมูล",
			Content:     "เพิ่มการเข้าถึงงานวิจัยและวารสารวิชาการนานาชาติ พร้อมจัดอบรมการใช้งาน",
			Channel:     "website",
			Status:      models.PRScheduled,
			ScheduledAt: &scheduledAt,
			ExpiresAt:   &expiresAt,
		},
	}
	return db.Create(&items).Error
}

func seedEvents(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Event{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := time.Now()
	events := []models.Event{
		{Title: "Academic Database Searching Training", Description: "Learn to search Scopus and Web of Science effectively for your research.", Location: "Training Room, 2nd Floor, Central Library", Image: "event-1", StartAt: now.AddDate(0, 0, 10)},
		{Title: "Monthly New Books Exhibition", Description: "Browse the newest additions to the library collection this month.", Location: "Exhibition Zone, 1st Floor", Image: "event-2", StartAt: now.AddDate(0, 0, 16), AllDay: true},
		{Title: "Citation and EndNote Workshop", Description: "Hands-on workshop on building a citation library with EndNote.", Location: "Computer Lab, 3rd Floor", Image: "event-3", StartAt: now.AddDate(0, 0, 23)},
	}
	return db.Create(&events).Error
}
