package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
)

// โควตาการจองห้องต่อคนต่อวัน — แก้ที่นี่ที่เดียว
// ต้องตรงกับ MAX_HOURS_PER_DAY ในหน้า RoomBookingUI ฝั่งเว็บ
const (
	maxBookingHoursPerDay   = 6
	maxBookingMinutesPerDay = maxBookingHoursPerDay * 60
)

// "เวลาสิ้นสุดจริง" ของการจอง — ถ้าคืนห้องแล้ว (completed) ใช้เวลาที่คืนจริง (ReturnedAt)
// แทน EndDateTime เดิม เพราะคืนก่อนเวลาต้องปลดล็อกเวลาที่เหลือให้จองใหม่ได้ และคืนหลังเวลา
// ก็ต้องกันไม่ให้คนอื่นจองทับช่วงที่เกินมาด้วย ส่วนการจองที่ยังไม่คืน (pending/confirmed)
// ยังไม่รู้ว่าจะจบเมื่อไหร่ จึงใช้ EndDateTime เดิมไปก่อน
const effectiveEndExpr = "(CASE WHEN status = 'completed' THEN COALESCE(returned_at, end_date_time) ELSE end_date_time END)"

// เคลียร์การจองที่ยัง "pending" (ไม่มีใครมารับห้อง) แต่ช่วงเวลาที่จองผ่านไปแล้ว ให้กลาย
// เป็น cancelled อัตโนมัติ (ถือว่าไม่มาใช้ตามนัด) ไม่งั้นห้องจะถูกจองค้างไว้ตลอดไปทั้งที่
// ไม่มีใครมาเช็คอินจริง เรียกก่อนทุก endpoint ที่อ่าน/เช็คสถานะการจอง
func (rb *RoomBookingController) expireStalePending() {
	rb.db.Model(&models.RoomBooking{}).
		Where("status = ? AND end_date_time < ?", "pending", time.Now()).
		Update("status", "cancelled")
}

type RoomBookingController struct {
	db *gorm.DB
}

func NewRoomBookingController(db *gorm.DB) *RoomBookingController {
	return &RoomBookingController{db: db}
}

// GET /api/v1/rooms — ใครก็ดูได้ (ไว้เลือกห้องก่อนจอง)
func (rb *RoomBookingController) ListRooms(c *gin.Context) {
	var rooms []models.Room
	if err := rb.db.Order("room_id asc").Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลห้องไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"rooms": rooms})
}

// GET /api/v1/room-bookings — staff เห็นทุกการจองห้อง
func (rb *RoomBookingController) List(c *gin.Context) {
	rb.expireStalePending()
	var items []models.RoomBooking
	if err := rb.db.Preload("User").Preload("Room").
		Order("room_booking_id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลการจองห้องไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room_bookings": items})
}

