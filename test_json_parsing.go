package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Simulate the models.Task struct for testing
type Task struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Type         string    `json:"type"`
	Status       string    `json:"status"`
	Priority     int       `json:"priority"`
	AssignedRole string    `json:"assigned_role"`
	Requirements string    `json:"requirements"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type TaskFromLLM struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Type         string `json:"type"`
	Priority     int    `json:"priority"`
	AssignedRole string `json:"assigned_role"`
	Requirements string `json:"requirements"`
}

func parseTasksFromResponse(response string) []Task {
	tasks := []Task{}
	baseTime := time.Now()

	// Try to extract JSON from the response
	jsonStart := strings.Index(response, "[")
	jsonEnd := strings.LastIndex(response, "]")

	if jsonStart == -1 || jsonEnd == -1 || jsonStart >= jsonEnd {
		log.Printf("No valid JSON array found in response")
		return getDefaultFallbackTask(baseTime)
	}

	jsonStr := response[jsonStart : jsonEnd+1]

	// Parse JSON array
	var llmTasks []TaskFromLLM
	err := json.Unmarshal([]byte(jsonStr), &llmTasks)
	if err != nil {
		log.Printf("Failed to parse JSON from LLM response: %v", err)
		return getDefaultFallbackTask(baseTime)
	}

	// Convert LLM tasks to Task
	for _, llmTask := range llmTasks {
		task := Task{
			ID:           uuid.NewString(),
			Name:         llmTask.Name,
			Description:  llmTask.Description,
			Type:         llmTask.Type,
			Status:       "pending",
			Priority:     llmTask.Priority,
			AssignedRole: llmTask.AssignedRole,
			Requirements: llmTask.Requirements,
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		}
		tasks = append(tasks, task)
	}

	if len(tasks) == 0 {
		return getDefaultFallbackTask(baseTime)
	}

	return tasks
}

func getDefaultFallbackTask(baseTime time.Time) []Task {
	return []Task{
		{
			ID:           uuid.NewString(),
			Name:         "AI生成任务",
			Description:  "基于LLM生成的开发任务",
			Type:         "feature",
			Status:       "pending",
			Priority:     1,
			AssignedRole: "developer",
			Requirements: "按照AI建议执行",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		},
	}
}

func main() {
	// Test case 1: Valid JSON response
	validResponse := `Here are the tasks:
[
  {
    "name": "设计数据库架构",
    "description": "设计系统所需的数据库表结构",
    "type": "feature",
    "priority": 1,
    "assigned_role": "architect",
    "requirements": "数据库设计文档"
  },
  {
    "name": "实现用户认证",
    "description": "实现用户登录注册功能",
    "type": "feature",
    "priority": 2,
    "assigned_role": "backend",
    "requirements": "JWT令牌认证"
  }
]
That's all the tasks.`

	fmt.Println("Testing valid JSON response:")
	tasks := parseTasksFromResponse(validResponse)
	fmt.Printf("Parsed %d tasks:\n", len(tasks))
	for i, task := range tasks {
		fmt.Printf("Task %d: %s (%s, priority: %d, role: %s)\n",
			i+1, task.Name, task.Type, task.Priority, task.AssignedRole)
	}

	fmt.Println("\n" + strings.Repeat("=", 50) + "\n")

	// Test case 2: Invalid JSON response
	invalidResponse := "This is just plain text without any JSON."
	fmt.Println("Testing invalid JSON response:")
	tasks2 := parseTasksFromResponse(invalidResponse)
	fmt.Printf("Parsed %d tasks (should be 1 fallback task):\n", len(tasks2))
	for i, task := range tasks2 {
		fmt.Printf("Task %d: %s (%s)\n", i+1, task.Name, task.Type)
	}

	fmt.Println("\n" + strings.Repeat("=", 50) + "\n")

	// Test case 3: Malformed JSON
	malformedResponse := `[
  {
    "name": "测试任务",
    "description": "这是一个测试"
    "type": "bug"  // missing comma
  }
]`
	fmt.Println("Testing malformed JSON response:")
	tasks3 := parseTasksFromResponse(malformedResponse)
	fmt.Printf("Parsed %d tasks (should be 1 fallback task):\n", len(tasks3))
	for i, task := range tasks3 {
		fmt.Printf("Task %d: %s (%s)\n", i+1, task.Name, task.Type)
	}
}
