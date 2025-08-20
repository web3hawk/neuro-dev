package services

import (
	"gorm.io/gorm"
	"neuro-dev/models"
)

type Service struct {
	DB             *gorm.DB
	ModelService   *ModelService
	Projects       map[string]*models.Project
	Tasks          map[string]*models.Task
	projectCounter int
	taskCounter    int
}

func NewService(db *gorm.DB) *Service {
	return &Service{
		DB:           db,
		ModelService: NewModelService(db),
		Projects:     make(map[string]*models.Project),
		Tasks:        make(map[string]*models.Task),
	}
}
