package models

import "time"

// Room ข้อมูลห้องศึกษา
type Room struct {
	RoomID   string `gorm:"primaryKey;column:room_id;size:50" json:"room_id"`
	RoomName string `gorm:"column:room_name;size:100;not null" json:"room_name"`
	Building string `gorm:"column:building;size:50" json:"building"`
	Capacity string `gorm:"column:capacity;size:20" json:"capacity"`
}

func (Room) TableName() string {
	return "rooms"
}

// RoomBooking ข้อมูลการจองห้อง
type RoomBooking struct {
	BookingID     string    `gorm:"primaryKey;column:booking_id;size:50" json:"booking_id"`
	MemberID      *uint     `gorm:"column:member_id" json:"member_id"`
	RoomID        string    `gorm:"column:room_id;size:50;not null" json:"room_id"`
	BookingType   string    `gorm:"column:booking_type;size:50" json:"booking_type"`
	StartDateTime time.Time `gorm:"column:start_date_time;not null" json:"start_date_time"`
	EndDateTime   time.Time `gorm:"column:end_date_time;not null" json:"end_date_time"`
	Status        string    `gorm:"column:status;size:50;default:'Check-in'" json:"status"`

	Room   *Room   `gorm:"foreignKey:RoomID;references:RoomID" json:"room,omitempty"`
	Member *Member `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (RoomBooking) TableName() string {
	return "room_bookings"
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

// Book รายการหนังสือ
type Book struct {
	BookID   string `gorm:"primaryKey;column:book_id;size:50" json:"book_id"`
	Title    string `gorm:"column:title;size:255;not null" json:"title"`
	Category string `gorm:"column:category;size:100" json:"category"`
	Author   string `gorm:"column:author;size:100" json:"author"`
}

func (Book) TableName() string {
	return "books"
}

// BorrowTransaction การยืมหนังสือ
type BorrowTransaction struct {
	BorrowID   string    `gorm:"primaryKey;column:borrow_id;size:50" json:"borrow_id"`
	BookID     string    `gorm:"column:book_id;size:50;not null" json:"book_id"`
	MemberID   *uint     `gorm:"column:member_id" json:"member_id"`
	BorrowDate time.Time `gorm:"column:borrow_date;default:CURRENT_DATE" json:"borrow_date"`
	DueDate    time.Time `gorm:"column:due_date" json:"due_date"`
	Status     string    `gorm:"column:status;size:50;default:'Borrowed'" json:"status"`

	Book   *Book   `gorm:"foreignKey:BookID;references:BookID" json:"book,omitempty"`
	Member *Member `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (BorrowTransaction) TableName() string {
	return "borrow_transactions"
}

// ReturnTransaction การคืนหนังสือ
type ReturnTransaction struct {
	ReturnID      string    `gorm:"primaryKey;column:return_id;size:50" json:"return_id"`
	BorrowID      string    `gorm:"column:borrow_id;size:50;not null" json:"borrow_id"`
	ReturnDate    time.Time `gorm:"column:return_date;default:CURRENT_DATE" json:"return_date"`
	BookCondition string    `gorm:"column:book_condition;size:50;default:'สมบูรณ์'" json:"book_condition"`

	Borrow *BorrowTransaction `gorm:"foreignKey:BorrowID;references:BorrowID" json:"borrow,omitempty"`
}

func (ReturnTransaction) TableName() string {
	return "return_transactions"
}

// Fine ค่าปรับ
type Fine struct {
	FineID      string     `gorm:"primaryKey;column:fine_id;size:50" json:"fine_id"`
	ReturnID    string     `gorm:"column:return_id;size:50;not null" json:"return_id"`
	OverdueDays int        `gorm:"column:overdue_days;default:0" json:"overdue_days"`
	Amount      float64    `gorm:"column:amount;type:decimal(10,2);default:0.00" json:"amount"`
	PaidStatus  string     `gorm:"column:paid_status;size:50;default:'ค้างชำระ'" json:"paid_status"`
	PaidDate    *time.Time `gorm:"column:paid_date" json:"paid_date"`

	Return *ReturnTransaction `gorm:"foreignKey:ReturnID;references:ReturnID" json:"return,omitempty"`
}

func (Fine) TableName() string {
	return "fines"
}

// Equipment แคตตาล็อกอุปกรณ์
type Equipment struct {
	EquipmentID   string `gorm:"primaryKey;column:equipment_id;size:50" json:"equipment_id"`
	EquipmentName string `gorm:"column:equipment_name;size:100;not null" json:"equipment_name"`
	Category      string `gorm:"column:category;size:100" json:"category"`
	Status        string `gorm:"column:status;size:50;default:'พร้อมใช้งาน'" json:"status"`
}

func (Equipment) TableName() string {
	return "equipments"
}

// EquipmentRental การยืม-คืนอุปกรณ์
type EquipmentRental struct {
	RentalID     string    `gorm:"primaryKey;column:rental_id;size:50" json:"rental_id"`
	MemberID     *uint     `gorm:"column:member_id" json:"member_id"`
	EquipmentID  string    `gorm:"column:equipment_id;size:50;not null" json:"equipment_id"`
	RentDate     time.Time `gorm:"column:rent_date;default:CURRENT_DATE" json:"rent_date"`
	ReturnDate   time.Time `gorm:"column:return_date" json:"return_date"`
	ReturnStatus string    `gorm:"column:return_status;size:50;default:'สมบูรณ์'" json:"return_status"`

	Equipment *Equipment `gorm:"foreignKey:EquipmentID;references:EquipmentID" json:"equipment,omitempty"`
	Member    *Member    `gorm:"foreignKey:MemberID;references:MemberID" json:"member,omitempty"`
}

func (EquipmentRental) TableName() string {
	return "equipment_rentals"
}

