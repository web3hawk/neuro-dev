package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
	"neuro-dev/models"
)

// Project-related handlers
func (s *Server) listProjects(w http.ResponseWriter, r *http.Request) {
	// Load from DB with tasks
	var projects []models.Project
	if err := s.Svc.DB.Preload("Tasks").Find(&projects).Error; err != nil {
		s.sendError(w, "Failed to load projects", http.StatusInternalServerError)
		return
	}
	// Sort by updated_at desc for stable ordering
	sort.Slice(projects, func(i, j int) bool { return projects[i].UpdatedAt.After(projects[j].UpdatedAt) })
	// Optionally compute progress based on tasks completion
	for i := range projects {
		p := &projects[i]
		total := len(p.Tasks)
		if total == 0 {
			p.Progress = 0
			p.EstimatedCost = 0
			continue
		}
		completed := 0
		estimatedCost := 0.0
		for _, t := range p.Tasks {
			if t.Status == "completed" {
				completed++
			}
			// Sum up estimated costs, treating null/zero as 0
			estimatedCost += t.EstimatedCost
		}
		// Store percentage in Project.Progress if field exists (not persisted here)
		p.Progress = (completed * 100) / total
		// Store calculated estimated cost
		p.EstimatedCost = estimatedCost
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
		Vendors:      req.Vendors,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Progress:     0,
		Tasks:        make([]models.Task, 0),
	}

	// Persist project and tasks in a transaction
	if err := s.Svc.DB.Transaction(func(tx *gorm.DB) error {
		// Create the project first without tasks
		projectWithoutTasks := &models.Project{
			ID:           project.ID,
			Name:         project.Name,
			Description:  project.Description,
			Organization: project.Organization,
			Model:        project.Model,
			Status:       project.Status,
			Vendors:      project.Vendors,
			CreatedAt:    project.CreatedAt,
			UpdatedAt:    project.UpdatedAt,
			Progress:     project.Progress,
		}
		if err := tx.Create(projectWithoutTasks).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		log.Printf("Failed to create project %s: %v", projectID, err)
		s.sendError(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	// Keep in-memory map optionally for runtime use
	s.Svc.Projects[projectID] = project
	s.sendResponse(w, project)
}

func (s *Server) getProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	var project models.Project
	if err := s.Svc.DB.Preload("Tasks").First(&project, "id = ?", projectID).Error; err != nil {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	// Calculate estimated cost from tasks
	estimatedCost := 0.0
	for _, t := range project.Tasks {
		estimatedCost += t.EstimatedCost
	}
	project.EstimatedCost = estimatedCost
	s.sendResponse(w, project)
}

func (s *Server) updateProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	var req models.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Description == "" {
		s.sendError(w, "Name and description are required", http.StatusBadRequest)
		return
	}

	// Check if project exists
	var project models.Project
	if err := s.Svc.DB.First(&project, "id = ?", projectID).Error; err != nil {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	// Update project fields
	updateData := map[string]interface{}{
		"name":         req.Name,
		"description":  req.Description,
		"organization": req.Organization,
		"model":        req.Model,
		"vendors":      req.Vendors,
		"updated_at":   time.Now(),
	}

	// Update in database
	if err := s.Svc.DB.Model(&project).Updates(updateData).Error; err != nil {
		s.sendError(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	// Fetch updated project to return
	if err := s.Svc.DB.First(&project, "id = ?", projectID).Error; err != nil {
		s.sendError(w, "Failed to fetch updated project", http.StatusInternalServerError)
		return
	}

	// Update in-memory map if it exists
	if _, exists := s.Svc.Projects[projectID]; exists {
		s.Svc.Projects[projectID].Name = req.Name
		s.Svc.Projects[projectID].Description = req.Description
		s.Svc.Projects[projectID].Organization = req.Organization
		s.Svc.Projects[projectID].Model = req.Model
		s.Svc.Projects[projectID].Vendors = req.Vendors
		s.Svc.Projects[projectID].UpdatedAt = time.Now()
	}

	s.sendResponse(w, project)
}

func (s *Server) getProjectStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	var project models.Project
	if err := s.Svc.DB.Preload("Tasks").First(&project, "id = ?", projectID).Error; err != nil {
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
	var project models.Project
	if err := s.Svc.DB.Preload("Tasks").First(&project, "id = ?", projectID).Error; err != nil {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}
	if project.Status == "running" {
		s.sendError(w, "Project is already running", http.StatusBadRequest)
		return
	}

	// Generate tasks if they don't exist yet
	if len(project.Tasks) == 0 {
		generatedTasks := s.Svc.GenerateTasksFromDescription(project.Description, project.Model, project.Vendors)
		// assign ProjectID and reset status for generated tasks
		for i := range generatedTasks {
			generatedTasks[i].ProjectID = projectID
		}
		project.Tasks = generatedTasks

		// Create tasks in database
		if err := s.Svc.DB.Transaction(func(tx *gorm.DB) error {
			// Create tasks individually to avoid bulk insert conflicts
			for i := range project.Tasks {
				// Ensure each task has a unique ID and proper ProjectID
				task := &project.Tasks[i]
				if task.ID == "" {
					task.ID = s.Svc.NextTaskID()
				}
				task.ProjectID = project.ID
				if err := tx.Create(task).Error; err != nil {
					return err
				}
			}
			return nil
		}); err != nil {
			log.Printf("Failed to create tasks for project %s: %v", projectID, err)
			s.sendError(w, "Failed to create tasks for project", http.StatusInternalServerError)
			return
		}
	}

	// optionally keep memory map for execution progress
	s.Svc.Projects[projectID] = &project

	// Start project execution in background
	//go func() {
	//	// Update project status to running
	//	project.Status = "running"
	//	project.UpdatedAt = time.Now()
	//	s.Svc.DB.Model(&models.Project{}).Where("id = ?", projectID).Updates(map[string]interface{}{"status": project.Status, "updated_at": project.UpdatedAt})
	//
	//	// Simulate task execution progress
	//	for i, task := range project.Tasks {
	//		// Update task to running
	//		s.Svc.DB.Model(&models.Task{}).Where("id = ?", task.ID).Update("status", "running")
	//
	//		// Simulate task execution time (2-5 seconds per task)
	//		time.Sleep(time.Duration(2+i%3) * time.Second)
	//
	//		// Update task to completed
	//		s.Svc.DB.Model(&models.Task{}).Where("id = ?", task.ID).Update("status", "completed")
	//	}
	//
	//	// Update project status to completed
	//	project.Status = "completed"
	//	project.UpdatedAt = time.Now()
	//	s.Svc.DB.Model(&models.Project{}).Where("id = ?", projectID).Updates(map[string]interface{}{"status": project.Status, "updated_at": project.UpdatedAt})
	//}()

	project.Status = "running"
	project.UpdatedAt = time.Now()
	_ = s.Svc.DB.Model(&models.Project{}).Where("id = ?", projectID).Updates(map[string]interface{}{"status": project.Status, "updated_at": project.UpdatedAt}).Error
	s.sendResponse(w, map[string]interface{}{"success": true, "message": "Project started successfully"})
}

func (s *Server) getProjectLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	var project models.Project
	if err := s.Svc.DB.Preload("Tasks").First(&project, "id = ?", projectID).Error; err != nil {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	logs := []string{}

	// Add initial project startup logs
	logs = append(logs, fmt.Sprintf("正在启动项目: %s", project.Name))
	logs = append(logs, "开始初始化项目环境...")

	// Add task generation logs if tasks exist
	if len(project.Tasks) > 0 {
		logs = append(logs, fmt.Sprintf("已生成 %d 个任务", len(project.Tasks)))

		// Add logs for each task based on their status
		for _, task := range project.Tasks {
			switch task.Status {
			case "created":
				logs = append(logs, fmt.Sprintf("任务 [%s]: 已创建，等待执行", task.Name))
			case "running":
				logs = append(logs, fmt.Sprintf("任务 [%s]: 正在执行中...", task.Name))
			case "completed":
				logs = append(logs, fmt.Sprintf("任务 [%s]: 执行完成 ✓", task.Name))
			case "failed":
				logs = append(logs, fmt.Sprintf("任务 [%s]: 执行失败 ✗", task.Name))
			}
		}
	} else {
		logs = append(logs, "正在分析项目需求...")
		logs = append(logs, "正在生成项目任务...")
	}

	// Add status-based logs
	switch project.Status {
	case "created":
		logs = append(logs, "项目已创建，准备启动...")
	case "running":
		logs = append(logs, "项目正在运行中...")
		logs = append(logs, "项目启动成功...")
	case "completed":
		logs = append(logs, "所有任务已完成!")
		logs = append(logs, "项目执行成功 🎉")
	case "failed":
		logs = append(logs, "项目执行过程中出现错误")
	}

	s.sendResponse(w, map[string]interface{}{
		"project_id": projectID,
		"logs":       logs,
		"timestamp":  time.Now(),
	})
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
	var project models.Project
	if err := s.Svc.DB.First(&project, "id = ?", projectID).Error; err != nil {
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

func (s *Server) deleteProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	// Check if project exists
	var project models.Project
	if err := s.Svc.DB.First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.sendError(w, "Project not found", http.StatusNotFound)
		} else {
			s.sendError(w, "Failed to check project existence", http.StatusInternalServerError)
		}
		return
	}

	// Delete project and associated tasks in a transaction
	if err := s.Svc.DB.Transaction(func(tx *gorm.DB) error {
		// Due to CASCADE constraint, deleting the project will automatically delete associated tasks
		if err := tx.Delete(&project).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		log.Printf("Failed to delete project %s: %v", projectID, err)
		s.sendError(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	// Remove from in-memory map if it exists
	delete(s.Svc.Projects, projectID)

	log.Printf("Successfully deleted project %s and its associated tasks", projectID)
	s.sendResponse(w, map[string]interface{}{
		"success": true,
		"message": "Project and associated tasks deleted successfully",
	})
}
