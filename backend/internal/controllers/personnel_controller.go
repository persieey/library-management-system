package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// PersonnelController ดูแลข้อมูลบุคลากรฝั่งงานบุคคล
type PersonnelController struct{ db *gorm.DB }

func NewPersonnelController(db *gorm.DB) *PersonnelController {
	return &PersonnelController{db: db}
}

type personnelRequest struct {
	StaffID    string                 `json:"staff_id"`
	FirstName  string                 `json:"first_name"`
	LastName   string                 `json:"last_name"`
	Department string                 `json:"department"`
	Position   string                 `json:"position"`
	Email      string                 `json:"email"`
	Phone      string                 `json:"phone"`
	StartDate  string                 `json:"start_date"`
	Status     models.PersonnelStatus `json:"status"`
	EmployeeID *uint                  `json:"employee_id"`
}

func (r *personnelRequest) validate() error {
	r.StaffID = strings.TrimSpace(r.StaffID)
	r.FirstName = strings.TrimSpace(r.FirstName)
	r.LastName = strings.TrimSpace(r.LastName)

	switch {
	case r.StaffID == "":
		return errors.New("กรุณากรอกรหัสพนักงาน")
	case r.FirstName == "":
		return errors.New("กรุณากรอกชื่อ")
	case r.LastName == "":
		return errors.New("กรุณากรอกนามสกุล")
	}

	if r.Status == "" {
		r.Status = models.PersonnelActive
	}
	if !r.Status.IsValid() {
		return errors.New("สถานะไม่ถูกต้อง: " + string(r.Status))
	}
	return nil
}

func (r *personnelRequest) apply(p *models.Personnel) {
	p.StaffID = r.StaffID
	p.FirstName = r.FirstName
	p.LastName = r.LastName
	p.Department = r.Department
	p.Position = r.Position
	p.Email = r.Email
	p.Phone = r.Phone
	p.StartDate = r.StartDate
	p.Status = r.Status
	p.EmployeeID = r.EmployeeID
}

// staffIDTaken เช็ครหัสพนักงานซ้ำ โดยข้ามแถวของตัวเองตอนแก้ไข
func (pc *PersonnelController) staffIDTaken(staffID string, exceptID uint) (bool, error) {
	var n int64
	err := pc.db.Model(&models.Personnel{}).
		Where("staff_id = ? AND personnel_id <> ?", staffID, exceptID).
		Count(&n).Error
	return n > 0, err
}

func (pc *PersonnelController) List(c *gin.Context) {
	people := []models.Personnel{}
	if err := pc.db.Order("staff_id ASC").Find(&people).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลบุคลากรไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, people)
}

func (pc *PersonnelController) Create(c *gin.Context) {
	var req personnelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taken, err := pc.staffIDTaken(req.StaffID, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจรหัสพนักงานไม่สำเร็จ"})
		return
	}
	if taken {
		c.JSON(http.StatusConflict, gin.H{"error": "มีรหัสพนักงานนี้อยู่แล้ว"})
		return
	}

	person := models.Personnel{}
	req.apply(&person)
	if err := pc.db.Create(&person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลบุคลากรไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, person)
}

func (pc *PersonnelController) Update(c *gin.Context) {
	person, ok := pc.find(c)
	if !ok {
		return
	}

	var req personnelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := req.validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taken, err := pc.staffIDTaken(req.StaffID, person.PersonnelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจรหัสพนักงานไม่สำเร็จ"})
		return
	}
	if taken {
		c.JSON(http.StatusConflict, gin.H{"error": "มีรหัสพนักงานนี้อยู่แล้ว"})
		return
	}

	req.apply(person)
	if err := pc.db.Save(person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกการแก้ไขไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, person)
}

func (pc *PersonnelController) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	result := pc.db.Delete(&models.Personnel{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลบุคลากรไม่สำเร็จ"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลบุคลากรที่ต้องการ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลบุคลากรแล้ว"})
}

// ToggleStatus สลับระหว่างปฏิบัติงานอยู่กับพ้นสภาพ
// จงใจไม่ลบแถวทิ้ง เพราะประวัติการทำงานยังต้องอ้างถึงคนคนนี้ได้
func (pc *PersonnelController) ToggleStatus(c *gin.Context) {
	person, ok := pc.find(c)
	if !ok {
		return
	}

	if person.Status == models.PersonnelActive {
		person.Status = models.PersonnelInactive
	} else {
		person.Status = models.PersonnelActive
	}

	if err := pc.db.Save(person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เปลี่ยนสถานะไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, person)
}

func (pc *PersonnelController) find(c *gin.Context) (*models.Personnel, bool) {
	id, ok := idParam(c)
	if !ok {
		return nil, false
	}
	var person models.Personnel
	if err := pc.db.First(&person, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลบุคลากรที่ต้องการ"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลไม่สำเร็จ"})
		}
		return nil, false
	}
	return &person, true
}
