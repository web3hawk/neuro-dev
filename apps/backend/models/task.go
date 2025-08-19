package models

import "time"

type Task struct {
	ID           string      `json:"id" gorm:"primaryKey;size:64"`
	ProjectID    string      `json:"project_id" gorm:"index;size:64"`
	Name         string      `json:"name"`
	Description  string      `json:"description"`
	Type         string      `json:"type"`
	Status       string      `json:"status"`
	Priority     int         `json:"priority"`
	AssignedRole string      `json:"assigned_role"`
	CurrentPhase string      `json:"current_phase"`
	Progress     int         `json:"progress"`
	Requirements string      `json:"requirements"`
	Language     string      `json:"language"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	Results      TaskResults `json:"results" gorm:"embedded;embeddedPrefix:results_"`
}

type TaskResults struct {
	DemandAnalysis string `json:"demand_analysis,omitempty"`
	LanguageChoice string `json:"language_choice,omitempty"`
	CodeGeneration string `json:"code_generation,omitempty"`
	ArtDesign      string `json:"art_design,omitempty"`
	TestResults    string `json:"test_results,omitempty"`
	ReviewComments string `json:"review_comments,omitempty"`
	FinalCode      string `json:"final_code,omitempty"`
}
