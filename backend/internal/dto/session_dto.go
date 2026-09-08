package dto

import (
	"gorm.io/gorm"
	"github.com/SA-1-69/T09/backend/internal/models"
	"strings"
)

func SessionUser(db *gorm.DB, u models.User, role string) map[string]any {
	name := strings.SplitN(u.Name, " ", 2)
	last := ""
	if len(name) > 1 {
		last = name[1]
	}
	var m models.Member
	db.Where("user_id = ?", u.UserID).Find(&m)
	return map[string]any{"id": u.UserID, "user_id": u.UserID, "name": u.Name, "first_name": name[0], "last_name": last, "email": u.Email, "role": role, "member_status": u.Status, "status": u.Status, "student_code": m.UniversityID, "member_type": m.MemberType, "created_at": u.CreatedAt, "updated_at": u.UpdatedAt}
}
