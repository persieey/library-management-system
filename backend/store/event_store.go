package store

import (
	"errors"

	"gorm.io/gorm"

	"library-management-system/models"
)

var ErrEventNotFound = errors.New("ไม่พบกิจกรรม")

// EventStore ดูแลข้อมูลกิจกรรมของหอสมุด
type EventStore struct{ db *gorm.DB }

func NewEventStore(db *gorm.DB) *EventStore { return &EventStore{db: db} }

// List เรียงตามวันจัดกิจกรรมจากใกล้ไปไกล เพื่อให้หน้าเว็บเอาไปแสดงได้เลย
func (s *EventStore) List() ([]models.Event, error) {
	events := []models.Event{}
	err := s.db.Order("start_at ASC, id ASC").Find(&events).Error
	return events, err
}

func (s *EventStore) ByID(id int) (*models.Event, error) {
	var event models.Event
	if err := s.db.First(&event, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	return &event, nil
}

func (s *EventStore) Create(event *models.Event) error {
	return s.db.Create(event).Error
}

func (s *EventStore) Save(event *models.Event) error {
	return s.db.Save(event).Error
}

func (s *EventStore) Delete(id int) error {
	result := s.db.Delete(&models.Event{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrEventNotFound
	}
	return nil
}

func (s *EventStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.Event{}).Count(&n).Error
	return n, err
}
