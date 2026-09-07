package dto

type CreateBookRequest struct {
	ISBN        string `json:"isbn"`
	Title       string `json:"title" binding:"required"`
	Author      string `json:"author" binding:"required"`
	Publisher   string `json:"publisher"`
	Category    string `json:"category"`
	CallNumber  string `json:"call_number"`
	Description string `json:"description"`
}

type UpdateBookRequest struct {
	ISBN        *string `json:"isbn"`
	Title       *string `json:"title"`
	Author      *string `json:"author"`
	Publisher   *string `json:"publisher"`
	CoverPath   *string `json:"cover_path"`
	Category    *string `json:"category"`
	CallNumber  *string `json:"call_number"`
	Description *string `json:"description"`
}

type CreateBookCopyRequest struct {
	BookID     uint   `json:"book_id" binding:"required"`
	CopyNumber int    `json:"copy_number" binding:"required,min=1"`
	Building   string `json:"building"`
	Slot       string `json:"slot"`
}

type UpdateBookCopyRequest struct {
	CopyNumber      *int    `json:"copy_number"`
	Building        *string `json:"building"`
	Slot            *string `json:"slot"`
	ConditionStatus *string `json:"condition_status"`
}
