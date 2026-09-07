package jobs

import (
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// GracePeriod — ถ้าเลยเวลาเริ่มจองมาแล้วเกินเท่านี้ แล้วยังไม่มารับห้อง
// (status ยังเป็น pending) ระบบจะยกเลิกให้อัตโนมัติและคืนโควตาเวลา
const GracePeriod = 15 * time.Minute

// sweepInterval — รอบการตรวจของ background worker
const sweepInterval = 1 * time.Minute

// ExpireStaleBookings ยกเลิกการจองที่ผู้ใช้ไม่มารับห้องภายในเวลาที่กำหนด
// คืนจำนวนแถวที่ถูกยกเลิก โควตาเวลาได้คืนเองเพราะทั้ง backend และ frontend
// นับเฉพาะการจองที่ status เป็น pending/confirmed เท่านั้น
func ExpireStaleBookings(db *gorm.DB) (int64, error) {
	cutoff := time.Now().Add(-GracePeriod)
	res := db.Model(&models.RoomBooking{}).
		Where("status = ? AND start_date_time < ?", "pending", cutoff).
		Update("status", "cancelled")
	return res.RowsAffected, res.Error
}

// StartExpiryWorker รัน ExpireStaleBookings หนึ่งครั้งตอนบูต แล้ววนตรวจทุก ๆ นาที
// เรียกครั้งเดียวจาก main หลังต่อ database ได้แล้ว
func StartExpiryWorker(db *gorm.DB) {
	run := func() {
		n, err := ExpireStaleBookings(db)
		if err != nil {
			log.Printf("expiry worker: ยกเลิกการจองค้างไม่สำเร็จ: %v", err)
			return
		}
		if n > 0 {
			log.Printf("expiry worker: ยกเลิกการจองที่ไม่มารับห้อง %d รายการ", n)
		}
	}

	run()

	go func() {
		ticker := time.NewTicker(sweepInterval)
		defer ticker.Stop()
		for range ticker.C {
			run()
		}
	}()
}
