package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

type Server struct {
	router   *mux.Router
	upgrader websocket.Upgrader
}

type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Organization string    `json:"organization"`
	Model        string    `json:"model"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Progress     int       `json:"progress"`
	Tasks        []Task    `json:"tasks"`
}

type Task struct {
	ID           string      `json:"id"`
	ProjectID    string      `json:"project_id"`
	Name         string      `json:"name"`
	Description  string      `json:"description"`
	Type         string      `json:"type"`          // "feature", "bug", "enhancement", etc.
	Status       string      `json:"status"`        // "pending", "in_progress", "completed", "failed"
	Priority     int         `json:"priority"`      // 1-5, 1 being highest
	AssignedRole string      `json:"assigned_role"` // AI role assigned to this task
	CurrentPhase string      `json:"current_phase"`
	Progress     int         `json:"progress"`
	Requirements string      `json:"requirements"`
	Language     string      `json:"language"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	Results      TaskResults `json:"results"`
}

type TaskResults struct {
	DemandAnalysis string `json:"demand_analysis,omitempty"`
	LanguageChoice string `json:"language_choice,omitempty"`
	CodeGeneration string `json:"code_generation,omitempty"`
	ArtDesign      string `json:"art_design,omitempty"`
	TestResults    string `json:"test_results,omitempty"`
	ReviewComments string `json:"review_comments,omitempty"`
	FinalCode      string `json:"final_code,omitempty"`
}

type CreateProjectRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Organization string `json:"organization"`
	Model        string `json:"model"`
	Config       string `json:"config"`
}

type CreateTaskRequest struct {
	ProjectID    string `json:"project_id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Type         string `json:"type"`
	Priority     int    `json:"priority"`
	Requirements string `json:"requirements"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// In-memory storage (in production, use a database)
var projects = make(map[string]*Project)
var tasks = make(map[string]*Task)
var projectCounter = 0
var taskCounter = 0

func NewServer() *Server {
	s := &Server{
		router: mux.NewRouter(),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow connections from any origin
			},
		},
	}

	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// API routes
	api := s.router.PathPrefix("/api").Subrouter()

	// Project endpoints
	api.HandleFunc("/projects", s.createProject).Methods("POST")
	api.HandleFunc("/projects/{id}", s.getProject).Methods("GET")
	api.HandleFunc("/projects/{id}/status", s.getProjectStatus).Methods("GET")
	api.HandleFunc("/projects/{id}/start", s.startProject).Methods("POST")
	api.HandleFunc("/projects/{id}/logs", s.getProjectLogs).Methods("GET")
	api.HandleFunc("/projects/{id}/files", s.getProjectFiles).Methods("GET")
	api.HandleFunc("/projects/{id}/download", s.downloadProject).Methods("POST")

	// Task endpoints
	api.HandleFunc("/projects/{projectId}/tasks", s.createTask).Methods("POST")
	api.HandleFunc("/projects/{projectId}/tasks", s.getProjectTasks).Methods("GET")
	api.HandleFunc("/tasks/{id}", s.getTask).Methods("GET")
	api.HandleFunc("/tasks/{id}", s.updateTask).Methods("PUT")
	api.HandleFunc("/tasks/{id}", s.deleteTask).Methods("DELETE")
	api.HandleFunc("/tasks/{id}/start", s.startTask).Methods("POST")
	api.HandleFunc("/tasks/{id}/status", s.getTaskStatus).Methods("GET")

	// Configuration endpoints
	api.HandleFunc("/config/companies", s.getCompanies).Methods("GET")
	api.HandleFunc("/config/phases", s.getPhases).Methods("GET")
	api.HandleFunc("/config/roles", s.getRoles).Methods("GET")
	api.HandleFunc("/models", s.getModels).Methods("GET")

	// WebSocket endpoint
	s.router.HandleFunc("/ws/projects/{id}", s.handleWebSocket)

	// Health check
	api.HandleFunc("/health", s.healthCheck).Methods("GET")
}

