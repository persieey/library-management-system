package dto

type CreateEbookRequest struct {
	ISBN        string `json:"isbn"`
	Title       string `json:"title" binding:"required"`
	Author      string `json:"author" binding:"required"`
	Publisher   string `json:"publisher"`
	Category    string `json:"category"`
	FileName    string `json:"file_name"`
	FileType    string `json:"file_type"`
	FilePath    string `json:"file_path"`
	CoverPath   string `json:"cover_path"`
	Description string `json:"description"`
}

type LogEbookSearchRequest struct {
	Keyword string `json:"keyword" binding:"required"`
}

type UpdateEbookRequest struct {
	ISBN        *string `json:"isbn"`
	Title       *string `json:"title"`
	Author      *string `json:"author"`
	Publisher   *string `json:"publisher"`
	Category    *string `json:"category"`
	CoverPath   *string `json:"cover_path"`
	Description *string `json:"description"`
	FileName    *string `json:"file_name"`
	FileType    *string `json:"file_type"`
	FilePath    *string `json:"file_path"`
}
