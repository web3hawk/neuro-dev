# ChatDev Go-React

A front-end/back-end separated implementation of ChatDev using Go backend and React frontend.

## Architecture

### Backend (Go)
- REST API server
- ChatChain orchestration engine
- Configuration management
- AI model integration (OpenAI)
- File and project management

### Frontend (React)
- User interface for software development workflow
- Real-time progress monitoring
- Configuration management UI
- Generated code viewing and downloading

## API Endpoints

### Core Endpoints
- `POST /api/projects` - Create new software project
- `GET /api/projects/{id}` - Get project details
- `GET /api/projects/{id}/status` - Get project execution status
- `POST /api/projects/{id}/start` - Start project execution
- `GET /api/projects/{id}/logs` - Get project logs
- `GET /api/projects/{id}/files` - Get generated files
- `POST /api/projects/{id}/download` - Download project files

### Configuration Endpoints
- `GET /api/config/companies` - List available company configurations
- `GET /api/config/phases` - Get phase configurations
- `GET /api/config/roles` - Get role configurations
- `GET /api/models` - List available AI models

### WebSocket Endpoints
- `/ws/projects/{id}` - Real-time project updates

## Features

1. **Demand Analysis** - Analyze requirements and determine product modality
2. **Language Selection** - Choose appropriate programming language
3. **Code Generation** - Generate complete application code
4. **Art Design** - Design GUI elements and images
5. **Art Integration** - Integrate designed elements into the application
6. **Code Review** - Automated code review and suggestions
7. **Testing** - Execute tests and fix issues
8. **Documentation** - Generate project documentation

## Installation

### Backend
```bash
cd backend
go mod init neuro-dev
go mod tidy
go run main.go
```

### Frontend
```bash
cd frontend
npm install
npm start
```