package models

type CreateProjectRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Organization string `json:"organization"`
	Model        string `json:"model"`
	Config       string `json:"config"`
	Vendors      string `json:"vendors"`
}

type CreateTaskRequest struct {
	ProjectID     string  `json:"project_id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Type          string  `json:"type"`
	Priority      int     `json:"priority"`
	Requirements  string  `json:"requirements"`
	EstimatedDays int     `json:"estimated_days"`
	EstimatedCost float64 `json:"estimated_cost"`
	ExpenseType   string  `json:"expense_type"`
}
