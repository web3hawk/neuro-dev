package services

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"neuro-dev/models"
)

// Task-related service methods
func (s *Service) GenerateTasksFromDescription(description string, model string, vendors string) []models.Task {
	prompt := fmt.Sprintf(`作为一个资深的软件架构师，请参考以下云厂商的功能：
云厂商：%s
将以下项目描述分解成具体的开发任务。每个任务应该包含：任务名称、详细描述、类型（前端web研发/后端服务研发/测试/运维）、优先级（1-3）、具体要求、预计研发天数、预计研发费用。
项目描述：%s

请以JSON格式返回任务列表，格式如下：
[
  {
    "name": "任务名称",
    "description": "详细描述",
    "type": "研发",
    "priority": 1,
    "requirements": "具体要实现的功能",
    "estimated_days": 5,
    "estimated_cost": 12000

  }
]

请生成任务列表，按优先级排序。`, description, vendors)

	tasks := s.callLLMAPI(prompt, model)
	if len(tasks) == 0 {
		return s.getFallbackTasks("")
	}
	return tasks
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
