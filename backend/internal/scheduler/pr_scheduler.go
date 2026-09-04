package scheduler

import (
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// รอบตรวจข่าวที่ตั้งเวลาไว้ ถี่พอให้เห็นผลทันทีตอนสาธิต แต่ไม่ถี่จนกวนฐานข้อมูล
const interval = 30 * time.Second

// StartPRScheduler คอยเลื่อนสถานะข่าวที่ถึงกำหนดเผยแพร่และข่าวที่หมดอายุ
//
// อยู่ฝั่งเซิร์ฟเวอร์เพื่อให้ทำงานต่อแม้ไม่มีใครเปิดหน้าเว็บค้างไว้
// เรียกแบบ go StartPRScheduler(db) ตอนสตาร์ทเซิร์ฟเวอร์
func StartPRScheduler(db *gorm.DB) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		published, err := runDueTransitions(db, time.Now())
		if err != nil {
			log.Printf("ตรวจข่าวตามกำหนดเวลาไม่สำเร็จ: %v", err)
			continue
		}
		for _, title := range published {
			log.Printf("เผยแพร่ข่าวอัตโนมัติแล้ว: %s", title)
		}
	}
}

// runDueTransitions เลื่อนสถานะข่าวที่ถึงกำหนดแล้ว คืนชื่อข่าวที่เพิ่งถูกเผยแพร่อัตโนมัติ
func runDueTransitions(db *gorm.DB, now time.Time) ([]string, error) {
	published := []string{}

	err := db.Transaction(func(tx *gorm.DB) error {
		// ข่าวที่ตั้งเวลาไว้และถึงกำหนดแล้ว -> เผยแพร่
		var due []models.PRItem
		if err := tx.Where("status = ? AND scheduled_at IS NOT NULL AND scheduled_at <= ?",
			models.PRScheduled, now).Find(&due).Error; err != nil {
			return err
		}
		for i := range due {
			due[i].Status = models.PRPublished
			due[i].PublishedAt = &now
			due[i].ScheduledAt = nil
			if err := tx.Save(&due[i]).Error; err != nil {
				return err
			}
			published = append(published, due[i].Title)
		}

		// ข่าวที่เผยแพร่อยู่แต่เลยวันหมดอายุ -> หมดอายุ
		return tx.Model(&models.PRItem{}).
			Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", models.PRPublished, now).
			Update("status", models.PRExpired).Error
	})

	return published, err
}
