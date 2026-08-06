package auth

import (
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"
)

// SessionTTL อายุของ session หลังล็อกอิน
const SessionTTL = 8 * time.Hour

// CookieName ชื่อคุกกี้ที่เก็บ session token
const CookieName = "lms_session"

type session struct {
	userID    int
	expiresAt time.Time
}

// SessionStore เก็บ session ไว้ในหน่วยความจำ
// session จะหายเมื่อรีสตาร์ทเซิร์ฟเวอร์ — พอสำหรับตอนพัฒนา
// ถ้าจะขึ้นจริงหลายเครื่องให้เปลี่ยนไปใช้ Redis หรือตารางใน DB
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]session
}

func NewSessionStore() *SessionStore {
	return &SessionStore{sessions: make(map[string]session)}
}

// Create ออก token ใหม่ให้ผู้ใช้ที่ล็อกอินสำเร็จ
func (s *SessionStore) Create(userID int) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[token] = session{userID: userID, expiresAt: time.Now().Add(SessionTTL)}
	return token, nil
}

// UserID คืน id ของเจ้าของ token ถ้า token ยังไม่หมดอายุ
func (s *SessionStore) UserID(token string) (int, bool) {
	s.mu.RLock()
	found, ok := s.sessions[token]
	s.mu.RUnlock()

	if !ok {
		return 0, false
	}
	if time.Now().After(found.expiresAt) {
		s.Destroy(token)
		return 0, false
	}
	return found.userID, true
}

// Destroy ลบ session ทิ้ง ใช้ตอน log out
func (s *SessionStore) Destroy(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
}