// POST /api/v1/room-bookings — ผู้ใช้ที่ login แล้วจองห้องได้
func (rb *RoomBookingController) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "กรุณาเข้าสู่ระบบก่อน"})
		return
	}

	rb.expireStalePending()

	var req dto.CreateRoomBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	start, err := time.Parse(time.RFC3339, req.StartDateTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_datetime ต้องเป็นรูปแบบ RFC3339"})
		return
	}
	end, err := time.Parse(time.RFC3339, req.EndDateTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_datetime ต้องเป็นรูปแบบ RFC3339"})
		return
	}
	if !end.After(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_datetime ต้องอยู่หลัง start_datetime"})
		return
	}

	// จองย้อนหลังไม่ได้ — เทียบกับเวลาจริงตอนนี้
	//
	// เช่นตอนบ่ายสี่จะย้อนไปจองช่องบ่ายสามไม่ได้ ดูที่เวลาเริ่มเป็นหลัก
	// ช่องที่เริ่มไปแล้วถือว่าหมดสิทธิ์จอง ถึงจะยังไม่จบช่องก็ตาม
	if start.Before(time.Now()) {
		c.JSON(http.StatusConflict, gin.H{"error": "ช่วงเวลานี้ผ่านไปแล้ว จองย้อนหลังไม่ได้"})
		return
	}

	// โควตา 6 ชั่วโมงต่อคนต่อวัน
	//
	// นับรวมทุกห้องในวันเดียวกัน ไม่ใช่ต่อห้อง และไม่ใช่ยอดรวมทุกวันกองกัน
	// การจองที่ถูกยกเลิกไม่นับ แต่ที่คืนห้องแล้ว (completed) นับ
	// เพราะใช้ห้องไปจริงแล้วในวันนั้น
	//
	// นับเป็นนาทีเพื่อเลี่ยงปัญหาปัดเศษของ float
	dayStart := time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, start.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	var sameDay []models.RoomBooking
	if err := rb.db.
		Where("user_id = ? AND status <> ? AND start_date_time >= ? AND start_date_time < ?",
			userID, "cancelled", dayStart, dayEnd).
		Find(&sameDay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบโควตาไม่สำเร็จ"})
		return
	}

	usedMinutes := 0
	for _, b := range sameDay {
		usedMinutes += int(b.EndDateTime.Sub(b.StartDateTime).Minutes())
	}
	wantMinutes := int(end.Sub(start).Minutes())

	if usedMinutes+wantMinutes > maxBookingMinutesPerDay {
		remaining := (maxBookingMinutesPerDay - usedMinutes) / 60
		if remaining < 0 {
			remaining = 0
		}
		c.JSON(http.StatusConflict, gin.H{
			"error": fmt.Sprintf("เกินโควตา %d ชั่วโมงต่อวัน วันนี้เหลืออีก %d ชั่วโมง", maxBookingHoursPerDay, remaining),
		})
		return
	}

	// กันจองซ้ำที่ฝั่ง server
	//
	// หน้าเว็บ grey out ช่องที่จองแล้วให้อยู่ แต่นั่นกันได้แค่คนที่กดผ่านหน้าจอ
	// ยิง API ตรงยังจองทับได้ ตามกฎใน backend/README.md ที่ว่าห้ามพึ่ง frontend
	// ในการกันสิทธิ์ จึงต้องเช็คซ้ำตรงนี้
	//
	// สองช่วงเวลาทับกันเมื่อ ของเดิมเริ่มก่อนของใหม่จบ และของเดิมจบหลังของใหม่เริ่ม
	// ใช้เงื่อนไขเดียวกับ Availability จะได้ตรงกับช่องที่หน้าเว็บปิดไว้
	// การจองที่ถูกยกเลิกแล้วไม่นับ เพราะห้องว่างกลับมาแล้ว และใช้ effectiveEndExpr แทน
	// end_date_time ตรง ๆ เพื่อให้ห้องที่คืนก่อนเวลาแล้วกลับมาว่างให้จองใหม่ได้ทันที
	var clash int64
	if err := rb.db.Model(&models.RoomBooking{}).
		Where("room_id = ? AND status <> ? AND start_date_time < ? AND "+effectiveEndExpr+" > ?",
			req.RoomID, "cancelled", end, start).
		Count(&clash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบช่วงเวลาไม่สำเร็จ"})
		return
	}
	if clash > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ช่วงเวลานี้มีคนจองห้องนี้ไว้แล้ว กรุณาเลือกช่วงเวลาอื่น"})
		return
	}

	// กันคนคนเดียวกันจองห้องซ้อนเวลาเดียวกัน ถึงจะเป็นคนละห้องก็ตาม (เช่นจองห้อง A
	// 10:00-11:00 แล้วมาจองห้อง B 10:00-11:00 ซ้อนอีกใบ) ใช้เงื่อนไขทับเวลาแบบเดียวกับ
	// ด้านบน แต่เช็คที่ user_id แทน room_id
	var selfClash int64
	if err := rb.db.Model(&models.RoomBooking{}).
		Where("user_id = ? AND status <> ? AND start_date_time < ? AND "+effectiveEndExpr+" > ?",
			userID, "cancelled", end, start).
		Count(&selfClash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตรวจสอบช่วงเวลาไม่สำเร็จ"})
		return
	}
	if selfClash > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "คุณมีการจองห้องอื่นในช่วงเวลานี้อยู่แล้ว กรุณาเลือกช่วงเวลาอื่น"})
		return
	}

	item := models.RoomBooking{
		UserID:        userID.(uint),
		RoomID:        req.RoomID,
		BookingType:   req.BookingType,
		StartDateTime: start,
		EndDateTime:   end,
		Status:        "pending",
	}

	if err := rb.db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "จองห้องไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// PATCH /api/v1/room-bookings/:id/status — staff เท่านั้น
