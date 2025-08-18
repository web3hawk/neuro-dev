package services

import (
	"neuro-dev/models"
)

type Service struct {
	Projects       map[string]*models.Project
	Tasks          map[string]*models.Task
	projectCounter int
	taskCounter    int
}

func NewService() *Service {
	return &Service{
		Projects: make(map[string]*models.Project),
		Tasks:    make(map[string]*models.Task),
	}
}