func (s *Server) createProject(w http.ResponseWriter, r *http.Request) {
	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Description == "" {
		s.sendError(w, "Name and description are required", http.StatusBadRequest)
		return
	}

	projectCounter++
	projectID := fmt.Sprintf("project_%d", projectCounter)

	project := &Project{
		ID:           projectID,
		Name:         req.Name,
		Description:  req.Description,
		Organization: req.Organization,
		Model:        req.Model,
		Status:       "created",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Progress:     0,
		Tasks:        make([]Task, 0),
	}

	// Generate tasks using LLM API based on project description
	generatedTasks := s.generateTasksFromDescription(req.Description, req.Model)
	project.Tasks = generatedTasks

	projects[projectID] = project

	s.sendResponse(w, project)
}

// generateTasksFromDescription uses LLM API to decompose project description into tasks
func (s *Server) generateTasksFromDescription(description string, model string) []Task {
	// Task decomposition prompt for LLM
	prompt := fmt.Sprintf(`作为一个软件项目经理，请将以下项目描述分解成具体的开发任务。每个任务应该包含：任务名称、详细描述、类型（feature/bug/enhancement）、优先级（1-5）、具体要求。

项目描述：%s

请以JSON格式返回任务列表，格式如下：
[
  {
    "name": "任务名称",
    "description": "详细描述",
    "type": "feature",
    "priority": 1,
    "requirements": "具体技术要求"
  }
]

请生成3-5个任务，按优先级排序。`, description)

	// Call LLM API (simulated - replace with actual API call)
	tasks := s.callLLMAPI(prompt, model)
	if len(tasks) == 0 {
		// Fallback: generate default tasks if LLM API fails
		return s.generateDefaultTasks(description)
	}

	return tasks
}

// callLLMAPI makes actual API call to LLM service
func (s *Server) callLLMAPI(prompt string, model string) []Task {
	// This is a simulation of LLM API call
	// In production, replace with actual API calls to OpenAI, Claude, or other LLM services

	// For demonstration, we'll generate some realistic tasks based on common patterns
	if strings.Contains(strings.ToLower(prompt), "游戏") || strings.Contains(strings.ToLower(prompt), "game") {
		return []Task{
			{
				ID:           fmt.Sprintf("task_%d", time.Now().Unix()),
				Name:         "游戏核心逻辑开发",
				Description:  "实现游戏的主要逻辑和规则系统",
				Type:         "feature",
				Status:       "pending",
				Priority:     1,
				Requirements: "游戏引擎集成、逻辑算法实现、状态管理",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
			{
				ID:           fmt.Sprintf("task_%d", time.Now().Unix()+1),
				Name:         "用户界面设计",
				Description:  "设计和实现游戏的用户界面",
				Type:         "feature",
				Status:       "pending",
				Priority:     2,
				Requirements: "响应式设计、用户体验优化、视觉效果",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
			{
				ID:           fmt.Sprintf("task_%d", time.Now().Unix()+2),
				Name:         "测试与优化",
				Description:  "游戏功能测试和性能优化",
				Type:         "enhancement",
				Status:       "pending",
				Priority:     3,
				Requirements: "单元测试、集成测试、性能调优",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		}
	}

	// Default web application tasks
	return []Task{
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()),
			Name:         "后端API开发",
			Description:  "开发RESTful API接口和数据库设计",
			Type:         "feature",
			Status:       "pending",
			Priority:     1,
			Requirements: "数据库设计、API接口、身份验证",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()+1),
			Name:         "前端界面开发",
			Description:  "开发用户界面和交互功能",
			Type:         "feature",
			Status:       "pending",
			Priority:     2,
			Requirements: "响应式设计、现代CSS框架、用户体验",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()+2),
			Name:         "系统集成测试",
			Description:  "前后端集成和系统测试",
			Type:         "enhancement",
			Status:       "pending",
			Priority:     3,
			Requirements: "API测试、端到端测试、错误处理",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}
}

