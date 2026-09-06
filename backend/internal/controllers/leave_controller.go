package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

type LeaveController struct {
	db *gorm.DB
}

func NewLeaveController(db *gorm.DB) *LeaveController {
	return &LeaveController{db: db}
}

// fillNames เติมชื่อผู้ขอและผู้อนุมัติ ด้วยคำสั่งเดียวไม่ว่าจะกี่แถว
// ทำเองแทน Preload เพราะความสัมพันธ์ User ของทีมทำให้ AutoMigrate ล้ม
func (lc *LeaveController) fillNames(leaves []models.LeaveRequest) []models.LeaveRequest {
	ids := map[uint]bool{}
	for _, l := range leaves {
		ids[l.UserID] = true
		if l.ApproverID != nil {
			ids[*l.ApproverID] = true
		}
	}
	if len(ids) == 0 {
		return leaves
	}

	list := make([]uint, 0, len(ids))
	for id := range ids {
		list = append(list, id)
	}

	var users []models.User
	lc.db.Select("user_id", "name").Where("user_id IN ?", list).Find(&users)
	name := map[uint]string{}
	for _, u := range users {
		name[u.UserID] = u.Name
	}

	for i := range leaves {
		leaves[i].UserName = name[leaves[i].UserID]
		if leaves[i].ApproverID != nil {
			leaves[i].ApproverName = name[*leaves[i].ApproverID]
		}
	}
	return leaves
}

// currentUserID ดึงผู้ใช้จาก token ที่ middleware ใส่ไว้ใน context
func currentUserID(c *gin.Context) (uint, bool) {
	v, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch id := v.(type) {
	case uint:
		return id, true
	case int:
		return uint(id), true
	case float64:
		return uint(id), true
	}
	return 0, false
}

// Create พนักงานยื่นคำขอลา ยึดตัวตนจาก token ไม่รับ user_id จาก body
func (lc *LeaveController) Create(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var req dto.CreateLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรอกข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง"})
		return
	}

	// วันสิ้นสุดต้องไม่มาก่อนวันเริ่ม เทียบเป็นข้อความได้เพราะรูปแบบ YYYY-MM-DD เรียงตามตัวอักษรตรงกับตามเวลา
	if req.EndDate < req.StartDate {
		c.JSON(http.StatusBadRequest, gin.H{"error": "วันสิ้นสุดต้องไม่มาก่อนวันเริ่มลา"})
		return
	}

	leave := models.LeaveRequest{
		UserID:    userID,
		LeaveType: models.LeaveType(req.LeaveType),
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
		Reason:    req.Reason,
		Status:    models.LeavePending,
	}
	if err := lc.db.Create(&leave).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกคำขอลาไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, lc.fillNames([]models.LeaveRequest{leave})[0])
}

// ListMine คำขอลาของตัวเอง พนักงานทุกตำแหน่งเรียกได้
func (lc *LeaveController) ListMine(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var leaves []models.LeaveRequest
	if err := lc.db.Where("user_id = ?", userID).
		Order("created_at DESC").Find(&leaves).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, lc.fillNames(leaves))
}

// List คำขอลาของทุกคน เฉพาะหัวหน้าหอสมุด
func (lc *LeaveController) List(c *gin.Context) {
	var leaves []models.LeaveRequest
	q := lc.db.Model(&models.LeaveRequest{})
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	// รออนุมัติขึ้นก่อนเสมอ เพราะเป็นงานที่หัวหน้าต้องทำ
	if err := q.Order("CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC").
		Find(&leaves).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อ่านข้อมูลไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, lc.fillNames(leaves))
}

// Decide หัวหน้าอนุมัติหรือไม่อนุมัติคำขอ
func (lc *LeaveController) Decide(c *gin.Context) {
	approverID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var req dto.DecideLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องระบุผลการพิจารณาเป็น approved หรือ rejected"})
		return
	}

	var leave models.LeaveRequest
	if err := lc.db.First(&leave, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำขอลานี้"})
		return
	}

	// ตัดสินซ้ำไม่ได้ กันกรณีเปิดหน้าค้างไว้สองแท็บแล้วกดคนละอย่าง
	if leave.Status != models.LeavePending {
		c.JSON(http.StatusConflict, gin.H{"error": "คำขอนี้ถูกพิจารณาไปแล้ว"})
		return
	}

	now := time.Now()
	leave.Status = models.LeaveStatus(req.Status)
	leave.ApproverID = &approverID
	leave.DecidedAt = &now
	leave.DecisionNote = req.DecisionNote
	if err := lc.db.Save(&leave).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกผลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, lc.fillNames([]models.LeaveRequest{leave})[0])
}

// Cancel เจ้าของคำขอยกเลิกเอง ทำได้เฉพาะตอนที่ยังไม่ถูกพิจารณา
func (lc *LeaveController) Cancel(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	var leave models.LeaveRequest
	if err := lc.db.First(&leave, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบคำขอลานี้"})
		return
	}
	if leave.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "ยกเลิกได้เฉพาะคำขอของตัวเอง"})
		return
	}
	if leave.Status != models.LeavePending {
		c.JSON(http.StatusConflict, gin.H{"error": "คำขอนี้ถูกพิจารณาไปแล้ว ยกเลิกไม่ได้"})
		return
	}

	leave.Status = models.LeaveCanceled
	if err := lc.db.Save(&leave).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ยกเลิกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, leave)
}