func (rb *RoomBookingController) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateRoomBookingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status ไม่ถูกต้อง"})
		return
	}

	var item models.RoomBooking
	if err := rb.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจองห้อง"})
		return
	}

	item.Status = req.Status
	// บันทึกเวลาคืนจริงตอนกด "คืนห้อง" ครั้งแรกเท่านั้น (เผื่อมีใครยิงซ้ำ ไม่ให้เวลาคืน
	// ขยับ) ใช้ค่านี้คำนวณว่าคืนก่อน/หลังเวลาจอง แล้วปลดล็อก/กันเวลาที่เหลือให้ถูกต้อง
	if req.Status == "completed" && item.ReturnedAt == nil {
		now := time.Now()
		item.ReturnedAt = &now
	}
	if err := rb.db.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// GET /api/v1/room-bookings/availability?room_id=1&date=2026-09-02
// ทุกคน login แล้วดูได้ — คืนแค่ช่วงเวลาที่ถูกจอง ไม่โชว์ว่าใครจอง (ป้องกันความเป็นส่วนตัว)
func (rb *RoomBookingController) Availability(c *gin.Context) {
	rb.expireStalePending()

	roomID := c.Query("room_id")
	dateStr := c.Query("date") // YYYY-MM-DD

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date ต้องเป็นรูปแบบ YYYY-MM-DD"})
		return
	}
	dayStart := date
	dayEnd := date.Add(24 * time.Hour)

	var items []models.RoomBooking
	if err := rb.db.
		Where("room_id = ? AND status != ? AND start_date_time < ? AND "+effectiveEndExpr+" > ?",
			roomID, "cancelled", dayEnd, dayStart).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลไม่สำเร็จ"})
		return
	}

	slots := make([]gin.H, 0, len(items))
	for _, b := range items {
		// คืนก่อนเวลาไปแล้ว (completed + ReturnedAt เร็วกว่า EndDateTime เดิม) ก็ตัดช่อง
		// ที่บล็อกให้สั้นลงตามจริง ช่วงที่เหลือจะได้ว่างให้จองใหม่ได้ทันที
		endTime := b.EndDateTime
		if b.Status == "completed" && b.ReturnedAt != nil {
			endTime = *b.ReturnedAt
		}
		slots = append(slots, gin.H{
			"start_datetime": b.StartDateTime,
			"end_datetime":   endTime,
		})
	}
	c.JSON(http.StatusOK, gin.H{"booked_slots": slots})
}

// GET /api/v1/room-bookings/mine — เห็นแค่การจองของตัวเอง (ไม่ต้องเป็น employee)
func (rb *RoomBookingController) MyBookings(c *gin.Context) {
	rb.expireStalePending()
	userID, _ := c.Get("user_id")

	var items []models.RoomBooking
	if err := rb.db.Preload("Room").
		Where("user_id = ? AND status != ?", userID, "cancelled").
		Order("start_date_time asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลการจองไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room_bookings": items})
}

// PATCH /api/v1/room-bookings/:id/cancel — ยกเลิกได้เฉพาะเจ้าของการจอง (หรือ staff)
// และยกเลิกได้เฉพาะตอนที่ยังไม่ได้ไปรับห้อง (status = pending) เท่านั้น
func (rb *RoomBookingController) Cancel(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var item models.RoomBooking
	if err := rb.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	if item.UserID != userID.(uint) && role != "employee" {
		c.JSON(http.StatusForbidden, gin.H{"error": "ยกเลิกได้เฉพาะการจองของตัวเอง"})
		return
	}

	if item.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ยกเลิกได้เฉพาะการจองที่ยังไม่ได้รับห้อง"})
		return
	}

	item.Status = "cancelled"
	if err := rb.db.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ยกเลิกไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// POST /api/v1/rooms — staff เท่านั้น
func (rb *RoomBookingController) CreateRoom(c *gin.Context) {
	var req struct {
		RoomName string `json:"room_name" binding:"required"`
		RoomType string `json:"room_type" binding:"required,oneof=individual group"`
		Building string `json:"building"`
		Floor    string `json:"floor"`
		Capacity int    `json:"capacity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room := models.Room{
		RoomName: req.RoomName,
		RoomType: req.RoomType,
		Building: req.Building,
		Floor:    req.Floor,
		Capacity: req.Capacity,
		Status:   "available",
	}
	if err := rb.db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มห้องไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusCreated, room)
}