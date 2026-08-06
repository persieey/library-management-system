package main

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
	"os"

	"library-management-system/auth"
	"library-management-system/handlers"
	"library-management-system/models"
	"library-management-system/store"
)

const (
	defaultAddr   = ":8080"
	defaultOrigin = "http://localhost:3000"
)

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// seedAccounts สร้างบัญชีตัวอย่างครบทั้ง 4 role ไว้ทดสอบ
// รหัสผ่านมาจาก LMS_SEED_PASSWORD ถ้าไม่ตั้งไว้จะสุ่มให้แล้วพิมพ์ออก log
// ตั้งใจไม่ฝังรหัสผ่านไว้ในซอร์ส เพื่อไม่ให้เผลอหลุดขึ้น production
func seedAccounts(users store.UserStore) error {
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

	if generated {
		log.Printf("บัญชีทดสอบ: student / librarian / staff / admin")
		log.Printf("รหัสผ่านที่สุ่มให้รอบนี้: %s", password)
		log.Printf("อยากกำหนดเอง ตั้ง LMS_SEED_PASSWORD ก่อนรัน")
	} else {
		log.Printf("บัญชีทดสอบ: student / librarian / staff / admin (ใช้รหัสจาก LMS_SEED_PASSWORD)")
	}
	return nil
}

func main() {
	users := store.NewInMemoryUserStore()
	if err := seedAccounts(users); err != nil {
		log.Fatalf("สร้างบัญชีตัวอย่างไม่สำเร็จ: %v", err)
	}

	authAPI := &handlers.Auth{Users: users, Sessions: auth.NewSessionStore()}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/login", authAPI.Login)
	mux.HandleFunc("/api/logout", authAPI.Logout)
	mux.HandleFunc("/api/me", authAPI.RequireAuth(authAPI.Me))

	// ตัวอย่างการกั้นด้วยสิทธิ์ — เฉพาะ admin เท่านั้นที่ผ่าน
	mux.HandleFunc("/api/personnel", authAPI.RequirePermission(
		models.PermManagePersonnel,
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			_, _ = w.Write([]byte(`{"personnel":[]}`))
		},
	))

	addr := env("LMS_ADDR", defaultAddr)
	origin := env("LMS_CORS_ORIGIN", defaultOrigin)

	log.Printf("Library Management System - Backend ฟังอยู่ที่ %s (อนุญาต origin %s)", addr, origin)
	if err := http.ListenAndServe(addr, handlers.CORS(origin, mux)); err != nil {
		log.Fatalf("เซิร์ฟเวอร์หยุดทำงาน: %v", err)
	}
}
