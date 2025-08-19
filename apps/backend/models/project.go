package models

import "time"

// Project represents a project entity
// GORM: use string ID as primary key
type Project struct {
	ID           string    `json:"id" gorm:"primaryKey;size:64"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Organization string    `json:"organization"`
	Model        string    `json:"model"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Progress     int       `json:"progress"`
	Tasks        []Task    `json:"tasks" gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
}
