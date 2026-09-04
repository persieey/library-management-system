package models

// User คือบัญชีที่ใช้ล็อกอิน แยกจากตาราง personnel
// นักศึกษาและอาจารย์มีบัญชีได้โดยไม่ต้องมีแถวใน personnel — PersonnelID จึงเป็นค่าว่างได้
type User struct {
	ID           int    `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"size:60;uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"size:255;not null" json:"-"` // ห้ามส่งออกทาง JSON เด็ดขาด
	Role         Role   `gorm:"size:20;not null;index" json:"role"`
	PersonnelID  *int   `json:"personnel_id,omitempty"`
}

// Can ส่งต่อไปให้ role ตัดสิน เรียกจาก handler ได้ตรงๆ
func (u *User) Can(p Permission) bool {
	return u.Role.Can(p)
}
