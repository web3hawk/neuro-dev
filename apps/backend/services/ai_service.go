package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"neuro-dev/config"
	"neuro-dev/models"
)

func (s *Service) callLLMAPI(prompt string, model string) []models.Task {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Failed to load config: %v", err)
		return s.getFallbackTasks()
	}

	// Create OpenAI client
	llm, err := openai.New(
		openai.WithToken(cfg.LLM.ApiKey),
		openai.WithModel(cfg.LLM.Model),
		openai.WithBaseURL(cfg.LLM.BaseURL),
	)
	if err != nil {
		log.Printf("Failed to create OpenAI client: %v", err)
		return s.getFallbackTasks()
	}

	// Create the full prompt for task generation
	fullPrompt := fmt.Sprintf(`基于以下项目描述，请生成详细的开发任务清单。每个任务应该包含任务名称、描述、类型、优先级、负责角色和具体要求。

项目描述: %s

请按照以下JSON格式返回任务清单:
[
  {
    "name": "任务名称",
    "description": "任务描述",
    "type": "feature/enhancement/bug",
    "priority": 1,
    "assigned_role": "角色",
    "requirements": "具体要求"
  }
]

请生成4-6个具体的开发任务。`, prompt)

	ctx := context.Background()
	content := []llms.MessageContent{
		llms.TextParts(llms.ChatMessageTypeHuman, fullPrompt),
	}

	response, err := llm.GenerateContent(ctx, content, llms.WithTemperature(0.7))
	if err != nil {
		log.Printf("Failed to generate content: %v", err)
		return s.getFallbackTasks()
	}

	// Parse the response and convert to tasks
	tasks := s.parseTasksFromResponse(response.Choices[0].Content)
	if len(tasks) == 0 {
		log.Printf("Failed to parse tasks from LLM response")
		return s.getFallbackTasks()
	}

	return tasks
}

// getFallbackTasks returns default tasks when LLM API fails
func (s *Service) getFallbackTasks() []models.Task {
	baseTime := time.Now()
	return []models.Task{
		{
			ID:           uuid.NewString(),
			Name:         "需求分析",
			Description:  "分析项目需求并制定开发计划",
			Type:         "feature",
			Status:       "pending",
			Priority:     1,
			AssignedRole: "analyst",
			Requirements: "需求文档、技术规格、用户故事",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		},
		{
			ID:           uuid.NewString(),
			Name:         "系统设计",
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
	// Simple parsing - in production, use proper JSON parsing
	tasks := []models.Task{}
	baseTime := time.Now()

	// For now, create tasks based on common patterns in the response
	if strings.Contains(response, "需求") || strings.Contains(response, "分析") {
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "需求分析与规划",
			Description:  "基于LLM分析的项目需求进行详细规划",
			Type:         "feature",
			Status:       "pending",
			Priority:     1,
			AssignedRole: "analyst",
			Requirements: "根据LLM建议进行需求分析",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})
	}

	if strings.Contains(response, "设计") || strings.Contains(response, "架构") {
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "系统设计",
			Description:  "基于LLM建议进行系统架构设计",
			Type:         "feature",
			Status:       "pending",
			Priority:     2,
			AssignedRole: "architect",
			Requirements: "按照LLM提供的架构建议进行设计",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})
	}

	if strings.Contains(response, "开发") || strings.Contains(response, "实现") {
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "功能开发",
			Description:  "根据LLM建议实现核心功能",
			Type:         "feature",
			Status:       "pending",
			Priority:     3,
			AssignedRole: "developer",
			Requirements: "按照LLM指导进行功能实现",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})
	}

	if strings.Contains(response, "测试") {
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "测试验证",
			Description:  "按照LLM建议进行全面测试",
			Type:         "enhancement",
			Status:       "pending",
			Priority:     4,
			AssignedRole: "tester",
			Requirements: "根据LLM提供的测试策略进行验证",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})
	}

	// If no tasks were generated, return at least one default task
	if len(tasks) == 0 {
		tasks = append(tasks, models.Task{
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
		})
	}

	return tasks
}
