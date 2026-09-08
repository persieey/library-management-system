package controllers

import (
	"encoding/json"
	"errors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
	"strconv"
	"time"
)

func (h *LibraryController) MyQueue(c *gin.Context) {
	var qs []models.ReservationQueue
	if err := h.db.Where("user_id = ?", c.GetUint("user_id")).Order("id").Find(&qs).Error; err != nil {
		fail(c, err)
		return
	}
	out := []gin.H{}
	for _, q := range qs {
		var n int64
		if err := h.db.Model(&models.ReservationQueue{}).Where("kind = ? AND item_id = ? AND status = ? AND id <= ?", q.Kind, q.ItemID, "waiting", q.ID).Count(&n).Error; err != nil {
			fail(c, err)
			return
		}
		ready := false
		start := day(time.Now())
		end := start.AddDate(0, 0, q.Days)
		if q.Status == "waiting" && n == 1 {
			if q.Kind == "book" {
				var b models.Book
				if h.db.First(&b, "book_id = ?", q.ItemID).Error == nil {
					row, err := bookDTO(h.db, b, start, end)
					if err != nil {
						fail(c, err)
						return
					}
					ready = row["status"] == "available"
				}
			} else {
				var e models.Equipmentborrow
				if h.db.First(&e, "equipment_id = ?", q.ItemID).Error == nil {
					row, err := equipmentDTO(h.db, e, start, end)
					if err != nil {
						fail(c, err)
						return
					}
					ready = row["status"] == "available"
				}
			}
		}
		var item any = q.ItemID
		if q.Kind == "book" {
			item, _ = strconv.Atoi(q.ItemID)
		}
		out = append(out, gin.H{"ID": q.ID, "kind": q.Kind, "item_id": item, "title": q.Title, "days": q.Days, "status": q.Status, "position": n, "ready": ready})
	}
	utils.JSONSuccess(c, 200, out)
}
func (h *LibraryController) JoinQueue(c *gin.Context) {
	if c.GetString("role") != "member" {
		utils.JSONError(c, 403, "เฉพาะสมาชิก", "")
		return
	}
	var p struct {
		Kind string          `json:"kind"`
		Item json.RawMessage `json:"item_id"`
		Days int             `json:"days"`
	}
	if c.ShouldBindJSON(&p) != nil || p.Days < 1 || p.Days > 30 || (p.Kind != "book" && p.Kind != "equipment") {
		utils.JSONError(c, 400, "ข้อมูลคิวไม่ถูกต้อง", "")
		return
	}
	id := rawID(p.Item)
	title := ""
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if p.Kind == "book" {
			var b models.Book
			if err := tx.First(&b, "book_id = ?", id).Error; err != nil {
				return err
			}
			title = b.Title
		} else {
			var e models.Equipmentborrow
			if err := tx.First(&e, "equipment_id = ?", id).Error; err != nil {
				return err
			}
			title = e.EquipmentName
		}
		return tx.Create(&models.ReservationQueue{UserID: c.GetUint("user_id"), Kind: p.Kind, ItemID: id, Days: p.Days, Title: title, Status: "waiting"}).Error
	})
	if err != nil {
		fail(c, errors.New("ไม่สามารถต่อคิวได้ หรือมีคิวนี้แล้ว"))
		return
	}
	utils.JSONSuccess(c, 201, gin.H{"status": "waiting"})
}
func (h *LibraryController) CancelQueue(c *gin.Context) {
	r := h.db.Model(&models.ReservationQueue{}).Where("id = ? AND user_id = ? AND status = ?", c.Param("id"), c.GetUint("user_id"), "waiting").Update("status", "cancelled")
	if r.Error != nil {
		fail(c, r.Error)
		return
	}
	if r.RowsAffected != 1 {
		utils.JSONError(c, 404, "ไม่พบคิวที่ยกเลิกได้", "")
		return
	}
	utils.JSONSuccess(c, 200, gin.H{"status": "cancelled"})
}
