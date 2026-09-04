package store

import (
	"errors"

	"gorm.io/gorm"

	"library-management-system/models"
)

var (
	ErrPersonnelNotFound = errors.New("ไม่พบข้อมูลบุคลากร")
	ErrStaffIDTaken      = errors.New("มีรหัสพนักงานนี้อยู่แล้ว")
)

// PersonnelStore ดูแลข้อมูลบุคลากรของหอสมุด
type PersonnelStore struct{ db *gorm.DB }

func NewPersonnelStore(db *gorm.DB) *PersonnelStore { return &PersonnelStore{db: db} }

func (s *PersonnelStore) List() ([]models.Personnel, error) {
	people := []models.Personnel{}
	err := s.db.Order("staff_id ASC").Find(&people).Error
	return people, err
}

func (s *PersonnelStore) ByID(id int) (*models.Personnel, error) {
	var person models.Personnel
	if err := s.db.First(&person, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPersonnelNotFound
		}
		return nil, err
	}
	return &person, nil
}

// staffIDTaken เช็ครหัสพนักงานซ้ำ โดยข้ามแถวของตัวเองตอนแก้ไข
func (s *PersonnelStore) staffIDTaken(staffID string, exceptID int) (bool, error) {
	var n int64
	err := s.db.Model(&models.Personnel{}).
		Where("staff_id = ? AND id <> ?", staffID, exceptID).
		Count(&n).Error
	return n > 0, err
}

func (s *PersonnelStore) Create(person *models.Personnel) error {
	taken, err := s.staffIDTaken(person.StaffID, 0)
	if err != nil {
		return err
	}
	if taken {
		return ErrStaffIDTaken
	}
	return s.db.Create(person).Error
}

func (s *PersonnelStore) Save(person *models.Personnel) error {
	taken, err := s.staffIDTaken(person.StaffID, person.ID)
	if err != nil {
		return err
	}
	if taken {
		return ErrStaffIDTaken
	}
	return s.db.Save(person).Error
}

func (s *PersonnelStore) Delete(id int) error {
	result := s.db.Delete(&models.Personnel{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrPersonnelNotFound
	}
	return nil
}

func (s *PersonnelStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.Personnel{}).Count(&n).Error
	return n, err
}
