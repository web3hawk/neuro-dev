// Test script to reproduce the project deletion bug
// This script tests the current behavior of project deletion

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testProjectDeletion() {
    console.log('Testing project deletion bug...\n');
    
    try {
        // First, try to get the list of projects
        console.log('1. Getting current projects...');
        const projectsResponse = await axios.get(`${BASE_URL}/projects`);
        const projects = projectsResponse.data.data || projectsResponse.data;
        
        if (projects.length === 0) {
            console.log('No projects found. Creating a test project first...');
            
            // Create a test project
            const newProject = {
                name: "Test Project for Delete",
                description: "This project is created to test deletion functionality",
                organization: "Test Org",
                model: "GPT_4",
                vendors: "AWS, Azure"
            };
            
            const createResponse = await axios.post(`${BASE_URL}/projects`, newProject);
            const createdProject = createResponse.data.data || createResponse.data;
            console.log('Test project created:', createdProject.id);
            
            // Get updated project list
            const updatedResponse = await axios.get(`${BASE_URL}/projects`);
            const updatedProjects = updatedResponse.data.data || updatedResponse.data;
            console.log('Updated project count:', updatedProjects.length);
        } else {
            console.log(`Found ${projects.length} existing projects`);
        }
        
        // Try to delete the first project
        const projectToDelete = projects.length > 0 ? projects[0] : null;
        if (projectToDelete) {
            console.log(`\n2. Attempting to delete project: ${projectToDelete.name} (${projectToDelete.id})`);
            
            try {
                const deleteResponse = await axios.delete(`${BASE_URL}/projects/${projectToDelete.id}`);
                console.log('Delete response:', deleteResponse.status, deleteResponse.data);
            } catch (deleteError) {
                if (deleteError.response) {
                    console.log('Delete failed with status:', deleteError.response.status);
                    console.log('Error message:', deleteError.response.statusText);
                    
                    // Check if it's a 404 (method not found) which would confirm our bug
                    if (deleteError.response.status === 404) {
                        console.log('✓ BUG CONFIRMED: Delete endpoint does not exist (404 Not Found)');
                    }
                } else {
                    console.log('Delete failed with error:', deleteError.message);
                }
            }
        }
        
        // Verify project still exists after "deletion"
        console.log('\n3. Checking if project still exists after deletion attempt...');
        const verifyResponse = await axios.get(`${BASE_URL}/projects`);
        const finalProjects = verifyResponse.data.data || verifyResponse.data;
        console.log('Project count after deletion attempt:', finalProjects.length);
        
        if (projectToDelete && finalProjects.find(p => p.id === projectToDelete.id)) {
            console.log('✓ BUG CONFIRMED: Project still exists after deletion attempt');
        } else if (projectToDelete) {
            console.log('✓ SUCCESS: Project was successfully deleted!');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('Cannot connect to backend server. Please make sure the server is running on port 8080.');
        } else {
            console.log('Error during test:', error.message);
        }
    }
}

testProjectDeletion();