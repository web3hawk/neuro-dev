package main

import (
	"encoding/json"
	"fmt"
	"log"
)

// TaskFromLLM struct as defined in ai_service.go
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

// Test with requirements as array (what LLM might be returning)
func testArrayRequirements() {
	jsonWithArrayRequirements := `[
		{
			"name": "Task 1",
			"description": "Test task",
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
	} else {
		fmt.Println("Array requirements parsed successfully")
	}
}

// Test with requirements as string (current expected format)
func testStringRequirements() {
	jsonWithStringRequirements := `[
		{
			"name": "Task 1",
			"description": "Test task",
			"type": "feature",
			"priority": 1,
			"assigned_role": "developer",
			"requirements": "req1, req2, req3",
			"estimated_days": 5,
			"estimated_cost": 1000.0
		}
	]`

	var llmTasks []TaskFromLLM
	err := json.Unmarshal([]byte(jsonWithStringRequirements), &llmTasks)
	if err != nil {
		log.Printf("Error with string requirements: %v", err)
	} else {
		fmt.Println("String requirements parsed successfully")
		fmt.Printf("Requirements: %s\n", llmTasks[0].Requirements)
	}
}

func main() {
	fmt.Println("Testing JSON parsing with different requirements formats:")
	fmt.Println("===========================================")

	fmt.Println("\n1. Testing with array requirements (what LLM returns):")
	testArrayRequirements()

	fmt.Println("\n2. Testing with string requirements (current expected format):")
	testStringRequirements()
}
