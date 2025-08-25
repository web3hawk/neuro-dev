#!/usr/bin/env python3
"""
Test script for the new task-based ChatDev API
Tests the complete workflow: create project -> create tasks -> manage tasks -> execute tasks
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8080/api"

def test_api():
    print("=== Testing Task-Based ChatDev API ===\n")
    
    # Test 1: Create a new project
    print("1. Creating a new project...")
    project_data = {
        "name": "Task-Based Web App",
        "description": "A web application with user authentication and dashboard functionality",
        "organization": "ChatDev",
        "model": "GPT_4",
        "config": "default"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        if response.status_code == 200:
            project = response.json()["data"]
            project_id = project["id"]
            print(f"✓ Project created successfully: {project_id}")
            print(f"  Name: {project['name']}")
            print(f"  Status: {project['status']}")
            print(f"  Tasks: {len(project['tasks'])}\n")
        else:
            print(f"✗ Failed to create project: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error creating project: {e}")
        return False
    
    # Test 2: Create multiple tasks for the project
    print("2. Creating tasks for the project...")
    tasks_to_create = [
        {
            "name": "User Authentication System",
            "description": "Implement login, register, password reset functionality",
            "type": "feature",
            "priority": 1,
            "requirements": "Support JWT tokens, password hashing, email verification"
        },
        {
            "name": "Dashboard UI",
            "description": "Create responsive dashboard with charts and user data",
            "type": "feature", 
            "priority": 2,
            "requirements": "Use modern CSS framework, responsive design, data visualization"
        },
        {
            "name": "API Integration",
            "description": "Connect frontend to backend API endpoints",
            "type": "feature",
            "priority": 3,
            "requirements": "RESTful API, error handling, data validation"
        }
    ]
    
    created_tasks = []
    for task_data in tasks_to_create:
        try:
            response = requests.post(f"{BASE_URL}/projects/{project_id}/tasks", json=task_data)
            if response.status_code == 200:
                task = response.json()["data"]
                created_tasks.append(task)
                print(f"✓ Task created: {task['name']} (ID: {task['id']})")
            else:
                print(f"✗ Failed to create task: {response.status_code}")
        except Exception as e:
            print(f"✗ Error creating task: {e}")
    
    print(f"Created {len(created_tasks)} tasks\n")
    
    # Test 3: Get project tasks
    print("3. Retrieving project tasks...")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}/tasks")
        if response.status_code == 200:
            tasks = response.json()["data"]
            print(f"✓ Retrieved {len(tasks)} tasks:")
            for task in tasks:
                print(f"  - {task['name']} (Status: {task['status']}, Priority: {task['priority']})")
        else:
            print(f"✗ Failed to retrieve tasks: {response.status_code}")
    except Exception as e:
        print(f"✗ Error retrieving tasks: {e}")
    
    print()
    
    # Test 4: Update a task
    print("4. Updating a task...")
    if created_tasks:
        task_id = created_tasks[0]['id']
        update_data = {
            "name": "Enhanced User Authentication System",
            "description": "Implement advanced authentication with 2FA and social login",
            "priority": 1,
            "requirements": "Support JWT, 2FA, OAuth2, password policies"
        }
        
        try:
            response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data)
            if response.status_code == 200:
                updated_task = response.json()["data"]
                print(f"✓ Task updated successfully: {updated_task['name']}")
                print(f"  Description: {updated_task['description']}")
            else:
                print(f"✗ Failed to update task: {response.status_code}")
        except Exception as e:
            print(f"✗ Error updating task: {e}")
    
    print()
    
    # Test 5: Start task execution
    print("5. Starting task execution...")
    if created_tasks:
        task_id = created_tasks[0]['id']
        try:
            response = requests.post(f"{BASE_URL}/tasks/{task_id}/start")
            if response.status_code == 200:
                result = response.json()["data"]
                print(f"✓ Task execution started: {result['message']}")
                
                # Monitor task progress
                print("  Monitoring task progress...")
                for i in range(5):  # Monitor for 5 seconds
                    time.sleep(1)
                    status_response = requests.get(f"{BASE_URL}/tasks/{task_id}/status")
                    if status_response.status_code == 200:
                        status = status_response.json()["data"]
                        print(f"    Status: {status['status']}, Progress: {status['progress']}%, Phase: {status.get('current_phase', 'N/A')}")
                        if status['status'] == 'completed':
                            break
                    
            else:
                print(f"✗ Failed to start task: {response.status_code}")
        except Exception as e:
            print(f"✗ Error starting task: {e}")
    
    print()
    
    # Test 6: Get project status
    print("6. Checking overall project status...")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}/status")
        if response.status_code == 200:
            status = response.json()["data"]
            print(f"✓ Project Status: {status['status']}")
            print(f"  Progress: {status['progress']}%")
            print(f"  Total Tasks: {status['total_tasks']}")
            print(f"  Completed Tasks: {status['completed_tasks']}")
        else:
            print(f"✗ Failed to get project status: {response.status_code}")
    except Exception as e:
        print(f"✗ Error getting project status: {e}")
    
    print()
    
    # Test 7: Delete a task
    print("7. Deleting a task...")
    if len(created_tasks) > 1:
        task_id = created_tasks[-1]['id']  # Delete the last task
        try:
            response = requests.delete(f"{BASE_URL}/tasks/{task_id}")
            if response.status_code == 200:
                result = response.json()["data"]
                print(f"✓ Task deleted: {result['message']}")
            else:
                print(f"✗ Failed to delete task: {response.status_code}")
        except Exception as e:
            print(f"✗ Error deleting task: {e}")
    
    print("\n=== Test Completed ===")
    return True

def test_health_check():
    """Test if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()["data"]
            print(f"✓ Server is healthy: {data['status']} at {data['time']}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Cannot connect to server: {e}")
        print("Make sure the ChatDev backend is running on http://localhost:8080")
        return False

if __name__ == "__main__":
    print("Testing ChatDev Task-Based API")
    print("=" * 40)
    
    # First check if server is running
    if not test_health_check():
        print("\nPlease start the ChatDev backend server first:")
        print("cd backend && go run main.go")
        sys.exit(1)
    
    print()
    
    # Run the main tests
    if test_api():
        print("All tests completed successfully!")
    else:
        print("Some tests failed!")
        sys.exit(1)