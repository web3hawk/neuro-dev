package controllers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"neuro-dev/models"
)

// Task-related handlers
func (s *Server) createTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["projectId"]
	// Ensure project exists in DB
	var tmp int64
	if err := s.Svc.DB.Model(&models.Project{}).Where("id = ?", projectID).Count(&tmp).Error; err != nil || tmp == 0 {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Description == "" {
		s.sendError(w, "Name and description are required", http.StatusBadRequest)
		return
	}

	taskID := s.Svc.NextTaskID()
	task := models.Task{
		ID:           taskID,
		ProjectID:    projectID,
		Name:         req.Name,
		Description:  req.Description,
		Type:         req.Type,
		Status:       "pending",
		Priority:     req.Priority,
		Requirements: req.Requirements,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Progress:     0,
		Results:      models.TaskResults{},
	}
	if err := s.Svc.DB.Create(&task).Error; err != nil {
		s.sendError(w, "Failed to create task", http.StatusInternalServerError)
		return
	}
	// optional in-memory
	s.Svc.Tasks[taskID] = &task
	_ = s.Svc.DB.Model(&models.Project{}).Where("id = ?", projectID).Update("updated_at", time.Now()).Error
	s.sendResponse(w, task)
}

func (s *Server) getProjectTasks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["projectId"]
	var tasks []models.Task
	if err := s.Svc.DB.Where("project_id = ?", projectID).Find(&tasks).Error; err != nil {
		s.sendError(w, "Failed to load tasks", http.StatusInternalServerError)
		return
	}
	s.sendResponse(w, tasks)
}

func (s *Server) getTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	var task models.Task
	if err := s.Svc.DB.First(&task, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	s.sendResponse(w, task)
}

func (s *Server) updateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	var task models.Task
	if err := s.Svc.DB.First(&task, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name != "" {
		task.Name = req.Name
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Type != "" {
		task.Type = req.Type
	}
	if req.Priority > 0 {
		task.Priority = req.Priority
	}
	if req.Requirements != "" {
		task.Requirements = req.Requirements
	}
	task.UpdatedAt = time.Now()
	if err := s.Svc.DB.Save(&task).Error; err != nil {
		s.sendError(w, "Failed to update task", http.StatusInternalServerError)
		return
	}
	s.sendResponse(w, task)
}

func (s *Server) deleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	var task models.Task
	if err := s.Svc.DB.First(&task, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	if err := s.Svc.DB.Delete(&models.Task{}, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}
	delete(s.Svc.Tasks, taskID)
	_ = s.Svc.DB.Model(&models.Project{}).Where("id = ?", task.ProjectID).Update("updated_at", time.Now()).Error
	s.sendResponse(w, map[string]string{"message": "Task deleted successfully"})
}

func (s *Server) startTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	var task models.Task
	if err := s.Svc.DB.First(&task, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	if task.Status != "pending" {
		s.sendError(w, "Task is not in pending status", http.StatusBadRequest)
		return
	}
	var project models.Project
	if err := s.Svc.DB.First(&project, "id = ?", task.ProjectID).Error; err != nil {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	// optional in-memory
	s.Svc.Tasks[taskID] = &task
	s.Svc.Projects[project.ID] = &project
	go s.Svc.ExecuteTask(&task, &project)
	s.sendResponse(w, map[string]string{"message": "Task started successfully"})
}

func (s *Server) getTaskStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	var task models.Task
	if err := s.Svc.DB.First(&task, "id = ?", taskID).Error; err != nil {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	s.sendResponse(w, map[string]interface{}{
		"status":        task.Status,
		"progress":      task.Progress,
		"current_phase": task.CurrentPhase,
		"updated_at":    task.UpdatedAt,
		"results":       task.Results,
	})
}
