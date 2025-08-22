package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Test data structures
type Task struct {
	ID            string  `json:"id"`
	ProjectID     string  `json:"project_id"`
	Name          string  `json:"name"`
	EstimatedCost float64 `json:"estimated_cost"`
	Status        string  `json:"status"`
}

type Project struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	EstimatedCost float64 `json:"estimated_cost"`
	Tasks         []Task  `json:"tasks"`
}

func main() {
	// Test the estimated cost calculation
	baseURL := "http://localhost:8080"

	// Create a test project with tasks
	projectData := map[string]interface{}{
		"name":        "Test Estimated Cost Project",
		"description": "Testing estimated cost calculation",
		"model":       "GPT_4",
	}

	projectJSON, _ := json.Marshal(projectData)

	fmt.Println("Creating test project...")
	resp, err := http.Post(baseURL+"/api/projects", "application/json", bytes.NewBuffer(projectJSON))
	if err != nil {
		log.Printf("Failed to create project: %v", err)
		return
	}
	defer resp.Body.Close()

	var createResult map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&createResult); err != nil {
		log.Printf("Failed to decode create response: %v", err)
		return
	}

	projectID, ok := createResult["id"].(string)
	if !ok {
		log.Printf("No project ID in response")
		return
	}

	fmt.Printf("Created project with ID: %s\n", projectID)

	// Create some test tasks with different estimated costs
	tasks := []map[string]interface{}{
		{
			"name":           "Task 1",
			"estimated_cost": 100.50,
			"status":         "created",
		},
		{
			"name":           "Task 2",
			"estimated_cost": 200.75,
			"status":         "created",
		},
		{
			"name":           "Task 3 - No Cost",
			"estimated_cost": 0.0,
			"status":         "created",
		},
	}

	fmt.Println("Creating test tasks...")
	for _, taskData := range tasks {
		taskData["project_id"] = projectID
		taskJSON, _ := json.Marshal(taskData)

		taskResp, err := http.Post(baseURL+"/api/tasks", "application/json", bytes.NewBuffer(taskJSON))
		if err != nil {
			log.Printf("Failed to create task: %v", err)
			continue
		}
		taskResp.Body.Close()
	}

	// Wait a moment for tasks to be created
	time.Sleep(1 * time.Second)

	// Fetch the project and check estimated cost
	fmt.Println("Fetching project to check estimated cost...")
	getResp, err := http.Get(baseURL + "/api/projects/" + projectID)
	if err != nil {
		log.Printf("Failed to fetch project: %v", err)
		return
	}
	defer getResp.Body.Close()

	var project Project
	if err := json.NewDecoder(getResp.Body).Decode(&project); err != nil {
		log.Printf("Failed to decode project response: %v", err)
		return
	}

	fmt.Printf("\nProject Details:\n")
	fmt.Printf("Name: %s\n", project.Name)
	fmt.Printf("Estimated Cost: ¥%.2f\n", project.EstimatedCost)
	fmt.Printf("Number of Tasks: %d\n", len(project.Tasks))

	expectedCost := 100.50 + 200.75 + 0.0
	fmt.Printf("Expected Cost: ¥%.2f\n", expectedCost)

	if project.EstimatedCost == expectedCost {
		fmt.Printf("✅ SUCCESS: Estimated cost calculation is working correctly!\n")
	} else {
		fmt.Printf("❌ ERROR: Expected ¥%.2f but got ¥%.2f\n", expectedCost, project.EstimatedCost)
	}

	// Test project list endpoint
	fmt.Println("\nTesting project list endpoint...")
	listResp, err := http.Get(baseURL + "/api/projects")
	if err != nil {
		log.Printf("Failed to fetch projects list: %v", err)
		return
	}
	defer listResp.Body.Close()

	var projects []Project
	if err := json.NewDecoder(listResp.Body).Decode(&projects); err != nil {
		log.Printf("Failed to decode projects list response: %v", err)
		return
	}

	// Find our test project
	for _, p := range projects {
		if p.ID == projectID {
			fmt.Printf("Found test project in list with estimated cost: ¥%.2f\n", p.EstimatedCost)
			if p.EstimatedCost == expectedCost {
				fmt.Printf("✅ SUCCESS: Project list also shows correct estimated cost!\n")
			} else {
				fmt.Printf("❌ ERROR: Project list shows incorrect estimated cost\n")
			}
			break
		}
	}

	// Cleanup - delete the test project
	fmt.Println("\nCleaning up test project...")
	deleteReq, _ := http.NewRequest("DELETE", baseURL+"/api/projects/"+projectID, nil)
	client := &http.Client{}
	delResp, err := client.Do(deleteReq)
	if err != nil {
		log.Printf("Failed to delete test project: %v", err)
	} else {
		delResp.Body.Close()
		fmt.Println("Test project deleted successfully")
	}
}
