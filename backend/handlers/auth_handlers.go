package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"library-management-system/auth"
	"library-management-system/models"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type userResponse struct {
	ID          int                 `json:"id"`
	Username    string              `json:"username"`
	Role        models.Role         `json:"role"`
	Permissions []models.Permission `json:"permissions"`
}

func toUserResponse(user *models.User) userResponse {
	return userResponse{
		ID:          user.ID,
		Username:    user.Username,
		Role:        user.Role,
		Permissions: user.Role.Permissions(),
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{
		"success": false,
		"error":   map[string]string{"message": message},
	})
}

func writeSuccess(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, map[string]any{"success": true, "data": data})
}

// Login ตรวจรหัสผ่านแล้วออก session cookie
func (a *Auth) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "รองรับเฉพาะ POST")
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน")
		return
	}

	user, err := a.Users.ByUsername(req.Username)
	// ตอบข้อความเดียวกันทั้งกรณีไม่มีบัญชีและรหัสผ่านผิด
	// เพื่อไม่ให้เดาได้ว่าชื่อผู้ใช้ไหนมีอยู่จริง
	if err != nil || !auth.CheckPassword(user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	token, err := a.Sessions.Create(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "สร้าง session ไม่สำเร็จ")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true, // JavaScript อ่านไม่ได้ ลดผลกระทบถ้าโดน XSS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(auth.SessionTTL.Seconds()),
		// Secure: true เมื่อขึ้น production ที่เป็น HTTPS
	})

	writeJSON(w, http.StatusOK, toUserResponse(user))
}

// LoginV1 รองรับ frontend-vite: ตอบ Bearer token ใน body แทน cookie
func (a *Auth) LoginV1(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "รองรับเฉพาะ POST")
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน")
		return
	}

	user, err := a.Users.ByUsername(req.Username)
	if err != nil || !auth.CheckPassword(user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	token, err := a.Sessions.Create(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "สร้าง session ไม่สำเร็จ")
		return
	}

	writeSuccess(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  toUserResponse(user),
	})
}

// ProfileV1 คืนข้อมูลผู้ใช้จาก Bearer token (สำหรับ frontend-vite)
func (a *Auth) ProfileV1(w http.ResponseWriter, r *http.Request) {
	user, ok := UserFrom(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "ต้องเข้าสู่ระบบก่อน")
		return
	}
	writeSuccess(w, http.StatusOK, toUserResponse(user))
}

// Logout ลบ session ทิ้งและล้างคุกกี้
func (a *Auth) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "รองรับเฉพาะ POST")
		return
	}

	if cookie, err := r.Cookie(auth.CookieName); err == nil {
		a.Sessions.Destroy(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	w.WriteHeader(http.StatusNoContent)
}

// Me คืนข้อมูลผู้ใช้ปัจจุบัน ให้หน้าเว็บเรียกตอนโหลดเพื่อกู้สถานะล็อกอินคืน
func (a *Auth) Me(w http.ResponseWriter, r *http.Request) {
	user, _ := UserFrom(r)
	writeJSON(w, http.StatusOK, toUserResponse(user))
}
