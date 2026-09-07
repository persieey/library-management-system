package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/dto"
	"github.com/SA-1-69/T09/backend/internal/models"
	"github.com/SA-1-69/T09/backend/internal/utils"
)

type StatisticsController struct {
	DB *gorm.DB
}

func NewStatisticsController(db *gorm.DB) *StatisticsController {
	return &StatisticsController{DB: db}
}

// GetSummaryStats สถิติภาพรวม Dashboard
func (sc *StatisticsController) GetSummaryStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	rcQuery := sc.DB.Model(&models.RecordCenter{})
	if hasFilter {
		rcQuery = rcQuery.Where("date >= ? AND date <= ?", from, to)
	}
	var rcCount int64
	rcQuery.Count(&rcCount)

	fineQuery := sc.DB.Model(&models.Fine{})
	if hasFilter {
		fineQuery = fineQuery.Joins("JOIN return_transactions ON fines.return_id = return_transactions.return_id").
			Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var totalFines float64
	fineQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalFines)

	// Live query for peak hours distribution from record_centers
	type SlotStat struct {
		Slot  string
		Count int
	}

	slotQuery := `
		SELECT 
			CASE 
				WHEN EXTRACT(HOUR FROM date) >= 8 AND EXTRACT(HOUR FROM date) < 10 THEN '08.00-10.00'
				WHEN EXTRACT(HOUR FROM date) >= 10 AND EXTRACT(HOUR FROM date) < 12 THEN '10.00-12.00'
				WHEN EXTRACT(HOUR FROM date) >= 12 AND EXTRACT(HOUR FROM date) < 14 THEN '12.00-14.00'
				WHEN EXTRACT(HOUR FROM date) >= 14 AND EXTRACT(HOUR FROM date) < 16 THEN '14.00-16.00'
				ELSE '16.00-18.00'
			END AS slot,
			COUNT(*) AS count
		FROM record_centers
	`
	var slotStats []SlotStat
	if hasFilter {
		sc.DB.Raw(slotQuery+" WHERE date >= ? AND date <= ? GROUP BY slot", from, to).Scan(&slotStats)
	} else {
		sc.DB.Raw(slotQuery+" GROUP BY slot").Scan(&slotStats)
	}

	slotMap := map[string]int{
		"08.00-10.00": 0,
		"10.00-12.00": 0,
		"12.00-14.00": 0,
		"14.00-16.00": 0,
		"16.00-18.00": 0,
	}
	for _, s := range slotStats {
		slotMap[s.Slot] = s.Count
	}

	slotsOrder := []string{"08.00-10.00", "10.00-12.00", "12.00-14.00", "14.00-16.00", "16.00-18.00"}
	peakBars := make([]dto.PeakHourBar, 0, len(slotsOrder))
	maxSlot := "08.00-10.00"
	maxCount := -1

	for _, sl := range slotsOrder {
		cVal := slotMap[sl]
		if cVal > maxCount {
			maxCount = cVal
			maxSlot = sl
		}
		peakBars = append(peakBars, dto.PeakHourBar{
			Range:    sl,
			Visitors: cVal,
		})
	}

	peakHoursStr := "08:00-10:00 น."
	if maxCount > 0 {
		peakHoursStr = strings.ReplaceAll(maxSlot, ".", ":") + " น."
	}

	c.JSON(http.StatusOK, dto.SummaryStatsResponse{
		TotalVisitors: rcCount,
		PeakHours:     peakHoursStr,
		TotalFines:    totalFines,
		PeakChartData: peakBars,
	})
}

// GetBookStats สถิติหนังสือยอดนิยม 10 อันดับ
func (sc *StatisticsController) GetBookStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	type Result struct {
		BookID      uint
		Title       string
		Category    string
		BorrowCount int64
	}

	var dbResults []Result
	query := sc.DB.Table("books").
		Select("books.book_id, books.title, books.category, COUNT(borrow_transactions.borrow_id) as borrow_count")

	if hasFilter {
		query = query.Joins("LEFT JOIN borrow_transactions ON books.book_id = borrow_transactions.book_id AND borrow_transactions.borrow_date >= ? AND borrow_transactions.borrow_date <= ?", from, to)
	} else {
		query = query.Joins("LEFT JOIN borrow_transactions ON books.book_id = borrow_transactions.book_id")
	}

	query.Group("books.book_id, books.title, books.category").
		Order("borrow_count DESC, books.book_id ASC").
		Limit(10).
		Scan(&dbResults)

	results := make([]dto.BookStatResponse, 0)
	for idx, r := range dbResults {
		results = append(results, dto.BookStatResponse{
			BookID:      r.BookID,
			Title:       r.Title,
			Category:    r.Category,
			BorrowCount: r.BorrowCount,
			RankOrder:   idx + 1,
		})
	}

	c.JSON(http.StatusOK, results)
}

