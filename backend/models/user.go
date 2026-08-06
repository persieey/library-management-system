package models

// User คือบัญชีที่ใช้ล็อกอิน แยกจากตาราง personnel
// นักศึกษาและอาจารย์มีบัญชีได้โดยไม่ต้องมีแถวใน personnel — PersonnelID จึงเป็นค่าว่างได้
type User struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // ห้ามส่งออกทาง JSON เด็ดขาด
	Role         Role   `json:"role"`
	PersonnelID  *int   `json:"personnel_id,omitempty"`
}

// Can ส่งต่อไปให้ role ตัดสิน เรียกจาก handler ได้ตรงๆ
func (u *User) Can(p Permission) bool {
	return u.Role.Can(p)
}
