package controllers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"


	"github.com/gorilla/mux"
	"neuro-dev/models"
)

// Config-related handlers
func (s *Server) getCompanies(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{"Default", "Art", "Human"})
}

func (s *Server) getPhases(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, []string{
		"DemandAnalysis",
		"LanguageChoose",
		"Coding",
		"ArtDesign",
		"ArtIntegration",
		"CodeComplete",
		"CodeReviewComment",
		"CodeReviewModification",
		"TestErrorSummary",
		"TestModification",
	})
}

// getRoles reads RoleConfig.json from the backend config directory and returns its JSON content
func (s *Server) getRoles(w http.ResponseWriter, r *http.Request) {
	// Determine config path relative to working directory
	// Default to ./config/RoleConfig.json, which matches apps/backend/config/RoleConfig.json when run from apps/backend
	path := filepath.Clean("./config/RoleConfig.json")
	if _, err := os.Stat(path); err != nil {
		// Fallback to absolute path in repo if not found (useful during development)
		path = filepath.Clean("D:/code-work/go/work-space/neuro-dev/apps/backend/config/RoleConfig.json")
	}
	b, err := os.ReadFile(path)
	if err != nil {
		s.sendError(w, "failed to read RoleConfig.json", http.StatusInternalServerError)
		return
	}
	var roles map[string]interface{}
	if err := json.Unmarshal(b, &roles); err != nil {
		s.sendError(w, "failed to parse RoleConfig.json", http.StatusInternalServerError)
		return
	}
	s.sendResponse(w, roles)
}

func (s *Server) getModels(w http.ResponseWriter, r *http.Request) {
	// Get models from database
	var modelList []models.Model
	if err := s.Svc.DB.Find(&modelList).Error; err != nil {
		s.sendError(w, "Failed to fetch models from database", http.StatusInternalServerError)
		return
	}

	// If no models in database, initialize with default models
	if len(modelList) == 0 {
		defaultModels := []string{"GPT_3_5_TURBO", "GPT_4", "GPT_4_TURBO", "GPT_4O", "GPT_4O_MINI"}
		for _, modelName := range defaultModels {
			model := models.Model{
				Name:     modelName,
				BaseURL:  "",
				IsCustom: false,
			}
			s.Svc.DB.Create(&model)
			modelList = append(modelList, model)
		}
	}

	s.sendResponse(w, modelList)
}

func (s *Server) createModel(w http.ResponseWriter, r *http.Request) {
	var req models.CreateModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Check if model already exists
	var existing models.Model
	if err := s.Svc.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		s.sendError(w, "Model with this name already exists", http.StatusConflict)
		return
	}

	model := models.Model{
		Name:     req.Name,
		BaseURL:  req.BaseURL,
		IsCustom: true,
	}

	if err := s.Svc.DB.Create(&model).Error; err != nil {
		s.sendError(w, "Failed to create model", http.StatusInternalServerError)
		return
	}

	s.sendResponse(w, model)
}

func (s *Server) updateModel(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.sendError(w, "Invalid model ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	var model models.Model
	if err := s.Svc.DB.First(&model, id).Error; err != nil {
		s.sendError(w, "Model not found", http.StatusNotFound)
		return
	}

	// Update fields if provided
	if req.Name != "" {
		model.Name = req.Name
	}
	if req.BaseURL != "" {
		model.BaseURL = req.BaseURL
	}

	if err := s.Svc.DB.Save(&model).Error; err != nil {
		s.sendError(w, "Failed to update model", http.StatusInternalServerError)
		return
	}

	s.sendResponse(w, model)
}

func (s *Server) deleteModel(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.sendError(w, "Invalid model ID", http.StatusBadRequest)
		return
	}

	var model models.Model
	if err := s.Svc.DB.First(&model, id).Error; err != nil {
		s.sendError(w, "Model not found", http.StatusNotFound)
		return
	}

	if err := s.Svc.DB.Delete(&model).Error; err != nil {
		s.sendError(w, "Failed to delete model", http.StatusInternalServerError)
		return
	}

	s.sendResponse(w, map[string]string{"message": "Model deleted successfully"})
}
