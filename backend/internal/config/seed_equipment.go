package config

import (
	"log"

	"gorm.io/gorm"

	"github.com/SA-1-69/T09/backend/internal/models"
)

// defaultEquipment is the canonical equipment list. Add a row here and
// redeploy — SeedEquipment only inserts equipment that doesn't already
// exist (matched by name), so it's safe to run on every server start.
var defaultEquipment = []models.Equipment{
	{Name: "Computer Service 01", Category: "Computer", Location: "1st floor", Status: "available"},
	{Name: "Computer Service 02", Category: "Computer", Location: "2nd floor", Status: "available"},
	{Name: "Computer Service 03", Category: "Computer", Location: "1st floor", Status: "available"},
	{Name: "Computer Service 04", Category: "Computer", Location: "2nd floor", Status: "available"},
	{Name: "Printer HP LaserJet", Category: "Printer", Location: "1st floor", Status: "available"},
	{Name: "Printer Epson L3250", Category: "Printer", Location: "1st floor", Status: "available"},
	{Name: "Book Scanner A", Category: "Scanner", Location: "1st floor", Status: "available"},
	{Name: "Book Scanner B", Category: "Scanner", Location: "1st floor", Status: "available"},
	{Name: "Epson Projector", Category: "Projector", Location: "2nd floor", Status: "available"},
	{Name: "BenQ Projector", Category: "Projector", Location: "1st floor", Status: "available"},
	{Name: `Smart TV 55"`, Category: "Display", Location: "2nd floor", Status: "available"},
	{Name: "Access Point #1", Category: "Network", Location: "2nd floor", Status: "available"},
	{Name: "Access Point #2", Category: "Network", Location: "1st floor", Status: "available"},
	{Name: "Access Point #3", Category: "Network", Location: "2nd floor", Status: "available"},
	{Name: "RFID Gate A", Category: "Security", Location: "1st floor", Status: "available"},
	{Name: "RFID Gate B", Category: "Security", Location: "1st floor", Status: "available"},
	{Name: "RFID Gate C", Category: "Security", Location: "2nd floor", Status: "available"},
	{Name: "Self Check Kiosk", Category: "Kiosk", Location: "1st floor", Status: "available"},
	{Name: "Self Check Kiosk 2", Category: "Kiosk", Location: "2nd floor", Status: "available"},
	{Name: "Air Conditioner Unit 1", Category: "Facility", Location: "3rd floor", Status: "available"},
}

func SeedEquipment(db *gorm.DB) error {
	for _, eq := range defaultEquipment {
		var count int64
		if err := db.Model(&models.Equipment{}).Where("name = ?", eq.Name).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue // already exists — leave it alone (don't overwrite manual edits)
		}
		if err := db.Create(&eq).Error; err != nil {
			return err
		}
		log.Printf("seeded equipment: %s", eq.Name)
	}
	return nil
}