package services

import (
	"gorm.io/gorm"
	"neuro-dev/models"
)

type ModelService struct {
	DB *gorm.DB
}

func NewModelService(db *gorm.DB) *ModelService {
	return &ModelService{
		DB: db,
	}
}

// GetModelByName retrieves a model by its name from the database
func (ms *ModelService) GetModelByName(name string) (*models.Model, error) {
	var modelData models.Model
	if err := ms.DB.Where("name = ?", name).First(&modelData).Error; err != nil {
		return nil, err
	}
	return &modelData, nil
}
