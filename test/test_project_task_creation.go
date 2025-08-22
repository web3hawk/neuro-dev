package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Test struct to match the CreateProjectRequest
type CreateProjectRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Organization string `json:"organization"`
	Model        string `json:"model"`
	Vendors      string `json:"vendors"`
}

// Test struct to match the Project response
type Project struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	Organization string     `json:"organization"`
	Model        string     `json:"model"`
	Status       string     `json:"status"`
	Vendors      string     `json:"vendors"`
	Tasks        []TestTask `json:"tasks"`
}

type TestTask struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
	ProjectID   string `json:"project_id"`
}

func main() {
	// Test server URL - adjust if needed
	baseURL := "http://localhost:8080/api"

	fmt.Println("Testing project creation without tasks...")

	// Create a test project
	createReq := CreateProjectRequest{
		Name:         "Test Project",
		Description:  "A test project to verify task creation logic",
		Organization: "Test Org",
		Model:        "gpt-4",
		Vendors:      "阿里云,腾讯云",
	}

	// Convert to JSON
	reqBody, err := json.Marshal(createReq)
	if err != nil {
		fmt.Printf("Error marshaling request: %v\n", err)
		return
	}

	// Create project
	resp, err := http.Post(baseURL+"/projects", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		fmt.Printf("Error creating project: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Failed to create project. Status: %d\n", resp.StatusCode)
		return
	}

	// Parse response
	var project Project
	if err := json.NewDecoder(resp.Body).Decode(&project); err != nil {
		fmt.Printf("Error decoding create response: %v\n", err)
		return
	}

	fmt.Printf("✓ Project created successfully: %s (ID: %s)\n", project.Name, project.ID)
	fmt.Printf("✓ Project status: %s\n", project.Status)
	fmt.Printf("✓ Number of tasks after creation: %d\n", len(project.Tasks))

	if len(project.Tasks) == 0 {
		fmt.Println("✅ PASS: No tasks were created during project creation")
	} else {
		fmt.Println("❌ FAIL: Tasks were created during project creation")
		return
	}

	// Wait a moment
	time.Sleep(1 * time.Second)

	// Now start the project
	fmt.Println("\nTesting project start with task creation...")

	startResp, err := http.Post(baseURL+"/projects/"+project.ID+"/start", "application/json", nil)
	if err != nil {
		fmt.Printf("Error starting project: %v\n", err)
		return
	}
	defer startResp.Body.Close()

	if startResp.StatusCode != http.StatusOK {
		fmt.Printf("Failed to start project. Status: %d\n", startResp.StatusCode)
		return
	}

	fmt.Println("✓ Project start request sent successfully")

	// Wait a moment for tasks to be created
	time.Sleep(2 * time.Second)

	// Check project status to see if tasks were created
	statusResp, err := http.Get(baseURL + "/projects/" + project.ID + "/status")
	if err != nil {
		fmt.Printf("Error getting project status: %v\n", err)
		return
	}
	defer statusResp.Body.Close()

	if statusResp.StatusCode != http.StatusOK {
		fmt.Printf("Failed to get project status. Status: %d\n", statusResp.StatusCode)
		return
	}

	// Parse status response
	var statusData map[string]interface{}
	if err := json.NewDecoder(statusResp.Body).Decode(&statusData); err != nil {
		fmt.Printf("Error decoding status response: %v\n", err)
		return
	}

	totalTasks, ok := statusData["total_tasks"].(float64)
	if !ok {
		fmt.Println("Error: Could not get total_tasks from status response")
		return
	}

	fmt.Printf("✓ Number of tasks after starting project: %.0f\n", totalTasks)

	if totalTasks > 0 {
		fmt.Println("✅ PASS: Tasks were created when starting the project")
	} else {
		fmt.Println("❌ FAIL: No tasks were created when starting the project")
		return
	}

	fmt.Println("\n🎉 All tests passed! The issue has been resolved:")
	fmt.Println("   - Projects are created without tasks")
	fmt.Println("   - Tasks are only generated when starting the project")
}
