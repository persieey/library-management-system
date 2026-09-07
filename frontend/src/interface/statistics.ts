export interface PeakHourBar {
  range: string;
  visitors: number;
}

export interface SummaryStats {
  total_visitors: number;
  peak_hours: string;
  total_fines: number;
  peak_chart_data: PeakHourBar[];
}

export interface BookStat {
  book_id: number;
  title: string;
  category: string;
  borrow_count: number;
  rank_order: number;
}

export interface ReturnBreakdown {
  label: string;
  rate: number;
}

export interface ReturnStats {
  total_borrow_returns: number;
  on_time_rate: number;
  avg_overdue_days: number;
  breakdown: ReturnBreakdown[];
}

export interface RoomRow {
  room_number: string;
  room_type: string;
  total_bookings: number;
  total_hours: number;
  check_in_rate: number;
  cancellation_rate: number;
}

export interface RoomStats {
  total_bookings: number;
  check_in_rate: number;
  cancellation_rate: number;
  rooms: RoomRow[];
}

export interface KeywordRow {
  search_keyword: string;
  category: string;
  download_count: number;
}

export interface EbookStats {
  total_searches: number;
  total_downloads: number;
  no_result_rate: number;
  keywords: KeywordRow[];
}

export interface DeviceRow {
  name: string;
  count: number;
}

export interface EquipmentStats {
  total_rentals: number;
  intact_rate: number;
  damaged_rate: number;
  devices: DeviceRow[];
}
