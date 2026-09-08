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
	{Name: "Computer Service 01", Category: "คอมพิวเตอร์", Location: "ชั้น 1", Status: "available"},
	{Name: "Computer Service 02", Category: "คอมพิวเตอร์", Location: "ชั้น 2", Status: "available"},
	{Name: "Computer Service 03", Category: "คอมพิวเตอร์", Location: "ชั้น 1", Status: "available"},
	{Name: "Computer Service 04", Category: "คอมพิวเตอร์", Location: "ชั้น 2", Status: "available"},
	{Name: "Printer HP LaserJet", Category: "เครื่องพิมพ์", Location: "ชั้น 1", Status: "available"},
	{Name: "Printer Epson L3250", Category: "เครื่องพิมพ์", Location: "ชั้น 1", Status: "available"},
	{Name: "Book Scanner A", Category: "เครื่องสแกน", Location: "ชั้น 1", Status: "available"},
	{Name: "Book Scanner B", Category: "เครื่องสแกน", Location: "ชั้น 1", Status: "available"},
	{Name: "Epson Projector", Category: "โปรเจกเตอร์", Location: "ชั้น 2", Status: "available"},
	{Name: "BenQ Projector", Category: "โปรเจกเตอร์", Location: "ชั้น 1", Status: "available"},
	{Name: `Smart TV 55"`, Category: "จอแสดงผล", Location: "ชั้น 2", Status: "available"},
	{Name: "Access Point #1", Category: "เครือข่าย", Location: "ชั้น 2", Status: "available"},
	{Name: "Access Point #2", Category: "เครือข่าย", Location: "ชั้น 1", Status: "available"},
	{Name: "Access Point #3", Category: "เครือข่าย", Location: "ชั้น 2", Status: "available"},
	{Name: "RFID Gate A", Category: "ระบบรักษาความปลอดภัย", Location: "ชั้น 1", Status: "available"},
	{Name: "RFID Gate B", Category: "ระบบรักษาความปลอดภัย", Location: "ชั้น 1", Status: "available"},
	{Name: "RFID Gate C", Category: "ระบบรักษาความปลอดภัย", Location: "ชั้น 2", Status: "available"},
	{Name: "Self Check Kiosk", Category: "ตู้บริการตนเอง", Location: "ชั้น 1", Status: "available"},
	{Name: "Self Check Kiosk 2", Category: "ตู้บริการตนเอง", Location: "ชั้น 2", Status: "available"},
	{Name: "Air Conditioner Unit 1", Category: "สิ่งอำนวยความสะดวก", Location: "ชั้น 3", Status: "available"},
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