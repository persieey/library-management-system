package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"library-management-system/models"
	"library-management-system/store"
)

// Personnel รวม handler ทั้งหมดของระบบจัดการบุคลากร
type Personnel struct{ People *store.PersonnelStore }

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

func (r *personnelRequest) apply(person *models.Personnel) {
	person.StaffID = r.StaffID
	person.FirstName = r.FirstName
	person.LastName = r.LastName
	person.Department = r.Department
	person.Position = r.Position
	person.Email = r.Email
	person.Phone = r.Phone
	person.StartDate = r.StartDate
	person.Status = r.Status
}

func (h *Personnel) List(c *gin.Context) {
	people, err := h.People.List()
	if err != nil {
		Fail(c, http.StatusInternalServerError, "อ่านข้อมูลบุคลากรไม่สำเร็จ")
		return
	}
	Success(c, http.StatusOK, people)
}

func (h *Personnel) Create(c *gin.Context) {
	var req personnelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	person := &models.Personnel{}
	req.apply(person)
	if err := h.People.Create(person); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusCreated, person)
}

func (h *Personnel) Update(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	var req personnelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, http.StatusBadRequest, "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if err := req.validate(); err != nil {
		Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	person, err := h.People.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
		return
	}

	req.apply(person)
	if err := h.People.Save(person); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, person)
}

func (h *Personnel) Delete(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	if err := h.People.Delete(id); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, gin.H{"message": "ลบข้อมูลบุคลากรแล้ว"})
}

// ToggleStatus สลับระหว่างปฏิบัติงานอยู่กับพ้นสภาพ
// จงใจไม่ลบแถวทิ้ง เพราะประวัติการทำงานยังต้องอ้างถึงคนคนนี้ได้
func (h *Personnel) ToggleStatus(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}

	person, err := h.People.ByID(id)
	if err != nil {
		h.failFromStore(c, err)
		return
	}

	if person.Status == models.PersonnelActive {
		person.Status = models.PersonnelInactive
	} else {
		person.Status = models.PersonnelActive
	}

	if err := h.People.Save(person); err != nil {
		h.failFromStore(c, err)
		return
	}
	Success(c, http.StatusOK, person)
}

func (h *Personnel) failFromStore(c *gin.Context, err error) {
	switch {
	case errors.Is(err, store.ErrPersonnelNotFound):
		Fail(c, http.StatusNotFound, "ไม่พบข้อมูลบุคลากรที่ต้องการ")
	case errors.Is(err, store.ErrStaffIDTaken):
		Fail(c, http.StatusConflict, "มีรหัสพนักงานนี้อยู่แล้ว")
	default:
		Fail(c, http.StatusInternalServerError, "ทำรายการไม่สำเร็จ")
	}
}
