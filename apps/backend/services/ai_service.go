package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"neuro-dev/models"
)

func (s *Service) callLLMAPI(prompt string, model string) []models.Task {
	// Load configuration for API key (still needed)

	// Get model properties from database using ModelService
	modelData, err := s.ModelService.GetModelByName(model)
	if err != nil {
		log.Printf("Failed to find model '%s' in database: %v", model, err)
		return s.getFallbackTasks(err.Error())
	}

	// Create OpenAI client using model data from database
	llm, err := openai.New(
		openai.WithToken(modelData.Token),
		openai.WithModel(modelData.Name),
		openai.WithBaseURL(modelData.BaseURL),
	)
	if err != nil {
		log.Printf("Failed to create OpenAI client: %v", err)
		return s.getFallbackTasks(err.Error())
	}

	ctx := context.Background()
	content := []llms.MessageContent{
		llms.TextParts(llms.ChatMessageTypeHuman, prompt),
	}

	response, err := llm.GenerateContent(ctx, content, llms.WithTemperature(0.7))
	if err != nil {
		log.Printf("Failed to generate content: %v", err)
		return s.getFallbackTasks(err.Error())
	}

	// Parse the response and convert to tasks
	tasks := s.parseTasksFromResponse(response.Choices[0].Content)

	return tasks
}

// getFallbackTasks returns default tasks when LLM API fails
func (s *Service) getFallbackTasks(desc string) []models.Task {
	baseTime := time.Now()
	return []models.Task{
		{
			ID:           uuid.NewString(),
			Name:         "生成任务失败",
			Description:  "设计系统架构和技术方案",
			Type:         "feature",
			Status:       "pending",
			Priority:     2,
			AssignedRole: "architect",
			Requirements: "架构设计、数据库设计、接口设计",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		},
	}
}

// parseTasksFromResponse parses LLM response to extract tasks
func (s *Service) parseTasksFromResponse(response string) []models.Task {
	// Define a struct to match the JSON format from LLM response
	type TaskFromLLM struct {
		Name          string  `json:"name"`
		Description   string  `json:"description"`
		Type          string  `json:"type"`
		Priority      int     `json:"priority"`
		AssignedRole  string  `json:"assigned_role"`
		Requirements  string  `json:"requirements"`
		EstimatedDays int     `json:"estimated_days"`
		EstimatedCost float64 `json:"estimated_cost"`
	}

	tasks := []models.Task{}
	baseTime := time.Now()

	// Try to extract JSON from the response (LLM might return text with JSON embedded)
	jsonStart := strings.Index(response, "[")
	jsonEnd := strings.LastIndex(response, "]")

	if jsonStart == -1 || jsonEnd == -1 || jsonStart >= jsonEnd {
		err := fmt.Errorf("No valid JSON array found in response", response)
		log.Printf("No valid JSON array found in response")
		return s.getFallbackTasks(err.Error())
	}

	jsonStr := response[jsonStart : jsonEnd+1]

	// Parse JSON array
	var llmTasks []TaskFromLLM
	err := json.Unmarshal([]byte(jsonStr), &llmTasks)
	if err != nil {
		log.Printf("Failed to parse JSON from LLM response: %v", err)
		return s.getFallbackTasks(err.Error())
	}

	// Convert LLM tasks to models.Task
	for _, llmTask := range llmTasks {
		task := models.Task{
			ID:            uuid.NewString(),
			Name:          llmTask.Name,
			Description:   llmTask.Description,
			Type:          llmTask.Type,
			Status:        "pending", // Default status
			Priority:      llmTask.Priority,
			AssignedRole:  llmTask.AssignedRole,
			Requirements:  llmTask.Requirements,
			EstimatedDays: llmTask.EstimatedDays,
			EstimatedCost: llmTask.EstimatedCost,
			CreatedAt:     baseTime,
			UpdatedAt:     baseTime,
		}
		tasks = append(tasks, task)
	}

	// If no tasks were parsed successfully, return at least one default task
	if len(tasks) == 0 {
		return s.getFallbackTasks(err.Error())
	}

	return tasks
}
