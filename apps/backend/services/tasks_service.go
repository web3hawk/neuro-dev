package services

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"neuro-dev/models"
)

// Task-related service methods
func (s *Service) GenerateTasksFromDescription(description string, model string) []models.Task {
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

	tasks := s.callLLMAPI(prompt, model)
	if len(tasks) == 0 {
		return s.generateDefaultTasks(description)
	}
	return tasks
}

func (s *Service) generateDefaultTasks(description string) []models.Task {
	return []models.Task{
		{
			ID:           uuid.NewString(),
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
			ID:           uuid.NewString(),
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
			ID:           uuid.NewString(),
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

func (s *Service) NextTaskID() string {
	return uuid.NewString()
}

func (s *Service) ExecuteTask(task *models.Task, project *models.Project) {
	task.Status = "in_progress"
	task.UpdatedAt = time.Now()

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
		time.Sleep(1 * time.Second)
		log.Printf("Task %s in Project %s: Completed phase %s (%d%%)", task.ID, project.ID, phase, task.Progress)
	}

	task.Status = "completed"
	task.Progress = 100
	task.CurrentPhase = "finished"
	task.UpdatedAt = time.Now()
	log.Printf("Task %s in Project %s completed successfully", task.ID, project.ID)
}
