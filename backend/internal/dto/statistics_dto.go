package dto

type PeakHourBar struct {
	Range    string `json:"range"`
	Visitors int    `json:"visitors"`
}

type SummaryStatsResponse struct {
	TotalVisitors int64         `json:"total_visitors"`
	PeakHours     string        `json:"peak_hours"`
	TotalFines    float64       `json:"total_fines"`
	PeakChartData []PeakHourBar `json:"peak_chart_data"`
}

type BookStatResponse struct {
	BookID      string `json:"book_id"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	BorrowCount int64  `json:"borrow_count"`
	RankOrder   int    `json:"rank_order"`
}

type ReturnBreakdown struct {
	Label string  `json:"label"`
	Rate  float64 `json:"rate"`
}

type ReturnStatsResponse struct {
	TotalBorrowReturns int64             `json:"total_borrow_returns"`
	OnTimeRate         float64           `json:"on_time_rate"`
	AvgOverdueDays     float64           `json:"avg_overdue_days"`
	Breakdown          []ReturnBreakdown `json:"breakdown"`
}

type RoomRow struct {
	RoomNumber       string  `json:"room_number"`
	RoomType         string  `json:"room_type"`
	TotalBookings    int64   `json:"total_bookings"`
	TotalHours       int64   `json:"total_hours"`
	CheckInRate      float64 `json:"check_in_rate"`
	CancellationRate float64 `json:"cancellation_rate"`
}

type RoomStatsResponse struct {
	TotalBookings    int64     `json:"total_bookings"`
	CheckInRate      float64   `json:"check_in_rate"`
	CancellationRate float64   `json:"cancellation_rate"`
	Rooms            []RoomRow `json:"rooms"`
}

type KeywordRow struct {
	SearchKeyword string `json:"search_keyword"`
	Category      string `json:"category"`
	DownloadCount int64  `json:"download_count"`
}

type EbookStatsResponse struct {
	TotalSearches  int64        `json:"total_searches"`
	TotalDownloads int64        `json:"total_downloads"`
	NoResultRate   float64      `json:"no_result_rate"`
	Keywords       []KeywordRow `json:"keywords"`
}

type DeviceRow struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type EquipmentStatsResponse struct {
	TotalRentals int64       `json:"total_rentals"`
	IntactRate   float64     `json:"intact_rate"`
	DamagedRate  float64     `json:"damaged_rate"`
	Devices      []DeviceRow `json:"devices"`
}
