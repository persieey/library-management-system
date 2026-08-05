package models

type PR struct {
    ID          int    `json:"id"`
    Title       string `json:"title"`
    Content     string `json:"content"`
    PublishedAt string `json:"published_at"`
    Author      string `json:"author"`
}