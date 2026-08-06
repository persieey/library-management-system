package store

import (
	"errors"
	"sync"

	"library-management-system/models"
)

var ErrUserNotFound = errors.New("ไม่พบบัญชีผู้ใช้")

// UserStore เป็นหน้าฉากที่กั้น handler ออกจากที่เก็บข้อมูลจริง
// ตอนต่อฐานข้อมูลให้เขียน implementation ใหม่ตัวเดียว ไม่ต้องแก้ handler
type UserStore interface {
	ByUsername(username string) (*models.User, error)
	ByID(id int) (*models.User, error)
	List() []*models.User
	Create(user *models.User) (*models.User, error)
	SetRole(id int, role models.Role) error
}

// InMemoryUserStore ใช้ระหว่างพัฒนา ข้อมูลหายเมื่อปิดโปรแกรม
type InMemoryUserStore struct {
	mu     sync.RWMutex
	users  map[int]*models.User
	nextID int
}

func NewInMemoryUserStore() *InMemoryUserStore {
	return &InMemoryUserStore{users: make(map[int]*models.User), nextID: 1}
}

func (s *InMemoryUserStore) ByUsername(username string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, user := range s.users {
		if user.Username == username {
			copied := *user
			return &copied, nil
		}
	}
	return nil, ErrUserNotFound
}

func (s *InMemoryUserStore) ByID(id int) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, ok := s.users[id]
	if !ok {
		return nil, ErrUserNotFound
	}
	copied := *user
	return &copied, nil
}

func (s *InMemoryUserStore) List() []*models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*models.User, 0, len(s.users))
	for _, user := range s.users {
		copied := *user
		list = append(list, &copied)
	}
	return list
}

func (s *InMemoryUserStore) Create(user *models.User) (*models.User, error) {
	if !user.Role.IsValid() {
		return nil, errors.New("role ไม่ถูกต้อง: " + string(user.Role))
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.users {
		if existing.Username == user.Username {
			return nil, errors.New("มีชื่อผู้ใช้นี้อยู่แล้ว: " + user.Username)
		}
	}

	created := *user
	created.ID = s.nextID
	s.nextID++
	s.users[created.ID] = &created

	copied := created
	return &copied, nil
}

func (s *InMemoryUserStore) SetRole(id int, role models.Role) error {
	if !role.IsValid() {
		return errors.New("role ไม่ถูกต้อง: " + string(role))
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	user, ok := s.users[id]
	if !ok {
		return ErrUserNotFound
	}
	user.Role = role
	return nil
}
