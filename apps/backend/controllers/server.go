package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"neuro-dev/config"
	"neuro-dev/db"
	"neuro-dev/models"
	"neuro-dev/services"
)

type Server struct {
	Router   *mux.Router
	Upgrader websocket.Upgrader
	Svc      *services.Service
}

func NewServer() *Server {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	// Initialize DB (Postgres via GORM)
	dbConn, err := db.Init(cfg)
	if err != nil {
		panic(err)
	}
	// Auto-migrate models
	if err := dbConn.AutoMigrate(&models.Project{}, &models.Task{}, &models.Model{}); err != nil {
		panic(err)
	}

	s := &Server{
		Router: mux.NewRouter(),
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		Svc: services.NewService(dbConn),
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	api := s.Router.PathPrefix("/api").Subrouter()

	// Project endpoints
	api.HandleFunc("/projects", s.listProjects).Methods("GET")
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
	api.HandleFunc("/models", s.createModel).Methods("POST")
	api.HandleFunc("/models/{id}", s.updateModel).Methods("PUT")
	api.HandleFunc("/models/{id}", s.deleteModel).Methods("DELETE")
	api.HandleFunc("/models/{name}/token", s.updateModelToken).Methods("PUT")

	// WebSocket
	s.Router.HandleFunc("/ws/projects/{id}", s.handleWebSocket)

	// Health
	api.HandleFunc("/health", s.healthCheck).Methods("GET")
}

// Helpers
func (s *Server) sendResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{Success: true, Data: data})
}

func (s *Server) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.APIResponse{Success: false, Error: message})
}

// Controllers - Tasks

// Other endpoints

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID := vars["id"]
	conn, err := s.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()
	for {
		var project models.Project
		if err := s.Svc.DB.Preload("Tasks").First(&project, "id = ?", projectID).Error; err != nil {
			break
		}
		if err := conn.WriteJSON(project); err != nil {
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
	s.sendResponse(w, map[string]string{"status": "healthy", "time": time.Now().Format(time.RFC3339)})
}
