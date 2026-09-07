package config

import (
	"log"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// defaultRooms is the canonical room list. Adding a room here and
// redeploying is enough — SeedRooms only inserts rooms that don't already
// exist (matched by name), so it's safe to run on every server start.
var defaultRooms = []models.Room{
	{RoomName: "Room A1", RoomType: "individual", Building: "Main Library", Floor: "1", Capacity: 1, Status: "available"},
	{RoomName: "Room A2", RoomType: "individual", Building: "Main Library", Floor: "1", Capacity: 1, Status: "available"},
	{RoomName: "Room A3", RoomType: "individual", Building: "Main Library", Floor: "1", Capacity: 1, Status: "available"},
	{RoomName: "Room A4", RoomType: "individual", Building: "Main Library", Floor: "1", Capacity: 1, Status: "available"},
	{RoomName: "Room A5", RoomType: "individual", Building: "Main Library", Floor: "2", Capacity: 1, Status: "available"},
	{RoomName: "Room A6", RoomType: "individual", Building: "Main Library", Floor: "2", Capacity: 1, Status: "available"},
	{RoomName: "Room A7", RoomType: "individual", Building: "Main Library", Floor: "2", Capacity: 1, Status: "available"},
	{RoomName: "Room A8", RoomType: "individual", Building: "Main Library", Floor: "2", Capacity: 1, Status: "available"},
	{RoomName: "Room B1", RoomType: "group", Building: "Main Library", Floor: "2", Capacity: 8, Status: "available"},
	{RoomName: "Room B2", RoomType: "group", Building: "Main Library", Floor: "2", Capacity: 8, Status: "available"},
	{RoomName: "Room B3", RoomType: "group", Building: "Main Library", Floor: "3", Capacity: 8, Status: "available"},
	{RoomName: "Room B4", RoomType: "group", Building: "Main Library", Floor: "3", Capacity: 8, Status: "available"},
}

func SeedRooms(db *gorm.DB) error {
	for _, room := range defaultRooms {
		var count int64
		if err := db.Model(&models.Room{}).Where("room_name = ?", room.RoomName).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue // already exists — leave it alone (don't overwrite manual edits)
		}
		if err := db.Create(&room).Error; err != nil {
			return err
		}
		log.Printf("seeded room: %s", room.RoomName)
	}
	return nil
}