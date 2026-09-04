package main

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"os"
	"time"

	"library-management-system/auth"
	"library-management-system/models"
	"library-management-system/store"
)

// seedAccounts สร้างบัญชีตัวอย่างครบทุก role ไว้ทดสอบ ทำเฉพาะตอนตารางยังว่าง
// รหัสผ่านมาจาก LMS_SEED_PASSWORD ถ้าไม่ตั้งไว้จะสุ่มให้แล้วพิมพ์ออก log
// ตั้งใจไม่ฝังรหัสผ่านไว้ในซอร์ส เพื่อไม่ให้เผลอหลุดขึ้น production
func seedAccounts(users store.UserStore) error {
	count, err := users.Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	password := os.Getenv("LMS_SEED_PASSWORD")
	generated := false
	if password == "" {
		raw := make([]byte, 12)
		if _, err := rand.Read(raw); err != nil {
			return err
		}
		password = base64.RawURLEncoding.EncodeToString(raw)
		generated = true
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}

	seeds := []struct {
		username string
		role     models.Role
	}{
		{"student", models.RoleUser},
		{"librarian", models.RoleLibrarian},
		{"staff", models.RoleStaff},
		{"manager", models.RoleManager},
		{"admin", models.RoleAdmin},
	}

	for _, seed := range seeds {
		if _, err := users.Create(&models.User{
			Username:     seed.username,
			PasswordHash: hash,
			Role:         seed.role,
		}); err != nil {
			return err
		}
	}

	log.Printf("บัญชีทดสอบ: student / librarian / staff / manager / admin")
	if generated {
		log.Printf("รหัสผ่านที่สุ่มให้รอบนี้: %s", password)
		log.Printf("อยากกำหนดเอง ตั้ง LMS_SEED_PASSWORD ก่อนรัน")
	} else {
		log.Printf("รหัสผ่าน: ใช้ค่าจาก LMS_SEED_PASSWORD")
	}
	return nil
}

// seedPersonnel ใส่รายชื่อเจ้าหน้าที่ตัวอย่าง ทำเฉพาะตอนตารางยังว่าง
func seedPersonnel(people *store.PersonnelStore) error {
	count, err := people.Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	seeds := []models.Personnel{
		{StaffID: "ST001", FirstName: "สมชาย", LastName: "ใจดี", Department: "งานบริการยืม-คืน", Position: "บรรณารักษ์", Email: "somchai@lib.ac.th", Phone: "081-234-5678", StartDate: "2018-05-01", Status: models.PersonnelActive},
		{StaffID: "ST002", FirstName: "วิภา", LastName: "รักเรียน", Department: "งานประชาสัมพันธ์", Position: "เจ้าหน้าที่", Email: "wipa@lib.ac.th", Phone: "082-345-6789", StartDate: "2020-03-15", Status: models.PersonnelActive},
		{StaffID: "ST003", FirstName: "ประยูร", LastName: "แสงทอง", Department: "งานพัฒนาทรัพยากร", Position: "บรรณารักษ์", Email: "prayoon@lib.ac.th", Phone: "083-456-7890", StartDate: "2015-09-01", Status: models.PersonnelActive},
		{StaffID: "ST004", FirstName: "นภา", LastName: "ดวงดี", Department: "งานบริการสารสนเทศ", Position: "เจ้าหน้าที่", Email: "napa@lib.ac.th", Phone: "084-567-8901", StartDate: "2021-06-01", Status: models.PersonnelActive},
		{StaffID: "ST005", FirstName: "อนุชา", LastName: "ศรีสุข", Department: "งานเทคโนโลยีสารสนเทศ", Position: "นักวิชาการ", Email: "anucha@lib.ac.th", Phone: "085-678-9012", StartDate: "2019-01-07", Status: models.PersonnelActive},
		{StaffID: "ST006", FirstName: "มาลี", LastName: "บุญมาก", Department: "งานบริการยืม-คืน", Position: "เจ้าหน้าที่", Email: "malee@lib.ac.th", Phone: "086-789-0123", StartDate: "2017-11-20", Status: models.PersonnelInactive},
	}

	for i := range seeds {
		if err := people.Create(&seeds[i]); err != nil {
			return err
		}
	}
	return nil
}

// seedPR ใส่ข่าวตัวอย่างครบทุกสถานะ เพื่อให้เห็นการทำงานของหน้าหลังบ้านได้ทันที
// วันที่ผูกกับเวลาที่รันครั้งแรก ข่าวตัวอย่างจะได้ไม่หมดอายุไปก่อนที่จะได้ดู
func seedPR(items *store.PRStore) error {
	count, err := items.Count()
	if err != nil {
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

	seeds := []models.PRItem{
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

	for i := range seeds {
		if err := items.Create(&seeds[i]); err != nil {
			return err
		}
	}
	return nil
}

// seedEvents ใส่กิจกรรมตัวอย่าง ชื่อรูปอ้างถึงไฟล์ที่มากับหน้าเว็บ
func seedEvents(events *store.EventStore) error {
	count, err := events.Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := time.Now()
	seeds := []models.Event{
		{
			Title:       "Academic Database Searching Training",
			Description: "Learn to search Scopus and Web of Science effectively for your research.",
			Location:    "Training Room, 2nd Floor, Central Library",
			Image:       "event-1",
			StartAt:     now.AddDate(0, 0, 10),
			AllDay:      false,
		},
		{
			Title:       "Monthly New Books Exhibition",
			Description: "Browse the newest additions to the library collection this month.",
			Location:    "Exhibition Zone, 1st Floor",
			Image:       "event-2",
			StartAt:     now.AddDate(0, 0, 16),
			AllDay:      true,
		},
		{
			Title:       "Citation and EndNote Workshop",
			Description: "Hands-on workshop on building a citation library with EndNote.",
			Location:    "Computer Lab, 3rd Floor",
			Image:       "event-3",
			StartAt:     now.AddDate(0, 0, 23),
			AllDay:      false,
		},
	}

	for i := range seeds {
		if err := events.Create(&seeds[i]); err != nil {
			return err
		}
	}
	return nil
}
