package services

import (
	"log"
	"time"

	"github.com/google/uuid"
	"neuro-dev/models"
)

// Project-related service methods
func (s *Service) NextProjectID() string {
	// Use UUID to avoid collisions across restarts and concurrent requests
	return uuid.NewString()
}

func (s *Service) ExecuteProject(project *models.Project) {
	project.Status = "in_progress"
	project.UpdatedAt = time.Now()

	for i := range project.Tasks {
		task := &project.Tasks[i]
		s.ExecuteTask(task, project)
	}

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
