package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type CreateProjectRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Organization string `json:"organization"`
	Model        string `json:"model"`
}

func main() {
	baseURL := "http://localhost:8080"
	
	// Test creating multiple projects quickly to reproduce the issue
	for i := 0; i < 3; i++ {
		go func(id int) {
			req := CreateProjectRequest{
				Name:         fmt.Sprintf("Test Project %d", id),
				Description:  "Test project for reproducing duplicate task primary key issue",
				Organization: "Test Org",
				Model:        "test-model",
			}
			
			jsonData, err := json.Marshal(req)
			if err != nil {
				fmt.Printf("Error marshaling request %d: %v\n", id, err)
				return
			}
			
			resp, err := http.Post(baseURL+"/api/projects", "application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				fmt.Printf("Error creating project %d: %v\n", id, err)
				return
			}
			defer resp.Body.Close()
			
			if resp.StatusCode != http.StatusOK {
				fmt.Printf("Project %d creation failed with status: %d\n", id, resp.StatusCode)
			} else {
				fmt.Printf("Project %d created successfully\n", id)
			}
		}(i)
	}
	
	// Wait for goroutines to complete
	time.Sleep(5 * time.Second)
	
	// Try creating projects sequentially as well
	fmt.Println("\nTesting sequential creation...")
	for i := 3; i < 6; i++ {
		req := CreateProjectRequest{
			Name:         fmt.Sprintf("Sequential Test Project %d", i),
			Description:  "Sequential test project for reproducing duplicate task primary key issue",
			Organization: "Test Org",
			Model:        "test-model",
		}
		
		jsonData, err := json.Marshal(req)
		if err != nil {
			fmt.Printf("Error marshaling request %d: %v\n", i, err)
			continue
		}
		
		resp, err := http.Post(baseURL+"/api/projects", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Printf("Error creating project %d: %v\n", i, err)
			continue
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			fmt.Printf("Sequential project %d creation failed with status: %d\n", i, resp.StatusCode)
		} else {
			fmt.Printf("Sequential project %d created successfully\n", i)
		}
		
		time.Sleep(100 * time.Millisecond)
	}
}