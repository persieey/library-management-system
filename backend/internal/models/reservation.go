package models

import "time"

type Reservation struct {
	ReservationId      string           `gorm:"primaryKey" json:"reservation_id"`
	ReserveDate        time.Time        `json:"reserve_date"`
	ExpireDate         time.Time        `json:"expire_date"`
	Status             string           `json:"status"`
	UserId             uint             `gorm:"not null;index" json:"user_id"`
	User               *User            `gorm:"belongsTo;foreignKey:UserId;references:UserID" json:"user,omitempty"`
	CopyID             *uint            `gorm:"index" json:"copy_id,omitempty"`
	Copy               *BookCopy        `gorm:"belongsTo;foreignKey:CopyID;references:CopyID" json:"copy,omitempty"`
	EquipmentID        *string          `gorm:"index" json:"equipment_id,omitempty"`
	Equipment          *Equipmentborrow `gorm:"belongsTo;foreignKey:EquipmentID;references:EquipmentId" json:"equipment,omitempty"`
	PickupDate         time.Time        `json:"pickup_date"`
	CancelledAt        *time.Time       `json:"cancelled_at"`
	CancellationReason string           `json:"cancellation_reason"`
}