// GetReturnStats สถิติการคืนหนังสือ
func (sc *StatisticsController) GetReturnStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	retQuery := sc.DB.Model(&models.ReturnTransaction{})
	if hasFilter {
		retQuery = retQuery.Where("return_date >= ? AND return_date <= ?", from, to)
	}
	var totalReturns int64
	retQuery.Count(&totalReturns)

	fineQuery1 := sc.DB.Model(&models.Fine{}).
		Joins("JOIN return_transactions ON fines.return_id = return_transactions.return_id")
	if hasFilter {
		fineQuery1 = fineQuery1.Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var overdue1to3 int64
	fineQuery1.Where("overdue_days >= 1 AND overdue_days <= 3").Count(&overdue1to3)

	fineQuery2 := sc.DB.Model(&models.Fine{}).
		Joins("JOIN return_transactions ON fines.return_id = return_transactions.return_id")
	if hasFilter {
		fineQuery2 = fineQuery2.Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var overdueGt3 int64
	fineQuery2.Where("overdue_days > 3").Count(&overdueGt3)

	fineQuery3 := sc.DB.Model(&models.Fine{}).
		Joins("JOIN return_transactions ON fines.return_id = return_transactions.return_id")
	if hasFilter {
		fineQuery3 = fineQuery3.Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var avgOverdue float64
	fineQuery3.Select("COALESCE(AVG(overdue_days), 0)").Scan(&avgOverdue)

	onTimeCount := totalReturns - (overdue1to3 + overdueGt3)
	if onTimeCount < 0 {
		onTimeCount = 0
	}

	var onTimeRate, rate1to3, rateGt3 float64
	if totalReturns > 0 {
		onTimeRate = utils.Round(float64(onTimeCount)/float64(totalReturns)*100.0, 1)
		rate1to3 = utils.Round(float64(overdue1to3)/float64(totalReturns)*100.0, 1)
		rateGt3 = utils.Round(float64(overdueGt3)/float64(totalReturns)*100.0, 1)
	} else {
		onTimeRate = 100.0
	}

	c.JSON(http.StatusOK, dto.ReturnStatsResponse{
		TotalBorrowReturns: totalReturns,
		OnTimeRate:         onTimeRate,
		AvgOverdueDays:     utils.Round(avgOverdue, 1),
		Breakdown: []dto.ReturnBreakdown{
			{Label: "คืนก่อน/ตรงกำหนด", Rate: onTimeRate},
			{Label: "เกินกำหนด 1-3 วัน", Rate: rate1to3},
			{Label: "เกินกำหนด > 3 วัน", Rate: rateGt3},
		},
	})
}

// GetRoomStats สถิติห้องศึกษา
func (sc *StatisticsController) GetRoomStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	rbQuery := sc.DB.Model(&models.StatRoomBooking{})
	if hasFilter {
		rbQuery = rbQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
	}
	var totalBookings int64
	rbQuery.Count(&totalBookings)

	checkinQuery := sc.DB.Model(&models.StatRoomBooking{}).Where("status = ?", "Check-in")
	if hasFilter {
		checkinQuery = checkinQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
	}
	var checkinCount int64
	checkinQuery.Count(&checkinCount)

	cancelQuery := sc.DB.Model(&models.StatRoomBooking{}).Where("status = ?", "Cancelled")
	if hasFilter {
		cancelQuery = cancelQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
	}
	var cancelCount int64
	cancelQuery.Count(&cancelCount)

	var checkInRate, cancellationRate float64
	if totalBookings > 0 {
		checkInRate = utils.Round(float64(checkinCount)/float64(totalBookings)*100.0, 1)
		cancellationRate = utils.Round(float64(cancelCount)/float64(totalBookings)*100.0, 1)
	}

	var rooms []models.StatRoom
	sc.DB.Order("room_id ASC").Find(&rooms)

	roomList := make([]dto.RoomRow, 0)
	for _, r := range rooms {
		rQuery := sc.DB.Model(&models.StatRoomBooking{}).Where("room_id = ?", r.RoomID)
		if hasFilter {
			rQuery = rQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rTotal int64
		rQuery.Count(&rTotal)

		rCheckQuery := sc.DB.Model(&models.StatRoomBooking{}).Where("room_id = ? AND status = ?", r.RoomID, "Check-in")
		if hasFilter {
			rCheckQuery = rCheckQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rCheckin int64
		rCheckQuery.Count(&rCheckin)

		rCancelQuery := sc.DB.Model(&models.StatRoomBooking{}).Where("room_id = ? AND status = ?", r.RoomID, "Cancelled")
		if hasFilter {
			rCancelQuery = rCancelQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rCancel int64
		rCancelQuery.Count(&rCancel)

		rCheckRate := 0.0
		rCancelRate := 0.0
		if rTotal > 0 {
			rCheckRate = utils.Round(float64(rCheckin)/float64(rTotal)*100.0, 1)
			rCancelRate = utils.Round(float64(rCancel)/float64(rTotal)*100.0, 1)
		}

		roomList = append(roomList, dto.RoomRow{
			RoomNumber:       r.RoomName,
			RoomType:         r.Capacity,
			TotalBookings:    rTotal,
			TotalHours:       rTotal * 2,
			CheckInRate:      rCheckRate,
			CancellationRate: rCancelRate,
		})
	}

	c.JSON(http.StatusOK, dto.RoomStatsResponse{
		TotalBookings:    totalBookings,
		CheckInRate:      checkInRate,
		CancellationRate: cancellationRate,
		Rooms:            roomList,
	})
}

// GetEbookStats สถิติการค้นหา E-Book
func (sc *StatisticsController) GetEbookStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	ebQuery := sc.DB.Model(&models.EbookSearchLog{})
	if hasFilter {
		ebQuery = ebQuery.Where("search_timestamp >= ? AND search_timestamp <= ?", from, to)
	}
	var totalSearches int64
	ebQuery.Count(&totalSearches)

	type DBKeyword struct {
		SearchKeyword string
		Count         int64
	}

	var dbKeywords []DBKeyword
	kwQuery := sc.DB.Table("ebook_search_logs").
		Select("search_keyword, COUNT(*) as count")
	if hasFilter {
		kwQuery = kwQuery.Where("search_timestamp >= ? AND search_timestamp <= ?", from, to)
	}
	kwQuery.Group("search_keyword").Order("count DESC").Scan(&dbKeywords)

	categoryMap := map[string]string{
		"Machine Learning":      "วิทยาการคอมพิวเตอร์",
		"แคลคูลัส 2":            "คณิตศาสตร์",
		"Financial Accounting":  "บริหารธุรกิจ",
		"Python for beginners": "วิทยาการคอมพิวเตอร์",
		"กายวิภาคศาสตร์":        "แพทยศาสตร์",
		"Digital Marketing":     "การตลาดดิจิทัล",
		"Data Structures":       "วิทยาการคอมพิวเตอร์",
	}

	keywords := make([]dto.KeywordRow, 0)
	for _, kw := range dbKeywords {
		cat := "ทั่วไป"
		if val, exists := categoryMap[kw.SearchKeyword]; exists {
			cat = val
		}
		keywords = append(keywords, dto.KeywordRow{
			SearchKeyword: kw.SearchKeyword,
			Category:      cat,
			DownloadCount: kw.Count,
		})
	}

	c.JSON(http.StatusOK, dto.EbookStatsResponse{
		TotalSearches:  totalSearches,
		TotalDownloads: totalSearches,
		NoResultRate:   0.0,
		Keywords:       keywords,
	})
}

// GetEquipmentStats สถิติการยืม-คืนอุปกรณ์
func (sc *StatisticsController) GetEquipmentStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	eqQuery := sc.DB.Model(&models.EquipmentRental{})
	if hasFilter {
		eqQuery = eqQuery.Where("rent_date >= ? AND rent_date <= ?", from, to)
	}
	var totalRentals int64
	eqQuery.Count(&totalRentals)

	dmgQuery := sc.DB.Model(&models.EquipmentRental{}).Where("return_status = ? OR return_status = ?", "ชำรุด", "Damaged")
	if hasFilter {
		dmgQuery = dmgQuery.Where("rent_date >= ? AND rent_date <= ?", from, to)
	}
	var damagedCount int64
	dmgQuery.Count(&damagedCount)

	var intactRate, damagedRate float64
	if totalRentals > 0 {
		damagedRate = utils.Round(float64(damagedCount)/float64(totalRentals)*100.0, 1)
		intactRate = utils.Round(100.0-damagedRate, 1)
	} else {
		intactRate = 100.0
	}

	var dbDevices []dto.DeviceRow
	devQuery := sc.DB.Table("equipment_rentals").
		Select("COALESCE(stat_equipment.equipment_name, equipment_rentals.equipment_id) as name, COUNT(equipment_rentals.rental_id) as count").
		Joins("LEFT JOIN stat_equipment ON equipment_rentals.equipment_id = stat_equipment.equipment_id")
	if hasFilter {
		devQuery = devQuery.Where("equipment_rentals.rent_date >= ? AND equipment_rentals.rent_date <= ?", from, to)
	}
	devQuery.Group("COALESCE(stat_equipment.equipment_name, equipment_rentals.equipment_id)").
		Order("count DESC").
		Scan(&dbDevices)

	c.JSON(http.StatusOK, dto.EquipmentStatsResponse{
		TotalRentals: totalRentals,
		IntactRate:   intactRate,
		DamagedRate:  damagedRate,
		Devices:      dbDevices,
	})
}
