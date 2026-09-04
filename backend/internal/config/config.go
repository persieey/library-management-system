package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost            string
	DBPort            string
	DBUser            string
	DBPassword        string
	DBName            string
	JWTSecret         string
	JWTExpiresIn      string
	ServerPort        string
	SeedAdminEmail    string
	SeedAdminPassword string
	SeedAdminName     string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		DBHost:            os.Getenv("DB_HOST"),
		DBPort:            os.Getenv("DB_PORT"),
		DBUser:            os.Getenv("DB_USER"),
		DBPassword:        os.Getenv("DB_PASSWORD"),
		DBName:            os.Getenv("DB_NAME"),
		JWTSecret:         os.Getenv("JWT_SECRET"),
		ServerPort:        os.Getenv("SERVER_PORT"),
		JWTExpiresIn:      os.Getenv("JWT_EXPIRES_IN"),
		SeedAdminEmail:    os.Getenv("SEED_ADMIN_EMAIL"),
		SeedAdminPassword: os.Getenv("SEED_ADMIN_PASSWORD"),
		SeedAdminName:     os.Getenv("SEED_ADMIN_NAME"),
	}
	if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBName == "" {
		return nil, fmt.Errorf("ใส่ค่าในไฟล์ .env ด้วยเพื่อน")
	}
	if cfg.JWTExpiresIn == "" {
		cfg.JWTExpiresIn = "24h"
	}
	if cfg.ServerPort == "" {
		cfg.ServerPort = "8080"
	}
	return cfg, nil
}
