package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
	"math"
	"strconv"
	"time"
)

type LibraryController struct{ db *gorm.DB }

func NewLibraryController(db *gorm.DB) *LibraryController { return &LibraryController{db} }
func (h *LibraryController) DB() *gorm.DB                 { return h.db }

var bangkok = time.FixedZone("Asia/Bangkok", 7*60*60)

func day(t time.Time) time.Time {
	t = t.In(bangkok)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, bangkok)
}
func fail(c *gin.Context, err error) { utils.JSONError(c, 409, err.Error(), "") }
func bookingDates(raw string, days int) (time.Time, time.Time, error) {
	start, err := time.ParseInLocation("2006-01-02", raw, bangkok)
	if err != nil {
		// Normalize older ISO clients to Bangkok's calendar date.
		var timestamp time.Time
		timestamp, err = time.Parse(time.RFC3339, raw)
		if err == nil {
			start = day(timestamp)
		}
	}
	today := day(time.Now())
	if err != nil || days < 1 || days > 30 || start.Before(today) || start.After(today.AddDate(0, 0, 3)) {
		return start, start, errors.New("เลือกวันรับภายในวันนี้ถึงอีก 3 วัน และระยะเวลา 1–30 วัน")
	}
	return start, start.AddDate(0, 0, days), nil
}
func queryPeriod(c *gin.Context) (time.Time, time.Time, error) {
	if c.Query("reserved_for") == "" {
		s := day(time.Now())
		return s, s.AddDate(0, 0, 1), nil
	}
	n, err := strconv.Atoi(c.DefaultQuery("days", "1"))
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	return bookingDates(c.Query("reserved_for"), n)
}

// DueDate is the return date (the day after the last lending day).
func overlaps(db *gorm.DB, copyID *uint, eq *string, start, end time.Time) (bool, error) {
	q := db.Model(&models.Reservation{}).Where("status IN ?", []string{"reserved", "borrowed"})
	if copyID != nil {
		q = q.Where("copy_id = ?", *copyID)
	} else {
		q = q.Where("equipment_id = ?", *eq)
	}
	q = q.Where("(pickup_date < ? AND expire_date > ?) OR (status = ? AND expire_date <= ?)", end, start, "borrowed", day(time.Now()))
	var n int64
	err := q.Count(&n).Error
	return n > 0, err
}
func bookDTO(db *gorm.DB, b models.Book, start, end time.Time) (gin.H, error) {
	var copies []models.BookCopy
	if err := db.Where("book_id = ?", b.BookID).Order("copy_number").Find(&copies).Error; err != nil {
		return nil, err
	}
	available := 0
	location := ""
	for _, cp := range copies {
		if location == "" {
			location = cp.Building + " " + cp.Slot
		}
		if cp.AvailabilityStatus != "available" || cp.ConditionStatus != "good" {
			continue
		}
		busy, err := overlaps(db, &cp.CopyID, nil, start, end)
		if err != nil {
			return nil, err
		}
		if !busy {
			available++
		}
	}
	status := "not_available"
	if available > 0 {
		status = "available"
	} else if len(copies) > 0 {
		status = "reserved"
	}
	img := b.CoverImageURL
	if b.CoverPath != "" {
		img = b.CoverPath
	}
	return gin.H{"ID": b.BookID, "book_id": b.BookID, "barcode": b.ISBN, "title": b.Title, "author": b.Author, "publisher": b.Publisher, "category": b.Category, "call_number": b.CallNumber, "image_url": img, "location": location, "status": status, "quantity": len(copies), "available_quantity": available, "resource_type": "book"}, nil
}
func equipmentDTO(db *gorm.DB, e models.Equipmentborrow, start, end time.Time) (gin.H, error) {
	status := e.Status
	if status == "available" && e.Condition == "good" {
		busy, err := overlaps(db, nil, &e.EquipmentId, start, end)
		if err != nil {
			return nil, err
		}
		if busy {
			status = "reserved"
		}
	} else {
		status = "not_available"
	}
	return gin.H{"ID": e.EquipmentId, "equipment_id": e.EquipmentId, "asset_code": e.AssetNumber, "name": e.EquipmentName, "category": e.Category, "brand": e.Brand, "model": e.Model, "location": e.Location, "condition": e.Condition, "status": status, "image_url": e.ImageURL}, nil
}
func (h *LibraryController) Resources(c *gin.Context) {
	start, end, err := queryPeriod(c)
	if err != nil {
		fail(c, err)
		return
	}
	var books []models.Book
	if err = h.db.Order("book_id").Find(&books).Error; err != nil {
		fail(c, err)
		return
	}
	out := []gin.H{}
	for _, b := range books {
		row, err := bookDTO(h.db, b, start, end)
		if err != nil {
			fail(c, err)
			return
		}
		out = append(out, row)
	}
	utils.JSONSuccess(c, 200, out)
}
func (h *LibraryController) Equipment(c *gin.Context) {
	start, end, err := queryPeriod(c)
	if err != nil {
		fail(c, err)
		return
	}
	var items []models.Equipmentborrow
	if err = h.db.Order("equipment_id").Find(&items).Error; err != nil {
		fail(c, err)
		return
	}
	out := []gin.H{}
	for _, e := range items {
		row, err := equipmentDTO(h.db, e, start, end)
		if err != nil {
			fail(c, err)
			return
		}
		out = append(out, row)
	}
	utils.JSONSuccess(c, 200, out)
}

