package models

import "time"

type Room struct {
	RoomID   uint   `gorm:"primaryKey" json:"room_id"`
	RoomName string `gorm:"not null" json:"room_name"`
	RoomType string `gorm:"not null;default:individual" json:"room_type"`
	Building string `json:"building"`
	Floor    string `json:"floor"`
	Capacity int    `json:"capacity"`
	Status   string `gorm:"default:available" json:"status"`
}

type RoomBooking struct {
	RoomBookingID uint      `gorm:"primaryKey" json:"room_booking_id"`
	UserID        uint      `gorm:"not null" json:"user_id"`
	User          User      `gorm:"foreignKey:UserID;references:UserID" json:"user"`
	RoomID        uint      `gorm:"not null" json:"room_id"`
	Room          Room      `gorm:"foreignKey:RoomID;references:RoomID" json:"room"`
	BookingType   string    `json:"booking_type"`
	StartDateTime time.Time `json:"start_datetime"`
	EndDateTime   time.Time `json:"end_datetime"`
	Status        string    `gorm:"default:pending" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
