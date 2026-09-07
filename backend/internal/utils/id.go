package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func GenID(prefix string) string {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%s%d", prefix, 0)
	}
	return prefix + hex.EncodeToString(b)
}
