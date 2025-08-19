package services

import (
	"time"

	"github.com/google/uuid"
	"neuro-dev/models"
)

func (s *Service) callLLMAPI(prompt string, model string) []models.Task {
	// For now, implement a basic task generation based on the prompt
	// In a real implementation, this would call an actual LLM API

	// Extract project description from the prompt
	// This is a simplified implementation that generates tasks based on common patterns

	tasks := []models.Task{}

	// Generate basic tasks based on the prompt content
	if len(prompt) > 0 {
		baseTime := time.Now()

		// Task 1: Requirements Analysis
		tasks = append(tasks, models.Task{
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
		})

		// Task 2: Design and Architecture
		tasks = append(tasks, models.Task{
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
		})

		// Task 3: Implementation
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "功能实现",
			Description:  "实现核心功能模块",
			Type:         "feature",
			Status:       "pending",
			Priority:     3,
			AssignedRole: "developer",
			Requirements: "编码实现、代码审查、单元测试",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})

		// Task 4: Testing
		tasks = append(tasks, models.Task{
			ID:           uuid.NewString(),
			Name:         "测试验证",
			Description:  "进行全面的功能和性能测试",
			Type:         "enhancement",
			Status:       "pending",
			Priority:     4,
			AssignedRole: "tester",
			Requirements: "测试用例、性能测试、用户验收测试",
			CreatedAt:    baseTime,
			UpdatedAt:    baseTime,
		})
	}

	return tasks
}
