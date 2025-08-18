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
	project, ok := s.Svc.Projects[projectID]
	if !ok {
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
	project.Tasks = append(project.Tasks, task)
	s.Svc.Tasks[taskID] = &task
	project.UpdatedAt = time.Now()
	s.sendResponse(w, task)
}

func (s *Server) getProjectTasks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["projectId"]
	project, ok := s.Svc.Projects[projectID]
	if !ok {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	s.sendResponse(w, project.Tasks)
}

func (s *Server) getTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	task, ok := s.Svc.Tasks[taskID]
	if !ok {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	s.sendResponse(w, task)
}

func (s *Server) updateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	task, ok := s.Svc.Tasks[taskID]
	if !ok {
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
	project := s.Svc.Projects[task.ProjectID]
	for i := range project.Tasks {
		if project.Tasks[i].ID == taskID {
			project.Tasks[i] = *task
			break
		}
	}
	project.UpdatedAt = time.Now()
	s.sendResponse(w, task)
}

func (s *Server) deleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	task, ok := s.Svc.Tasks[taskID]
	if !ok {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	project := s.Svc.Projects[task.ProjectID]
	for i, t := range project.Tasks {
		if t.ID == taskID {
			project.Tasks = append(project.Tasks[:i], project.Tasks[i+1:]...)
			break
		}
	}
	project.UpdatedAt = time.Now()
	delete(s.Svc.Tasks, taskID)
	s.sendResponse(w, map[string]string{"message": "Task deleted successfully"})
}

func (s *Server) startTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	task, ok := s.Svc.Tasks[taskID]
	if !ok {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}
	if task.Status != "pending" {
		s.sendError(w, "Task is not in pending status", http.StatusBadRequest)
		return
	}
	project := s.Svc.Projects[task.ProjectID]
	go s.Svc.ExecuteTask(task, project)
	s.sendResponse(w, map[string]string{"message": "Task started successfully"})
}

func (s *Server) getTaskStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]
	task, ok := s.Svc.Tasks[taskID]
	if !ok {
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
