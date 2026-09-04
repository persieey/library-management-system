package store

import (
	"errors"

	"gorm.io/gorm"

	"library-management-system/models"
)

var ErrUserNotFound = errors.New("ไม่พบบัญชีผู้ใช้")

// UserStore เป็นหน้าฉากที่กั้น handler ออกจากที่เก็บข้อมูลจริง
// handler เรียกผ่าน interface นี้เท่านั้น จะได้เปลี่ยนที่เก็บข้อมูลโดยไม่ต้องแก้ handler
type UserStore interface {
	ByUsername(username string) (*models.User, error)
	ByID(id int) (*models.User, error)
	List() ([]*models.User, error)
	Create(user *models.User) (*models.User, error)
	SetRole(id int, role models.Role) error
	Count() (int64, error)
}

// GormUserStore เก็บบัญชีผู้ใช้ลงฐานข้อมูลจริง
type GormUserStore struct{ db *gorm.DB }

func NewUserStore(db *gorm.DB) *GormUserStore { return &GormUserStore{db: db} }

func (s *GormUserStore) ByUsername(username string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *GormUserStore) ByID(id int) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *GormUserStore) List() ([]*models.User, error) {
	var users []*models.User
	if err := s.db.Order("id").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *GormUserStore) Create(user *models.User) (*models.User, error) {
	if !user.Role.IsValid() {
		return nil, errors.New("role ไม่ถูกต้อง: " + string(user.Role))
	}
	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (s *GormUserStore) SetRole(id int, role models.Role) error {
	if !role.IsValid() {
		return errors.New("role ไม่ถูกต้อง: " + string(role))
	}
	result := s.db.Model(&models.User{}).Where("id = ?", id).Update("role", role)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (s *GormUserStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.User{}).Count(&n).Error
	return n, err
}
