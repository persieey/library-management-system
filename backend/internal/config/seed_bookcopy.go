package config

import (
	"log"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// แผนการกระจายเล่มของแต่ละเรื่อง
//
// ค้นหนังสือจากชื่อเรื่องแทนการระบุ book_id ตรงๆ
// เพราะ id เปลี่ยนได้ทุกครั้งที่ล้างตารางแล้ว seed ใหม่
type copyPlan struct {
	Title  string
	Copies []copySpec
}

type copySpec struct {
	Building  string
	Slot      string
	Condition string
}

var sampleCopies = []copyPlan{
	// เรื่องยอดนิยม — มี 3 เล่ม กระจายสองอาคาร
	{
		Title: "การเขียนโปรแกรมภาษา Go เบื้องต้น",
		Copies: []copySpec{
			{"Building 1", "zone 1", "good"},
			{"Building 1", "zone 1", "good"},
			{"Building 2", "zone 3", "good"},
		},
	},
	{
		Title: "ระบบฐานข้อมูลเชิงสัมพันธ์",
		Copies: []copySpec{
			{"Building 1", "zone 1", "good"},
			{"Building 1", "zone 2", "good"},
			{"Building 2", "zone 1", "repairing"},
		},
	},
	{
		Title: "สถิติสำหรับงานวิจัย",
		Copies: []copySpec{
			{"Building 1", "zone 2", "good"},
			{"Building 2", "zone 2", "good"},
			{"Building 2", "zone 2", "damaged"},
		},
	},

	// เรื่องทั่วไป — 2 เล่ม
	{
		Title: "จิตวิทยาการเรียนรู้ในศตวรรษที่ 21",
		Copies: []copySpec{
			{"Building 1", "zone 3", "good"},
			{"Building 2", "zone 1", "good"},
		},
	},
	{
		Title: "ปัญญาประดิษฐ์กับอนาคตของงาน",
		Copies: []copySpec{
			{"Building 1", "zone 1", "good"},
			{"Building 2", "zone 3", "good"},
		},
	},
	{
		Title: "การจัดการความเครียดในวัยเรียน",
		Copies: []copySpec{
			{"Building 1", "zone 3", "good"},
			{"Building 2", "zone 2", "good"},
		},
	},

	// เรื่องที่มีเล่มเดียว
	{
		Title:  "ฝนตกที่ปลายฤดู",
		Copies: []copySpec{{"Building 2", "zone 3", "good"}},
	},
	{
		Title:  "ประวัติศาสตร์เอเชียตะวันออกเฉียงใต้สมัยใหม่",
		Copies: []copySpec{{"Building 1", "zone 2", "good"}},
	},
	{
		Title:  "นักสืบน้อยกับคดีห้องสมุด",
		Copies: []copySpec{{"Building 2", "zone 3", "good"}},
	},
	{
		Title:  "เมื่อความเงียบพูดได้",
		Copies: []copySpec{{"Building 2", "zone 3", "damaged"}},
	},
	{
		Title:  "โบราณคดีลุ่มน้ำมูล",
		Copies: []copySpec{{"Building 1", "zone 2", "good"}},
	},
	{
		Title:  "คู่มือการสืบค้นฐานข้อมูลอิเล็กทรอนิกส์",
		Copies: []copySpec{{"Building 1", "zone 1", "good"}},
	},
}

// SeedBookCopies ใส่เล่มหนังสือตัวอย่างเมื่อยังไม่มีเล่มใดในระบบ
//
// availability_status ปล่อยเป็นค่าเริ่มต้น (available) ทุกเล่ม
// เพราะเป็นของระบบยืม-คืน ไม่ควรตั้งเองโดยไม่มีรายการยืมจริงรองรับ
func SeedBookCopies(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.BookCopy{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	created := 0

	for _, plan := range sampleCopies {
		var book models.Book
		if err := db.Where("title = ?", plan.Title).First(&book).Error; err != nil {
			// ไม่มีหนังสือเรื่องนี้ในระบบ ข้ามไป ไม่ถือเป็นความผิดพลาด
			log.Printf("ข้ามการใส่เล่ม: ไม่พบหนังสือ %q", plan.Title)
			continue
		}

		items := make([]models.BookCopy, 0, len(plan.Copies))
		for i, spec := range plan.Copies {
			items = append(items, models.BookCopy{
				BookID:          book.BookID,
				CopyNumber:      i + 1,
				Building:        spec.Building,
				Slot:            spec.Slot,
				ConditionStatus: spec.Condition,
			})
		}

		if err := db.Create(&items).Error; err != nil {
			return err
		}
		created += len(items)
	}

	log.Printf("ใส่เล่มหนังสือตัวอย่าง %d เล่มแล้ว", created)
	return nil
}