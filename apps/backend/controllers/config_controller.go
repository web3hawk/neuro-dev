package controllers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
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
	s.sendResponse(w, []string{"GPT_3_5_TURBO", "GPT_4", "GPT_4_TURBO", "GPT_4O", "GPT_4O_MINI"})
}
