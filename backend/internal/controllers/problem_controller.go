package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

// ProblemController exposes the staff-only quarantine records separately
// from the active catalogues.
type ProblemController struct{ db *gorm.DB }

func NewProblemController(db *gorm.DB) *ProblemController { return &ProblemController{db: db} }

func (pc *ProblemController) BookProblems(c *gin.Context) {
	var filter dto.ProblemFilterDTO
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.JSONError(c, 400, "ชนิดปัญหาไม่ถูกต้อง", "")
		return
	}
	q := pc.db.Order("moved_at DESC")
	if filter.Type != "" {
		q = q.Where("problem_type = ?", filter.Type)
	}
	var rows []models.BookProblem
	if err := q.Find(&rows).Error; err != nil {
		utils.JSONError(c, 500, "ไม่สามารถอ่านข้อมูลหนังสือปัญหา", "")
		return
	}
	utils.JSONSuccess(c, 200, rows)
}

func (pc *ProblemController) EquipmentProblems(c *gin.Context) {
	var filter dto.ProblemFilterDTO
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.JSONError(c, 400, "ชนิดปัญหาไม่ถูกต้อง", "")
		return
	}
	q := pc.db.Order("moved_at DESC")
	if filter.Type != "" {
		q = q.Where("problem_type = ?", filter.Type)
	}
	var rows []models.EquipmentProblem
	if err := q.Find(&rows).Error; err != nil {
		utils.JSONError(c, 500, "ไม่สามารถอ่านข้อมูลอุปกรณ์ปัญหา", "")
		return
	}
	utils.JSONSuccess(c, 200, rows)
}
