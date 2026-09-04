package store

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"library-management-system/models"
)

var ErrPRNotFound = errors.New("ไม่พบข่าวประชาสัมพันธ์")

// PRStore ดูแลข้อมูลข่าวประชาสัมพันธ์ทั้งหมด
type PRStore struct{ db *gorm.DB }

func NewPRStore(db *gorm.DB) *PRStore { return &PRStore{db: db} }

// ordered เรียงข่าวแบบเดียวกับที่หน้าเว็บต้องการ — ปักหมุดขึ้นก่อน แล้วค่อยเรียงตามเวลาเผยแพร่ล่าสุด
func (s *PRStore) ordered(tx *gorm.DB) *gorm.DB {
	return tx.Order("pinned DESC, COALESCE(published_at, created_at) DESC, id DESC")
}

// List คืนข่าวทั้งหมด ใช้ในหน้าหลังบ้านของเจ้าหน้าที่
func (s *PRStore) List() ([]models.PRItem, error) {
	items := []models.PRItem{}
	err := s.ordered(s.db).Find(&items).Error
	return items, err
}

// ListPublished คืนเฉพาะข่าวที่เผยแพร่แล้ว ใช้กับหน้าเว็บสาธารณะ
func (s *PRStore) ListPublished() ([]models.PRItem, error) {
	items := []models.PRItem{}
	err := s.ordered(s.db.Where("status = ?", models.PRPublished)).Find(&items).Error
	return items, err
}

func (s *PRStore) ByID(id int) (*models.PRItem, error) {
	var item models.PRItem
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPRNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (s *PRStore) Create(item *models.PRItem) error {
	return s.db.Create(item).Error
}

func (s *PRStore) Save(item *models.PRItem) error {
	return s.db.Save(item).Error
}

func (s *PRStore) Delete(id int) error {
	result := s.db.Delete(&models.PRItem{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrPRNotFound
	}
	return nil
}

// IncrementView บวกยอดเข้าชมโดยไม่ต้องอ่านแถวขึ้นมาก่อน
// ทำเป็น UPDATE ทีเดียวเพื่อไม่ให้ยอดหายเวลามีคนเปิดพร้อมกัน
func (s *PRStore) IncrementView(id int) error {
	result := s.db.Model(&models.PRItem{}).
		Where("id = ?", id).
		UpdateColumn("views", gorm.Expr("views + 1"))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrPRNotFound
	}
	return nil
}

// RunDueTransitions เลื่อนสถานะข่าวที่ถึงกำหนดแล้ว แล้วคืนชื่อข่าวที่เพิ่งถูกเผยแพร่อัตโนมัติ
// งานนี้อยู่ฝั่งเซิร์ฟเวอร์เพื่อให้ทำงานต่อแม้ไม่มีใครเปิดหน้าเว็บค้างไว้
func (s *PRStore) RunDueTransitions(now time.Time) ([]string, error) {
	published := []string{}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// ข่าวที่ตั้งเวลาไว้และถึงกำหนดแล้ว → เผยแพร่
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

		// ข่าวที่เผยแพร่อยู่แต่เลยวันหมดอายุ → หมดอายุ
		return tx.Model(&models.PRItem{}).
			Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", models.PRPublished, now).
			Update("status", models.PRExpired).Error
	})

	return published, err
}

func (s *PRStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.PRItem{}).Count(&n).Error
	return n, err
}
