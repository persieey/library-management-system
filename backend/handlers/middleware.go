package handlers

import (
	"context"
	"net/http"
	"strings"

	"library-management-system/auth"
	"library-management-system/models"
	"library-management-system/store"
)

type contextKey string

const userContextKey contextKey = "user"

// UserFrom ดึงผู้ใช้ที่ผ่านการยืนยันตัวตนแล้วออกจาก request
func UserFrom(r *http.Request) (*models.User, bool) {
	user, ok := r.Context().Value(userContextKey).(*models.User)
	return user, ok
}

// Auth รวมของที่ middleware และ handler ต้องใช้ร่วมกัน
type Auth struct {
	Users    store.UserStore
	Sessions *auth.SessionStore
}

// current อ่าน Bearer token หรือ cookie แล้วหาเจ้าของ
func (a *Auth) current(r *http.Request) (*models.User, bool) {
	var token string

	if h := r.Header.Get("Authorization"); len(h) > 7 && h[:7] == "Bearer " {
		token = h[7:]
	} else if cookie, err := r.Cookie(auth.CookieName); err == nil {
		token = cookie.Value
	}

	if token == "" {
		return nil, false
	}
	userID, ok := a.Sessions.UserID(token)
	if !ok {
		return nil, false
	}
	user, err := a.Users.ByID(userID)
	if err != nil {
		return nil, false
	}
	return user, true
}

// RequireAuth ปล่อยผ่านเฉพาะคำขอที่ล็อกอินแล้ว
func (a *Auth) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := a.current(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "ต้องเข้าสู่ระบบก่อน")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userContextKey, user)))
	}
}

// RequirePermission ปล่อยผ่านเฉพาะคนที่มีสิทธิ์นั้นจริง
// นี่คือจุดบังคับสิทธิ์จริง ฝั่งหน้าเว็บแค่ซ่อนปุ่มเท่านั้น เชื่อไม่ได้
func (a *Auth) RequirePermission(perm models.Permission, next http.HandlerFunc) http.HandlerFunc {
	return a.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		user, _ := UserFrom(r)
		if !user.Can(perm) {
			writeError(w, http.StatusForbidden, "ไม่มีสิทธิ์เข้าถึงส่วนนี้")
			return
		}
		next(w, r)
	})
}

// CORS อนุญาต localhost ทุก port เพื่อรองรับ dev server ที่ใช้ port ต่างกัน
// ใน production ควรเปลี่ยนเป็น origin จริงแทน
func CORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowed := origin == allowedOrigin ||
			strings.HasPrefix(origin, "http://localhost:") ||
			strings.HasPrefix(origin, "http://127.0.0.1:")
		if allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
			w.Header().Set("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
