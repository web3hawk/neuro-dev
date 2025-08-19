package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/gorilla/mux"
	"neuro-dev/models"
)

// Project-related handlers
func (s *Server) listProjects(w http.ResponseWriter, r *http.Request) {
	// Convert map to slice
	projects := make([]*models.Project, 0, len(s.Svc.Projects))
	for _, p := range s.Svc.Projects {
		projects = append(projects, p)
	}
	// Sort by updated_at desc for stable ordering
	sort.Slice(projects, func(i, j int) bool { return projects[i].UpdatedAt.After(projects[j].UpdatedAt) })
	// Optionally compute progress based on tasks completion
	for _, p := range projects {
		total := len(p.Tasks)
		if total == 0 {
			continue
		}
		completed := 0
		for _, t := range p.Tasks {
			if t.Status == "completed" {
				completed++
			}
		}
		// Store percentage in Project.Progress if field exists
		p.Progress = (completed * 100) / total
	}
	s.sendResponse(w, projects)
}
func (s *Server) createProject(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Description == "" {
		s.sendError(w, "Name and description are required", http.StatusBadRequest)
		return
	}

	projectID := s.Svc.NextProjectID()
	project := &models.Project{
		ID:           projectID,
		Name:         req.Name,
		Description:  req.Description,
		Organization: req.Organization,
		Model:        req.Model,
		Status:       "created",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Progress:     0,
		Tasks:        make([]models.Task, 0),
	}

	generatedTasks := s.Svc.GenerateTasksFromDescription(req.Description, req.Model)
	project.Tasks = generatedTasks

	s.Svc.Projects[projectID] = project
	s.sendResponse(w, project)
}

func (s *Server) getProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	project, ok := s.Svc.Projects[projectID]
	if !ok {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	s.sendResponse(w, project)
}

func (s *Server) getProjectStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	project, ok := s.Svc.Projects[projectID]
	if !ok {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	totalTasks := len(project.Tasks)
	completed := 0
	for _, t := range project.Tasks {
		if t.Status == "completed" {
			completed++
		}
	}
	progress := 0
	if totalTasks > 0 {
		progress = (completed * 100) / totalTasks
	}
	s.sendResponse(w, map[string]interface{}{
		"status":          project.Status,
		"progress":        progress,
		"total_tasks":     totalTasks,
		"completed_tasks": completed,
		"updated_at":      project.UpdatedAt,
		"tasks":           project.Tasks,
	})
}

func (s *Server) startProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	project, ok := s.Svc.Projects[projectID]
	if !ok {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	if project.Status == "running" {
		s.sendError(w, "Project is already running", http.StatusBadRequest)
		return
	}
	go s.Svc.ExecuteProject(project)
	project.Status = "running"
	project.UpdatedAt = time.Now()
	s.sendResponse(w, map[string]string{"message": "Project started successfully"})
}

func (s *Server) getProjectLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	logs := []string{
		"Starting project execution...",
		"Phase DemandAnalysis: Analyzing requirements",
		"Phase LanguageChoose: Selected Python",
		"Phase Coding: Generating code files",
		"Phase ArtDesign: Designing UI elements",
		"Project execution completed",
	}
	s.sendResponse(w, map[string]interface{}{"project_id": projectID, "logs": logs})
}

func (s *Server) getProjectFiles(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	files := []map[string]interface{}{
		{"name": "main.py", "type": "python", "size": 1024},
		{"name": "requirements.txt", "type": "text", "size": 256},
		{"name": "README.md", "type": "markdown", "size": 512},
	}
	s.sendResponse(w, map[string]interface{}{"project_id": projectID, "files": files})
}

func (s *Server) downloadProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	project, ok := s.Svc.Projects[projectID]
	if !ok {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	downloadURL := fmt.Sprintf("/downloads/%s.zip", projectID)
	s.sendResponse(w, map[string]interface{}{
		"project_id":   projectID,
		"project_name": project.Name,
		"download_url": downloadURL,
		"expires_at":   time.Now().Add(1 * time.Hour),
		"total_tasks":  len(project.Tasks),
	})
}