// generateDefaultTasks creates fallback tasks when LLM API is unavailable
func (s *Server) generateDefaultTasks(description string) []Task {
	return []Task{
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()),
			Name:         "项目初始化",
			Description:  "设置项目结构和基础配置",
			Type:         "feature",
			Status:       "pending",
			Priority:     1,
			Requirements: "项目架构、依赖管理、开发环境",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()+1),
			Name:         "核心功能开发",
			Description:  "实现项目的主要功能模块",
			Type:         "feature",
			Status:       "pending",
			Priority:     2,
			Requirements: "业务逻辑、数据处理、用户交互",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:           fmt.Sprintf("task_%d", time.Now().Unix()+2),
			Name:         "测试和部署",
			Description:  "功能测试、性能优化和部署准备",
			Type:         "enhancement",
			Status:       "pending",
			Priority:     3,
			Requirements: "单元测试、部署配置、文档编写",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}
}

func (s *Server) getProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	s.sendResponse(w, project)
}

func (s *Server) getProjectStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	// Calculate overall progress based on task completion
	totalTasks := len(project.Tasks)
	completedTasks := 0
	for _, task := range project.Tasks {
		if task.Status == "completed" {
			completedTasks++
		}
	}

	overallProgress := 0
	if totalTasks > 0 {
		overallProgress = (completedTasks * 100) / totalTasks
	}

	status := map[string]interface{}{
		"status":          project.Status,
		"progress":        overallProgress,
		"total_tasks":     totalTasks,
		"completed_tasks": completedTasks,
		"updated_at":      project.UpdatedAt,
		"tasks":           project.Tasks,
	}

	s.sendResponse(w, status)
}

func (s *Server) startProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	if project.Status == "running" {
		s.sendError(w, "Project is already running", http.StatusBadRequest)
		return
	}

	// Start the ChatChain execution in a goroutine
	go s.executeProject(project)

	project.Status = "running"
	project.UpdatedAt = time.Now()

	s.sendResponse(w, map[string]string{"message": "Project started successfully"})
}

func (s *Server) executeProject(project *Project) {
	project.Status = "in_progress"
	project.UpdatedAt = time.Now()

	// Execute tasks sequentially
	for i := range project.Tasks {
		task := &project.Tasks[i]
		s.executeTask(task, project)
	}

	// Check if all tasks are completed
	allCompleted := true
	for _, task := range project.Tasks {
		if task.Status != "completed" {
			allCompleted = false
			break
		}
	}

	if allCompleted {
		project.Status = "completed"
	} else {
		project.Status = "failed"
	}

	project.UpdatedAt = time.Now()
	log.Printf("Project %s execution finished with status: %s", project.ID, project.Status)
}

func (s *Server) executeTask(task *Task, project *Project) {
	task.Status = "in_progress"
	task.UpdatedAt = time.Now()

	// Development phases for each task
	phases := []string{
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
	}

	for i, phase := range phases {
		task.CurrentPhase = phase
		task.Progress = int((float64(i+1) / float64(len(phases))) * 100)
		task.UpdatedAt = time.Now()

		// Simulate processing time
		time.Sleep(1 * time.Second)

		log.Printf("Task %s in Project %s: Completed phase %s (%d%%)", task.ID, project.ID, phase, task.Progress)
	}

	task.Status = "completed"
	task.Progress = 100
	task.CurrentPhase = "finished"
	task.UpdatedAt = time.Now()

	log.Printf("Task %s in Project %s completed successfully", task.ID, project.ID)
}

// Task management endpoints
func (s *Server) createTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["projectId"]

	// Check if project exists
	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Description == "" {
		s.sendError(w, "Name and description are required", http.StatusBadRequest)
		return
	}

	taskCounter++
	taskID := fmt.Sprintf("task_%d", taskCounter)

	task := Task{
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
		Results:      TaskResults{},
	}

	// Add task to project and global storage
	project.Tasks = append(project.Tasks, task)
	tasks[taskID] = &task
	project.UpdatedAt = time.Now()

	s.sendResponse(w, task)
}

func (s *Server) getProjectTasks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["projectId"]

	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	s.sendResponse(w, project.Tasks)
}

func (s *Server) getTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]

	task, exists := tasks[taskID]
	if !exists {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}

	s.sendResponse(w, task)
}

