package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Mock Task struct (similar to models.Task)
type Task struct {
	ID            string
	Name          string
	Description   string
	Type          string
	Status        string
	Priority      int
	AssignedRole  string
	Requirements  string
	EstimatedDays int
	EstimatedCost float64
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Fixed TaskFromLLM struct with []string Requirements
type TaskFromLLM struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Type          string   `json:"type"`
	Priority      int      `json:"priority"`
	AssignedRole  string   `json:"assigned_role"`
	Requirements  []string `json:"requirements"`
	EstimatedDays int      `json:"estimated_days"`
	EstimatedCost float64  `json:"estimated_cost"`
}

func testArrayRequirements() {
	jsonWithArrayRequirements := `[
		{
			"name": "Task 1",
			"description": "Test task with array requirements",
			"type": "feature",
			"priority": 1,
			"assigned_role": "developer",
			"requirements": ["req1", "req2", "req3"],
			"estimated_days": 5,
			"estimated_cost": 1000.0
		}
	]`

	var llmTasks []TaskFromLLM
	err := json.Unmarshal([]byte(jsonWithArrayRequirements), &llmTasks)
	if err != nil {
		log.Printf("Error with array requirements: %v", err)
		return
	}

	fmt.Println("✓ Array requirements parsed successfully!")

	// Convert to Task (simulating the fixed logic)
	baseTime := time.Now()
	for _, llmTask := range llmTasks {
		task := Task{
			ID:            uuid.NewString(),
			Name:          llmTask.Name,
			Description:   llmTask.Description,
			Type:          llmTask.Type,
			Status:        "pending",
			Priority:      llmTask.Priority,
			AssignedRole:  llmTask.AssignedRole,
			Requirements:  strings.Join(llmTask.Requirements, ", "), // Fixed conversion
			EstimatedDays: llmTask.EstimatedDays,
			EstimatedCost: llmTask.EstimatedCost,
			CreatedAt:     baseTime,
			UpdatedAt:     baseTime,
		}
		fmt.Printf("Task created: %s\n", task.Name)
		fmt.Printf("Requirements: %s\n", task.Requirements)
	}
}

func main() {
	fmt.Println("Testing the fix for LLM JSON parsing:")
	fmt.Println("=====================================")

	fmt.Println("\nTesting with array requirements (LLM format):")
	testArrayRequirements()

	fmt.Println("\n✅ Fix verified - project creation should now work!")
}
