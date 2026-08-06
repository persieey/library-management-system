package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword แปลงรหัสผ่านเป็น hash สำหรับเก็บลงฐานข้อมูล
// ห้ามเก็บรหัสผ่านดิบลง DB ไม่ว่ากรณีใด
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword เทียบรหัสผ่านที่ผู้ใช้กรอกกับ hash ที่เก็บไว้
// bcrypt ใช้เวลาเท่ากันไม่ว่าจะตรงหรือไม่ จึงไม่รั่วข้อมูลผ่านเวลาที่ใช้
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}