func (s *Server) updateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]

	task, exists := tasks[taskID]
	if !exists {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update task fields
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

	// Update task in project
	project := projects[task.ProjectID]
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

	task, exists := tasks[taskID]
	if !exists {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}

	// Remove task from project
	project := projects[task.ProjectID]
	for i, t := range project.Tasks {
		if t.ID == taskID {
			project.Tasks = append(project.Tasks[:i], project.Tasks[i+1:]...)
			break
		}
	}
	project.UpdatedAt = time.Now()

	// Remove from global storage
	delete(tasks, taskID)

	s.sendResponse(w, map[string]string{"message": "Task deleted successfully"})
}

func (s *Server) startTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]

	task, exists := tasks[taskID]
	if !exists {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if task.Status != "pending" {
		s.sendError(w, "Task is not in pending status", http.StatusBadRequest)
		return
	}

	project := projects[task.ProjectID]

	// Start task execution in background
	go s.executeTask(task, project)

	s.sendResponse(w, map[string]string{"message": "Task started successfully"})
}

func (s *Server) getTaskStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	taskID := vars["id"]

	task, exists := tasks[taskID]
	if !exists {
		s.sendError(w, "Task not found", http.StatusNotFound)
		return
	}

	status := map[string]interface{}{
		"status":        task.Status,
		"progress":      task.Progress,
		"current_phase": task.CurrentPhase,
		"updated_at":    task.UpdatedAt,
		"results":       task.Results,
	}

	s.sendResponse(w, status)
}

func (s *Server) getProjectLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	// Simulate log data
	logs := []string{
		"Starting project execution...",
		"Phase DemandAnalysis: Analyzing requirements",
		"Phase LanguageChoose: Selected Python",
		"Phase Coding: Generating code files",
		"Phase ArtDesign: Designing UI elements",
		"Project execution completed",
	}

	s.sendResponse(w, map[string]interface{}{
		"project_id": projectID,
		"logs":       logs,
	})
}

func (s *Server) getProjectFiles(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	// Simulate generated files
	files := []map[string]interface{}{
		{"name": "main.py", "type": "python", "size": 1024},
		{"name": "requirements.txt", "type": "text", "size": 256},
		{"name": "README.md", "type": "markdown", "size": 512},
	}

	s.sendResponse(w, map[string]interface{}{
		"project_id": projectID,
		"files":      files,
	})
}

func (s *Server) downloadProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	project, exists := projects[projectID]
	if !exists {
		s.sendError(w, "Project not found", http.StatusNotFound)
		return
	}

	// Simulate file download URL
	downloadURL := fmt.Sprintf("/downloads/%s.zip", projectID)

	s.sendResponse(w, map[string]interface{}{
		"project_id":   projectID,
		"project_name": project.Name,
		"download_url": downloadURL,
		"expires_at":   time.Now().Add(1 * time.Hour),
		"total_tasks":  len(project.Tasks),
	})
}

func (s *Server) getCompanies(w http.ResponseWriter, r *http.Request) {
	companies := []string{"Default", "Art", "Human"}
	s.sendResponse(w, companies)
}

func (s *Server) getPhases(w http.ResponseWriter, r *http.Request) {
	phases := []string{
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
	}
	s.sendResponse(w, phases)
}

func (s *Server) getRoles(w http.ResponseWriter, r *http.Request) {
	roles := []string{
		"Chief Executive Officer",
		"Chief Product Officer",
		"Chief Technology Officer",
		"Programmer",
		"Code Reviewer",
		"Software Test Engineer",
		"Chief Creative Officer",
	}
	s.sendResponse(w, roles)
}

func (s *Server) getModels(w http.ResponseWriter, r *http.Request) {
	models := []string{
		"GPT_3_5_TURBO",
		"GPT_4",
		"GPT_4_TURBO",
		"GPT_4O",
		"GPT_4O_MINI",
	}
	s.sendResponse(w, models)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Send real-time updates for the project
	for {
		project, exists := projects[projectID]
		if !exists {
			break
		}

		err := conn.WriteJSON(project)
		if err != nil {
			log.Printf("WebSocket write error: %v", err)
			break
		}

		time.Sleep(1 * time.Second)

		if project.Status == "completed" || project.Status == "failed" {
			break
		}
	}
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	s.sendResponse(w, map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func (s *Server) sendResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Data:    data,
	})
}

func (s *Server) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error:   message,
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := NewServer()

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(server.router)

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