func rawID(raw json.RawMessage) string {
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	var n json.Number
	if json.Unmarshal(raw, &n) == nil {
		return string(n)
	}
	return ""
}
func (h *LibraryController) BorrowSelf(c *gin.Context)          { h.reserve(c, false) }
func (h *LibraryController) BorrowEquipmentSelf(c *gin.Context) { h.reserve(c, true) }
func (h *LibraryController) reserve(c *gin.Context, equipment bool) {
	if c.GetString("role") != "member" {
		utils.JSONError(c, 403, "เฉพาะสมาชิกเท่านั้น", "")
		return
	}
	var p dto.CreateReservationRequest
	if c.ShouldBindJSON(&p) != nil {
		utils.JSONError(c, 400, "ข้อมูลการจองไม่ถูกต้อง", "")
		return
	}
	h.doReserve(c, equipment, c.GetUint("user_id"), p)
}

// BorrowForMember / BorrowEquipmentForMember ให้บรรณารักษ์สร้างรายการยืมแทนสมาชิกได้ตรง ๆ
// (walk-in ไม่ต้องรอสมาชิกจองเองผ่านหน้าเว็บ) หา user_id จริงจากรหัสนักศึกษาที่กรอกมา
// เสมอ เพื่อให้รายการนี้ผูกกับประวัติของสมาชิกคนนั้นจริง ไม่ใช่แค่เชื่อ client เฉย ๆ
func (h *LibraryController) BorrowForMember(c *gin.Context)          { h.reserveByLibrarian(c, false) }
func (h *LibraryController) BorrowEquipmentForMember(c *gin.Context) { h.reserveByLibrarian(c, true) }
func (h *LibraryController) reserveByLibrarian(c *gin.Context, equipment bool) {
	var req dto.LibrarianCreateReservationRequest
	if c.ShouldBindJSON(&req) != nil {
		utils.JSONError(c, 400, "ข้อมูลการจองไม่ถูกต้อง", "")
		return
	}
	var member models.Member
	if err := h.db.Where("university_id = ?", req.UniversityID).First(&member).Error; err != nil {
		utils.JSONError(c, 404, "ไม่พบสมาชิกรหัสนี้ในระบบ กรุณาตรวจสอบรหัสนักศึกษาอีกครั้ง", "")
		return
	}
	h.doReserve(c, equipment, member.UserID, req.CreateReservationRequest)
}

