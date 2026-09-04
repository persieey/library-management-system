package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTProvider struct {
	secret    []byte
	expiresIn time.Duration
}

func NewJWTProvider(secret string, expiresIn string) *JWTProvider {
	duration, err := time.ParseDuration(expiresIn)
	if err != nil {
		duration = 24 * time.Hour
	}
	return &JWTProvider{
		secret:    []byte(secret),
		expiresIn: duration,
	}
}

func (j *JWTProvider) GenerateToken(userID uint, role string, position string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"role":     role,
		"position": position,
		"exp":      time.Now().Add(j.expiresIn).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}

func (j *JWTProvider) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return j.secret, nil
	})
}