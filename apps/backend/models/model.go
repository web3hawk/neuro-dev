package models

import (
	"gorm.io/gorm"
	"time"
)

type Model struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"unique;not null"`
	BaseURL   string         `json:"base_url"`
	Token     string         `json:"token,omitempty"`
	IsCustom  bool           `json:"is_custom" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type CreateModelRequest struct {
	Name    string `json:"name" binding:"required"`
	BaseURL string `json:"base_url"`
	Token   string `json:"token"`
}

type UpdateModelRequest struct {
	Name    string `json:"name"`
	BaseURL string `json:"base_url"`
	Token   string `json:"token"`
}