func (h *LibraryController) doReserve(c *gin.Context, equipment bool, userID uint, p dto.CreateReservationRequest) {
	if equipment && p.Days > 7 {
		fail(c, errors.New("อุปกรณ์ยืมได้ไม่เกิน 7 วัน"))
		return
	}
	start, end, err := bookingDates(p.ReservedFor, p.Days)
	if err != nil {
		fail(c, err)
		return
	}
	r := models.Reservation{ReservationId: uuid.NewString(), UserId: userID, ReserveDate: time.Now(), PickupDate: start, ExpireDate: end, Status: "reserved"}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		// Lock the member and catalog row before counting capacity; also serializes SQLite writers.
		if err := tx.Model(&models.User{}).Where("user_id = ?", r.UserId).UpdateColumn("status", gorm.Expr("status")).Error; err != nil {
			return err
		}
		var m models.Member
		if err := tx.Where("user_id = ?", r.UserId).First(&m).Error; err != nil {
			return err
		}
		var n int64
		if err := tx.Model(&models.Reservation{}).Where("user_id = ? AND status IN ?", r.UserId, []string{"reserved", "borrowed"}).Count(&n).Error; err != nil {
			return err
		}
		if int(n) >= m.Borrowlimit {
			return errors.New("จำนวนรายการถึงขีดจำกัดสมาชิกแล้ว")
		}
		kind, itemID := "book", strconv.FormatUint(uint64(p.ResourceID), 10)
		if equipment {
			kind = "equipment"
			itemID = rawID(p.EquipmentID)
			if err := tx.Model(&models.Equipmentborrow{}).Where("equipment_id = ?", itemID).UpdateColumn("status", gorm.Expr("status")).Error; err != nil {
				return err
			}
			var e models.Equipmentborrow
			if err := tx.First(&e, "equipment_id = ?", itemID).Error; err != nil {
				return err
			}
			if e.Status != "available" || e.Condition != "good" {
				return errors.New("อุปกรณ์ไม่พร้อมให้ยืม")
			}
			busy, err := overlaps(tx, nil, &itemID, start, end)
			if err != nil {
				return err
			}
			if busy {
				return errors.New("อุปกรณ์ถูกจองในช่วงเวลานี้")
			}
			r.EquipmentID = &itemID
		} else {
			if err := tx.Model(&models.Book{}).Where("book_id = ?", p.ResourceID).UpdateColumn("title", gorm.Expr("title")).Error; err != nil {
				return err
			}
			var copies []models.BookCopy
			if err := tx.Where("book_id = ? AND availability_status = ? AND condition_status = ?", p.ResourceID, "available", "good").Order("copy_id").Find(&copies).Error; err != nil {
				return err
			}
			for _, cp := range copies {
				busy, err := overlaps(tx, &cp.CopyID, nil, start, end)
				if err != nil {
					return err
				}
				if !busy {
					id := cp.CopyID
					r.CopyID = &id
					break
				}
			}
			if r.CopyID == nil {
				return errors.New("ไม่มีหนังสือว่างในช่วงเวลาที่เลือก")
			}
		}
		var head models.ReservationQueue
		err := tx.Where("kind = ? AND item_id = ? AND status = ?", kind, itemID, "waiting").Order("id").First(&head).Error
		if err == nil {
			if head.UserID != r.UserId {
				return errors.New("รายการนี้มีสมาชิกต่อคิวก่อนคุณ")
			}
			if err = tx.Model(&head).Update("status", "fulfilled").Error; err != nil {
				return err
			}
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		return tx.Create(&r).Error
	})
	if err != nil {
		fail(c, err)
		return
	}
	utils.JSONSuccess(c, 201, gin.H{"ID": r.ReservationId, "reservation_id": r.ReservationId})
}
func (h *LibraryController) MyLoans(c *gin.Context)          { h.list(c, false, true) }
func (h *LibraryController) Loans(c *gin.Context)            { h.list(c, false, false) }
func (h *LibraryController) MyEquipmentLoans(c *gin.Context) { h.list(c, true, true) }
func (h *LibraryController) EquipmentLoans(c *gin.Context)   { h.list(c, true, false) }
func fineAmount(due, at time.Time) (int, float64) {
	// The complete due date is allowed; charging starts the following calendar day.
	days := int(day(at).Sub(day(due)).Hours() / 24)
	if days < 0 {
		days = 0
	}
	return days, float64(days) * 5
}
func (h *LibraryController) list(c *gin.Context, equipment, own bool) {
	var rs []models.Reservation
	q := h.db.Preload("User").Preload("Copy.Book").Preload("Equipment")
	if equipment {
		// equipment_id ถูกล้างเป็น NULL ตอนคืนแบบชำรุด/หาย (ของถูกย้ายไป equipment_problems)
		// ต้องรวมรายการนั้นด้วย ไม่งั้นค่าปรับที่ค้างของของชำรุด/หายจะหายไปจากหน้านี้
		q = q.Where("equipment_id IS NOT NULL OR reservation_id IN (SELECT reservation_id FROM equipment_problems)")
	} else {
		q = q.Where("copy_id IS NOT NULL OR reservation_id IN (SELECT reservation_id FROM book_problems)")
	}
	if own {
		q = q.Where("user_id = ?", c.GetUint("user_id"))
	}
	if err := q.Order("reserve_date DESC").Find(&rs).Error; err != nil {
		fail(c, err)
		return
	}
	out := []gin.H{}
	for _, r := range rs {
		row := gin.H{"ID": r.ReservationId, "reservation_id": r.ReservationId, "CreatedAt": r.ReserveDate, "reserved_for": r.PickupDate, "due_at": r.ExpireDate, "status": r.Status, "borrowed_at": nil, "returned_at": nil, "fine": 0, "fine_paid": false, "cancelled_at": r.CancelledAt, "cancellation_reason": r.CancellationReason}
		if r.User != nil {
			row["user"] = dto.SessionUser(h.db, *r.User, "member")
		}
		if r.Copy != nil && r.Copy.Book != nil {
			b, err := bookDTO(h.db, *r.Copy.Book, r.PickupDate, r.ExpireDate)
			if err != nil {
				fail(c, err)
				return
			}
			row["resource"] = b
			row["resource_id"] = r.Copy.BookID
		} else if !equipment {
			// copy_id ถูกล้างแล้ว (ของชำรุด/หาย) — ดึงชื่อหนังสือจาก book_problems แทน
			// จะได้ยังเห็นว่ารายการนี้คือเล่มไหนตอนอยู่แท็บค่าปรับค้างชำระ
			var bp models.BookProblem
			if err := h.db.Where("reservation_id = ?", r.ReservationId).First(&bp).Error; err == nil {
				row["resource"] = gin.H{"title": bp.Title, "isbn": bp.ISBN, "call_number": bp.CallNumber}
				row["resource_id"] = bp.BookID
			}
		}
		if r.Equipment != nil {
			e, err := equipmentDTO(h.db, *r.Equipment, r.PickupDate, r.ExpireDate)
			if err != nil {
				fail(c, err)
				return
			}
			row["equipment"] = e
			row["equipment_id"] = r.Equipment.EquipmentId
		} else if equipment {
			var ep models.EquipmentProblem
			if err := h.db.Where("reservation_id = ?", r.ReservationId).First(&ep).Error; err == nil {
				row["equipment"] = gin.H{"name": ep.EquipmentName, "asset_code": ep.AssetNumber, "category": ep.Category}
				row["equipment_id"] = ep.OriginalEquipmentID
			}
		}
		var b models.BorrowTransaction
		err := h.db.Where("reservation_id = ?", r.ReservationId).First(&b).Error
		if err == nil {
			row["borrowed_at"] = b.BorrowDate
			row["borrow_id"] = b.BorrowId
			at := time.Now()
			var ret models.ReturnTransaction
			err = h.db.Where("borrow_id = ?", b.BorrowId).First(&ret).Error
			if err == nil {
				at = ret.ReturnDate
				row["returned_at"] = at
				row["condition_in"] = ret.BookCondition
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				fail(c, err)
				return
			}
			days, amount := fineAmount(b.DueDate, at)
			var f models.Fine
			err = h.db.Where("borrow_id = ?", b.BorrowId).First(&f).Error
			if err == nil {
				row["fine_id"] = f.FineId
				row["fine_status"] = f.PaidStatus
				row["fine_description"] = f.Description
				row["fine_paid"] = f.PaidStatus == "paid"
				row["fine"] = math.Max(amount, f.Amount)
				if f.PaidStatus == "paid" {
					row["fine"] = f.Amount
				}
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				row["fine"] = amount
			} else {
				fail(c, err)
				return
			}
			row["overdue_days"] = days
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, err)
			return
		}
		out = append(out, row)
	}
	utils.JSONSuccess(c, 200, out)
}
func (h *LibraryController) Checkout(c *gin.Context)                { h.transition(c, "checkout", false) }
func (h *LibraryController) CheckoutEquipment(c *gin.Context)       { h.transition(c, "checkout", true) }
func (h *LibraryController) Return(c *gin.Context)                  { h.transition(c, "return", false) }
func (h *LibraryController) ReturnEquipment(c *gin.Context)         { h.transition(c, "return", true) }
func (h *LibraryController) PayLoanFine(c *gin.Context)             { h.transition(c, "pay-fine", false) }
func (h *LibraryController) PayEquipmentFine(c *gin.Context)        { h.transition(c, "pay-fine", true) }
func (h *LibraryController) CancelLoanSelf(c *gin.Context)          { h.transition(c, "cancel", false) }
func (h *LibraryController) CancelEquipmentLoanSelf(c *gin.Context) { h.transition(c, "cancel", true) }
func (h *LibraryController) NoShow(c *gin.Context) {
	h.transition(c, "no-show", c.Param("kind") == "equipment-loans")
}
func (h *LibraryController) transition(c *gin.Context, action string, equipment bool) {
	requiresFine := false
	err := h.db.Transaction(func(tx *gorm.DB) error {
		q := tx.Model(&models.Reservation{}).Where("reservation_id = ?", c.Param("id"))
		// pay-fine ยกเว้นเงื่อนไขนี้ เพราะตอนคืนแบบชำรุด/หาย copy_id หรือ equipment_id
		// ถูกล้างเป็น null ไปแล้ว (ลบเล่ม/อุปกรณ์ออกจากระบบจริงตามด้านล่าง) ถ้ายังเช็คอยู่
		// จะชำระค่าปรับของรายการที่เสียหายไปแล้วไม่ได้เลย ทั้งที่ยอดค้างชำระยังอยู่จริง
		if action != "pay-fine" {
			if equipment {
				q = q.Where("equipment_id IS NOT NULL")
			} else {
				q = q.Where("copy_id IS NOT NULL")
			}
		}
		if action == "cancel" {
			q = q.Where("user_id = ?", c.GetUint("user_id"))
		}
		locked := q.UpdateColumn("status", gorm.Expr("status"))
		if locked.Error != nil {
			return locked.Error
		}
		if locked.RowsAffected != 1 {
			return errors.New("ไม่พบรายการ")
		}
		var r models.Reservation
		if err := tx.First(&r, "reservation_id = ?", c.Param("id")).Error; err != nil {
			return err
		}
		now := time.Now()
		pickupDay := day(r.PickupDate)
		dueDay := day(r.ExpireDate)
		if action == "cancel" || action == "no-show" {
			if r.Status != "reserved" {
				return errors.New("รายการนี้ยกเลิกไม่ได้")
			}
			if action == "cancel" && !day(now).Before(pickupDay) {
				return errors.New("ยกเลิกได้ก่อนถึงวันรับเท่านั้น")
			}
			if action == "no-show" && day(now).Before(pickupDay) {
				return errors.New("ยังไม่ถึงวันรับ")
			}
			reason := "สมาชิกยกเลิก"
			if action == "no-show" {
				reason = "ไม่มารับ"
			}
			return tx.Model(&r).Updates(map[string]any{"status": "cancelled", "cancelled_at": now, "cancellation_reason": reason}).Error
		}
		if action == "checkout" {
			if r.Status != "reserved" || day(now).Before(pickupDay) || !day(now).Before(dueDay) {
				return errors.New("รายการยังไม่ถึงวันรับหรือพ้นช่วงยืมแล้ว")
			}
			b := models.BorrowTransaction{BorrowId: uuid.NewString(), ReservationId: r.ReservationId, BorrowDate: now, DueDate: r.ExpireDate, Status: "borrowed"}
			if err := tx.Create(&b).Error; err != nil {
				return err
			}
			return tx.Model(&r).Update("status", "borrowed").Error
		}
		var b models.BorrowTransaction
		if err := tx.First(&b, "reservation_id = ?", r.ReservationId).Error; err != nil {
			return err
		}
		if action == "return" {
			if r.Status != "borrowed" {
				return errors.New("รายการไม่ได้อยู่ระหว่างยืม")
			}
			condition := "good"
			var p dto.ReturnReservationRequest
			if c.Request.ContentLength > 0 {
				if c.ShouldBindJSON(&p) != nil {
					return errors.New("ข้อมูลสภาพไม่ถูกต้อง")
				}
				if p.Condition != "" {
					condition = p.Condition
				}
			}
			if condition != "good" && condition != "damaged" && condition != "lost" {
				return errors.New("สภาพต้องเป็น good, damaged หรือ lost")
			}
			ret := models.ReturnTransaction{ReturnId: uuid.NewString(), BorrowId: b.BorrowId, ReturnDate: now, BookCondition: condition}
			if err := tx.Create(&ret).Error; err != nil {
				return err
			}
			if condition == "good" {
				if r.CopyID != nil {
					if err := tx.Model(&models.BookCopy{}).Where("copy_id = ?", *r.CopyID).Updates(map[string]any{"condition_status": "good", "availability_status": "available"}).Error; err != nil {
						return err
					}
				}
				if r.EquipmentID != nil {
					if err := tx.Model(&models.Equipmentborrow{}).Where("equipment_id = ?", *r.EquipmentID).Updates(map[string]any{"condition": "good", "status": "available"}).Error; err != nil {
						return err
					}
				}
			} else {
				if r.CopyID != nil {
					if err := tx.Model(&models.BookCopy{}).Where("copy_id = ?", *r.CopyID).Updates(map[string]any{"condition_status": condition, "availability_status": "not_available"}).Error; err != nil {
						return err
					}
				}
				if r.EquipmentID != nil {
					if err := tx.Model(&models.Equipmentborrow{}).Where("equipment_id = ?", *r.EquipmentID).Updates(map[string]any{"condition": condition, "status": "not_available"}).Error; err != nil {
						return err
					}
				}
			}
			days, amount := fineAmount(b.DueDate, now)
			// A damaged/lost item always receives a pending fine record, even if
			// its amount has not yet been assessed. Overdue fees start at 5 baht
			// for every calendar day after the due date.
			var fine *models.Fine
			if condition != "good" || amount > 0 {
				description := "คืนเกินกำหนด"
				paidStatus := "unpaid"
				if condition != "good" {
					description = p.Description
					if description == "" {
						description = "รอตรวจสอบค่าปรับกรณี" + condition
					}
					if amount > 0 {
						description += "; คืนเกินกำหนด"
					}
					paidStatus = "pending"
				}
				created := &models.Fine{FineId: uuid.NewString(), BorrowId: b.BorrowId, OverdueDays: days, Amount: amount, PaidStatus: paidStatus, Description: description}
				if err := tx.Create(created).Error; err != nil {
					return err
				}
				fine = created
				requiresFine = true
			}
			if condition != "good" {
				report := models.DamageReport{ReportId: uuid.NewString(), ReturnId: ret.ReturnId, ReportDate: now, DamageType: condition, Description: p.Description}
				if fine != nil {
					report.FineId = fine.FineId
				}
				if err := tx.Create(&report).Error; err != nil {
					return err
				}
				// Keep the relationship in both directions for the audit trail:
				// DamageReport -> Fine and Fine -> DamageReport.
				if fine != nil {
					if err := tx.Model(fine).Update("report_id", report.ReportId).Error; err != nil {
						return err
					}
				}
				// Move unusable inventory to its dedicated problem table before
				// removing it from the active catalogue. The snapshot makes the
				// item, its report, and its fine traceable after removal.
				if r.CopyID != nil {
					var copy models.BookCopy
					if err := tx.First(&copy, "copy_id = ?", *r.CopyID).Error; err != nil {
						return err
					}
					var book models.Book
					if err := tx.First(&book, "book_id = ?", copy.BookID).Error; err != nil {
						return err
					}
					problem := models.BookProblem{
						ProblemID: uuid.NewString(), OriginalCopyID: copy.CopyID, BookID: copy.BookID,
						CopyNumber: copy.CopyNumber, Title: book.Title, ISBN: book.ISBN, CallNumber: book.CallNumber,
						Location: copy.Building + " " + copy.Slot, ProblemType: condition, Description: p.Description,
						ReservationID: r.ReservationId, BorrowID: b.BorrowId, ReturnID: ret.ReturnId,
						ReportID: report.ReportId, MovedAt: now,
					}
					if fine != nil {
						problem.FineID = fine.FineId
					}
					if err := tx.Create(&problem).Error; err != nil {
						return err
					}
					if err := tx.Model(&models.Reservation{}).Where("reservation_id = ?", r.ReservationId).Update("copy_id", nil).Error; err != nil {
						return err
					}
					if err := tx.Delete(&models.BookCopy{}, *r.CopyID).Error; err != nil {
						return err
					}
				}
				if r.EquipmentID != nil {
					var equipmentRecord models.Equipmentborrow
					if err := tx.First(&equipmentRecord, "equipment_id = ?", *r.EquipmentID).Error; err != nil {
						return err
					}
					problem := models.EquipmentProblem{
						ProblemID: uuid.NewString(), OriginalEquipmentID: equipmentRecord.EquipmentId,
						AssetNumber: equipmentRecord.AssetNumber, EquipmentName: equipmentRecord.EquipmentName,
						Category: equipmentRecord.Category, Brand: equipmentRecord.Brand, Model: equipmentRecord.Model,
						Location: equipmentRecord.Location, ImageURL: equipmentRecord.ImageURL,
						ProblemType: condition, Description: p.Description, ReservationID: r.ReservationId,
						BorrowID: b.BorrowId, ReturnID: ret.ReturnId, ReportID: report.ReportId, MovedAt: now,
					}
					if fine != nil {
						problem.FineID = fine.FineId
					}
					if err := tx.Create(&problem).Error; err != nil {
						return err
					}
					if err := tx.Model(&models.Reservation{}).Where("reservation_id = ?", r.ReservationId).Update("equipment_id", nil).Error; err != nil {
						return err
					}
					if err := tx.Delete(&models.Equipmentborrow{}, "equipment_id = ?", *r.EquipmentID).Error; err != nil {
						return err
					}
				}
			}
			if err := tx.Model(&b).Update("status", "completed").Error; err != nil {
				return err
			}
			return tx.Model(&r).Update("status", "completed").Error
		}
		if action == "pay-fine" {
			if r.Status != "completed" {
				return errors.New("ต้องบันทึกคืนก่อนชำระ เพื่อสรุปค่าปรับสุดท้าย")
			}
			var fine models.Fine
			if err := tx.Where("borrow_id = ? AND paid_status <> ?", b.BorrowId, "paid").First(&fine).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New("ไม่มีค่าปรับค้างชำระ")
				}
				return err
			}
			// Keep compatibility with the former one-click endpoint: no body
			// means the caller is explicitly confirming payment.
			request := dto.UpdateFineRequest{Paid: c.Request.ContentLength == 0}
			if c.Request.ContentLength > 0 && c.ShouldBindJSON(&request) != nil {
				return errors.New("ข้อมูลค่าปรับไม่ถูกต้อง")
			}
			updates := map[string]any{}
			if request.Amount != nil {
				if *request.Amount < 0 {
					return errors.New("ค่าปรับห้ามติดลบ")
				}
				updates["amount"] = *request.Amount
			}
			if request.Description != nil {
				updates["description"] = *request.Description
			}
			if request.Paid {
				updates["paid_status"] = "paid"
				updates["paid_date"] = now
			} else if request.Amount != nil || request.Description != nil {
				updates["paid_status"] = "unpaid"
			}
			if len(updates) == 0 {
				return errors.New("กรุณาระบุค่าปรับหรือยืนยันการชำระ")
			}
			if err := tx.Model(&fine).Updates(updates).Error; err != nil {
				return err
			}
			return nil
		}
		return fmt.Errorf("unsupported action")
	})
	if err != nil {
		fail(c, err)
		return
	}
	utils.JSONSuccess(c, 200, gin.H{"status": "ok", "requires_fine": requiresFine})
}
