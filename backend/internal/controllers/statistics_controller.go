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

	// นับเฉพาะ login ไม่รวม logout กัน 1 ครั้งที่มาใช้งานถูกนับซ้ำเป็น 2
	// (login กับ logout ต่างก็ถูกบันทึกไว้ใน record_centers ตอน AuthController.Login/Logout จริง)
	rcQuery := sc.DB.Model(&models.RecordCenter{}).Where("log_type = ?", "login")
	if hasFilter {
		rcQuery = rcQuery.Where("date >= ? AND date <= ?", from, to)
	}
	var rcCount int64
	rcQuery.Count(&rcCount)

	// Fine ของ B6731915 ผูกกับ borrow_id ไม่ใช่ return_id (ต่างจากตารางจำลองเดิม)
	// join ผ่าน borrow_id เดียวกันแทน ใช้ return_date ของ return_transactions กรองช่วงเวลาเหมือนเดิม
	fineQuery := sc.DB.Model(&models.Fine{})
	if hasFilter {
		fineQuery = fineQuery.Joins("JOIN return_transactions ON fines.borrow_id = return_transactions.borrow_id").
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
		WHERE log_type = 'login'
	`
	var slotStats []SlotStat
	if hasFilter {
		sc.DB.Raw(slotQuery+" AND date >= ? AND date <= ? GROUP BY slot", from, to).Scan(&slotStats)
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

	// borrow_transactions ของ B6731915 ผูกกับ reservation_id ไม่ใช่ book_id ตรง ๆ
	// ต้องไล่ผ่านสาย books -> book_copies -> reservations -> borrow_transactions
	// เพราะการยืมเล่มหนึ่งผูกกับ "เล่ม" (copy) ไม่ใช่ "ชื่อเรื่อง" (book) ตรง ๆ
	//
	// แต่พอคืนเล่มแบบชำรุด/หาย copy นั้นจะถูกลบออกจาก book_copies จริง ๆ (ย้ายไป book_problems
	// แทน — ดู library_controller.go transition()) การ join ผ่าน book_copies ตรง ๆ แบบเดิมเลย
	// หา reservation ของเล่มที่เพิ่งชำรุด/หายไม่เจอ ยอดยืมของเล่มนั้นเลยหายไปจากอันดับทันทีที่คืน
	// แก้โดยรวม mapping reservation -> book_id จากทั้งสองแหล่ง (book_copies ที่ยังอยู่ +
	// book_problems ที่ถูกย้ายไปแล้ว) เข้าด้วยกันก่อน แล้วค่อย join ต่อ
	var dbResults []Result
	query := sc.DB.Table("books").
		Select("books.book_id, books.title, books.category, COUNT(borrow_transactions.borrow_id) as borrow_count").
		Joins(`LEFT JOIN (
			SELECT book_copies.book_id AS book_id, reservations.reservation_id AS reservation_id
			FROM book_copies
			JOIN reservations ON reservations.copy_id = book_copies.copy_id
			UNION ALL
			SELECT book_problems.book_id AS book_id, book_problems.reservation_id AS reservation_id
			FROM book_problems
		) reservation_book ON reservation_book.book_id = books.book_id`)

	if hasFilter {
		query = query.Joins("LEFT JOIN borrow_transactions ON borrow_transactions.reservation_id = reservation_book.reservation_id AND borrow_transactions.borrow_date >= ? AND borrow_transactions.borrow_date <= ?", from, to)
	} else {
		query = query.Joins("LEFT JOIN borrow_transactions ON borrow_transactions.reservation_id = reservation_book.reservation_id")
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
		Joins("JOIN return_transactions ON fines.borrow_id = return_transactions.borrow_id")
	if hasFilter {
		fineQuery1 = fineQuery1.Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var overdue1to3 int64
	fineQuery1.Where("overdue_days >= 1 AND overdue_days <= 3").Count(&overdue1to3)

	fineQuery2 := sc.DB.Model(&models.Fine{}).
		Joins("JOIN return_transactions ON fines.borrow_id = return_transactions.borrow_id")
	if hasFilter {
		fineQuery2 = fineQuery2.Where("return_transactions.return_date >= ? AND return_transactions.return_date <= ?", from, to)
	}
	var overdueGt3 int64
	fineQuery2.Where("overdue_days > 3").Count(&overdueGt3)

	fineQuery3 := sc.DB.Model(&models.Fine{}).
		Joins("JOIN return_transactions ON fines.borrow_id = return_transactions.borrow_id")
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
//
// เดิมอ่านจาก stat_room_bookings/stat_rooms ซึ่งเป็นตารางจำลองแยกต่างหาก ไม่มีใครเขียนข้อมูลจริงลงไปเลย
// เปลี่ยนมาอ่านจาก room_bookings/rooms จริงของระบบจองห้องของ B6715588 แทน
// "Check-in" เดิม เทียบเท่าสถานะ confirmed/completed จริง (แปลว่าการจองไปถึงจริง ไม่ได้ถูกยกเลิก)
func (sc *StatisticsController) GetRoomStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	rbQuery := sc.DB.Model(&models.RoomBooking{})
	if hasFilter {
		rbQuery = rbQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
	}
	var totalBookings int64
	rbQuery.Count(&totalBookings)

	checkinQuery := sc.DB.Model(&models.RoomBooking{}).Where("status IN ?", []string{"confirmed", "completed"})
	if hasFilter {
		checkinQuery = checkinQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
	}
	var checkinCount int64
	checkinQuery.Count(&checkinCount)

	cancelQuery := sc.DB.Model(&models.RoomBooking{}).Where("status = ?", "cancelled")
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

	var rooms []models.Room
	sc.DB.Order("room_id ASC").Find(&rooms)

	roomList := make([]dto.RoomRow, 0)
	for _, r := range rooms {
		rQuery := sc.DB.Model(&models.RoomBooking{}).Where("room_id = ?", r.RoomID)
		if hasFilter {
			rQuery = rQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rTotal int64
		rQuery.Count(&rTotal)

		rCheckQuery := sc.DB.Model(&models.RoomBooking{}).Where("room_id = ? AND status IN ?", r.RoomID, []string{"confirmed", "completed"})
		if hasFilter {
			rCheckQuery = rCheckQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rCheckin int64
		rCheckQuery.Count(&rCheckin)

		rCancelQuery := sc.DB.Model(&models.RoomBooking{}).Where("room_id = ? AND status = ?", r.RoomID, "cancelled")
		if hasFilter {
			rCancelQuery = rCancelQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		var rCancel int64
		rCancelQuery.Count(&rCancel)

		// ชั่วโมงรวมจริงจากผลต่างเวลาเริ่ม/สิ้นสุดของแต่ละการจอง แทนการคูณ 2 ชม.ต่อครั้งแบบเดิม
		var rHours float64
		hQuery := sc.DB.Model(&models.RoomBooking{}).Where("room_id = ?", r.RoomID)
		if hasFilter {
			hQuery = hQuery.Where("start_date_time >= ? AND start_date_time <= ?", from, to)
		}
		hQuery.Select("COALESCE(SUM(EXTRACT(EPOCH FROM (end_date_time - start_date_time)) / 3600.0), 0)").Scan(&rHours)

		rCheckRate := 0.0
		rCancelRate := 0.0
		if rTotal > 0 {
			rCheckRate = utils.Round(float64(rCheckin)/float64(rTotal)*100.0, 1)
			rCancelRate = utils.Round(float64(rCancel)/float64(rTotal)*100.0, 1)
		}

		roomList = append(roomList, dto.RoomRow{
			RoomNumber:       r.RoomName,
			RoomType:         r.RoomType,
			TotalBookings:    rTotal,
			TotalHours:       int64(rHours),
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

	// จำนวนการเข้าอ่านจริง — เดิมใช้ totalSearches ซ้ำ (ไม่มีอะไรนับตอนเปิดไฟล์จริงเลย)
	// ตอนนี้นับจาก ebook_open_logs ที่ GetFile บันทึกทุกครั้งที่มีคนเปิดไฟล์อ่านจริง
	opQuery := sc.DB.Model(&models.EbookOpenLog{})
	if hasFilter {
		opQuery = opQuery.Where("opened_at >= ? AND opened_at <= ?", from, to)
	}
	var totalOpens int64
	opQuery.Count(&totalOpens)

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
		TotalDownloads: totalOpens,
		NoResultRate:   0.0,
		Keywords:       keywords,
	})
}

// GetEquipmentStats สถิติการยืม-คืนอุปกรณ์
//
// เดิมอ่านจาก equipment_rentals/stat_equipment ซึ่งเป็นตารางจำลองแยกต่างหาก ไม่มีใครเขียนข้อมูลจริงลงไปเลย
// เปลี่ยนมาอ่านจากการจอง-ยืมอุปกรณ์จริงของระบบยืม-คืนของ B6731915 แทน (reservations + borrow_transactions)
// ระบุว่า reservation ไหนเป็น "อุปกรณ์" ด้วย copy_id IS NULL แทนที่จะเช็ค equipment_id ตรง ๆ เพราะ
// equipment_id ของ reservation จะถูกเคลียร์เป็น NULL ตอนคืนแบบชำรุด/หาย (ของถูกย้ายไป equipment_problems)
// แต่ copy_id ไม่เคยถูกตั้งค่าตั้งแต่แรกสำหรับอุปกรณ์อยู่แล้ว จึงใช้แยกประเภทได้แน่นอนกว่า
func (sc *StatisticsController) GetEquipmentStats(c *gin.Context) {
	from, to, hasFilter := utils.ParseDateRange(c)

	fromBase := `FROM borrow_transactions bt JOIN reservations r ON r.reservation_id = bt.reservation_id AND r.copy_id IS NULL`

	var totalRentals int64
	if hasFilter {
		sc.DB.Raw("SELECT COUNT(*) "+fromBase+" WHERE bt.borrow_date >= ? AND bt.borrow_date <= ?", from, to).Scan(&totalRentals)
	} else {
		sc.DB.Raw("SELECT COUNT(*) " + fromBase).Scan(&totalRentals)
	}

	// สภาพตอนคืนเก็บในคอลัมน์เดียวกับหนังสือ (book_condition) เพราะ endpoint คืนของใช้ร่วมกันทั้งสองประเภท
	dmgFrom := fromBase + ` JOIN return_transactions rt ON rt.borrow_id = bt.borrow_id AND rt.book_condition IN ('damaged', 'lost')`
	var damagedCount int64
	if hasFilter {
		sc.DB.Raw("SELECT COUNT(*) "+dmgFrom+" WHERE bt.borrow_date >= ? AND bt.borrow_date <= ?", from, to).Scan(&damagedCount)
	} else {
		sc.DB.Raw("SELECT COUNT(*) " + dmgFrom).Scan(&damagedCount)
	}

	var intactRate, damagedRate float64
	if totalRentals > 0 {
		damagedRate = utils.Round(float64(damagedCount)/float64(totalRentals)*100.0, 1)
		intactRate = utils.Round(100.0-damagedRate, 1)
	} else {
		intactRate = 100.0
	}

	// ชื่ออุปกรณ์ดึงจาก equipment_items ก่อน ถ้าไม่เจอ (ถูกย้ายไปเพราะชำรุด/หาย) ไปเอาจาก equipment_problems แทน
	devSelect := `SELECT COALESCE(ei.equipment_name, ep.equipment_name, 'ไม่ทราบชื่อ') AS name, COUNT(*) AS count `
	devFrom := fromBase + `
		LEFT JOIN equipment_items ei ON ei.equipment_id = r.equipment_id
		LEFT JOIN equipment_problems ep ON ep.reservation_id = r.reservation_id
	`
	var dbDevices []dto.DeviceRow
	if hasFilter {
		sc.DB.Raw(devSelect+devFrom+" WHERE bt.borrow_date >= ? AND bt.borrow_date <= ? GROUP BY name ORDER BY count DESC", from, to).Scan(&dbDevices)
	} else {
		sc.DB.Raw(devSelect + devFrom + " GROUP BY name ORDER BY count DESC").Scan(&dbDevices)
	}

	c.JSON(http.StatusOK, dto.EquipmentStatsResponse{
		TotalRentals: totalRentals,
		IntactRate:   intactRate,
		DamagedRate:  damagedRate,
		Devices:      dbDevices,
	})
}
