package dto

type CreateAssetDTO struct {
	Name      string `json:"name" binding:"required"`
	Type      string `json:"type" binding:"required"`
	Location  string `json:"location" binding:"required"`
	Condition string `json:"condition"`
	PrRef     string `json:"pr_ref"`
	SerialNo  string `json:"serial_no"`
	Notes     string `json:"notes"`
	Quantity  int    `json:"quantity"`
}
