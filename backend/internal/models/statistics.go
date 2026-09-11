package models

import "time"

// StatRoom ข้อมูลห้องศึกษา (โดเมนสถิติ — คนละตารางกับระบบจองห้องของ B6715588)
type StatRoom struct {
	RoomID   string `gorm:"primaryKey;column:room_id;size:50" json:"room_id"`
	RoomName string `gorm:"column:room_name;size:100;not null" json:"room_name"`
	Building string `gorm:"column:building;size:50" json:"building"`
	Capacity string `gorm:"column:capacity;size:20" json:"capacity"`
}

func (StatRoom) TableName() string {
	return "stat_rooms"
}

// StatRoomBooking ข้อมูลการจองห้อง (โดเมนสถิติ)
type StatRoomBooking struct {
	BookingID     string    `gorm:"primaryKey;column:booking_id;size:50" json:"booking_id"`
	MemberID      *uint     `gorm:"column:member_id" json:"member_id"`
	RoomID        string    `gorm:"column:room_id;size:50;not null" json:"room_id"`
	BookingType   string    `gorm:"column:booking_type;size:50" json:"booking_type"`
	StartDateTime time.Time `gorm:"column:start_date_time;not null" json:"start_date_time"`
	EndDateTime   time.Time `gorm:"column:end_date_time;not null" json:"end_date_time"`
	Status        string    `gorm:"column:status;size:50;default:'Check-in'" json:"status"`

	Room   *StatRoom `gorm:"foreignKey:RoomID;references:RoomID" json:"room,omitempty"`
	Member *Member   `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (StatRoomBooking) TableName() string {
	return "stat_room_bookings"
}

// EbookSearchLog ประวัติการค้นหา E-Book
type EbookSearchLog struct {
	SearchLogID     string    `gorm:"primaryKey;column:search_log_id;size:50" json:"search_log_id"`
	MemberID        *uint     `gorm:"column:member_id" json:"member_id"`
	SearchKeyword   string    `gorm:"column:search_keyword;size:255;not null" json:"search_keyword"`
	SearchTimestamp time.Time `gorm:"column:search_timestamp;default:CURRENT_TIMESTAMP" json:"search_timestamp"`

	Member *Member `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (EbookSearchLog) TableName() string {
	return "ebook_search_logs"
}

// EbookOpenLog ประวัติการเปิดอ่านไฟล์ E-Book จริง — คนละอันกับ EbookSearchLog
// (search = พิมพ์ค้นหา, open = กดเปิดไฟล์อ่านจริง) บันทึกทุกครั้งที่มีการเรียก
// GetFile สำเร็จ ใช้คำนวณ "จำนวนการเข้าอ่าน" ในหน้ารายงานสถิติ
type EbookOpenLog struct {
	OpenLogID string    `gorm:"primaryKey;column:open_log_id;size:50" json:"open_log_id"`
	EbookID   uint      `gorm:"column:ebook_id;not null" json:"ebook_id"`
	MemberID  *uint     `gorm:"column:member_id" json:"member_id"`
	OpenedAt  time.Time `gorm:"column:opened_at;default:CURRENT_TIMESTAMP" json:"opened_at"`

	Ebook  *Ebook  `gorm:"foreignKey:EbookID;references:EbookID" json:"ebook,omitempty"`
	Member *Member `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (EbookOpenLog) TableName() string {
	return "ebook_open_logs"
}

// RecordCenter บันทึกการเข้าใช้งานห้องสมุด
type RecordCenter struct {
	RecordCenterID string    `gorm:"primaryKey;column:record_center_id;size:50" json:"record_center_id"`
	MemberID       *uint     `gorm:"column:member_id" json:"member_id"`
	Description    string    `gorm:"column:description;type:text" json:"description"`
	Date           time.Time `gorm:"column:date;default:CURRENT_DATE" json:"date"`
	LogType        string    `gorm:"column:log_type;size:50" json:"log_type"`
	Status         string    `gorm:"column:status;size:50;default:'Normal'" json:"status"`

	Member *Member `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (RecordCenter) TableName() string {
	return "record_centers"
}

// Book ของระบบสถิติเดิมเป็นตารางจำลอง มีแค่ 4 คอลัมน์ และ book_id เป็น string
// ตอนนี้ระบบจัดการหนังสือของ B6729615 เข้ามาแล้ว จึงใช้ models.Book ตัวจริงใน book.go แทน
// (ตาราง books เดียวกัน แต่ book_id เป็น uint)

// BorrowTransaction / ReturnTransaction / Fine ของระบบสถิติเดิมเป็นตารางจำลอง
// ผูกกับหนังสือตรง ๆ (book_id, member_id) ไม่มีเรื่องการจอง
// ตอนนี้ระบบยืม-คืนจริงของ B6731915 (สุชาดา) เข้ามาแล้ว จึงใช้ของจริงใน
// borrow_transaction.go / return_transaction.go / fine.go แทน
// สายข้อมูลเปลี่ยนจาก "หนังสือ -> ยืม" ตรง ๆ เป็น "หนังสือ -> เล่ม -> การจอง -> ยืม"
// เพราะยืมได้ทั้งหนังสือและอุปกรณ์ผ่านการจองร่วมกัน — ดู statistics_controller.go
// ที่ join ผ่าน book_copies + reservations แทนที่จะ join borrow_transactions ตรง ๆ

// StatEquipment แคตตาล็อกอุปกรณ์ (โดเมนสถิติ — คนละตารางกับระบบอุปกรณ์ของ B6715588)
type StatEquipment struct {
	EquipmentID   string `gorm:"primaryKey;column:equipment_id;size:50" json:"equipment_id"`
	EquipmentName string `gorm:"column:equipment_name;size:100;not null" json:"equipment_name"`
	Category      string `gorm:"column:category;size:100" json:"category"`
	Status        string `gorm:"column:status;size:50;default:'พร้อมใช้งาน'" json:"status"`
}

func (StatEquipment) TableName() string {
	return "stat_equipment"
}

// EquipmentRental การยืม-คืนอุปกรณ์
type EquipmentRental struct {
	RentalID     string    `gorm:"primaryKey;column:rental_id;size:50" json:"rental_id"`
	MemberID     *uint     `gorm:"column:member_id" json:"member_id"`
	EquipmentID  string    `gorm:"column:equipment_id;size:50;not null" json:"equipment_id"`
	RentDate     time.Time `gorm:"column:rent_date;default:CURRENT_DATE" json:"rent_date"`
	ReturnDate   time.Time `gorm:"column:return_date" json:"return_date"`
	ReturnStatus string    `gorm:"column:return_status;size:50;default:'สมบูรณ์'" json:"return_status"`

	Equipment *StatEquipment `gorm:"foreignKey:EquipmentID;references:EquipmentID" json:"equipment,omitempty"`
	Member    *Member        `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (EquipmentRental) TableName() string {
	return "equipment_rentals"
}

