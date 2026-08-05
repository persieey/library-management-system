package models

type Personnel struct {
    ID        int    `json:"id"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Position  string `json:"position"`
    Email     string `json:"email"`
    Phone     string `json:"phone"`
}