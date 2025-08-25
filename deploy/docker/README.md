# Neuro-Dev Docker Deployment

This directory contains Docker configurations for containerizing and deploying the neuro-dev application with separate frontend and backend images.

## Overview

The Docker setup provides:
- **Backend Container**: Go application with multi-stage build
- **Frontend Container**: React application served by Nginx
- **Docker Compose**: Complete development environment
- **Build Scripts**: Automated image building and management

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (for build metadata)
- Bash shell (for build scripts)

## Quick Start

### 1. Build All Images
```bash
# From project root directory
cd neuro-dev
bash deploy/docker/build-all.sh
```

### 2. Run with Docker Compose
```bash
# Start all services
docker-compose -f deploy/docker/docker-compose.yml up -d

# View logs
docker-compose -f deploy/docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f deploy/docker/docker-compose.yml down
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Checks**: 
  - Frontend: http://localhost:3000/health
  - Backend: http://localhost:8080/health

## File Structure

```
deploy/docker/
├── README.md                 # This documentation
├── backend.Dockerfile        # Backend Go application
├── frontend.Dockerfile       # Frontend React application  
├── nginx.conf               # Nginx configuration for frontend
├── docker-compose.yml       # Development environment
├── build-backend.sh         # Backend build script
├── build-frontend.sh        # Frontend build script
└── build-all.sh            # Combined build script
```

## Individual Image Building

### Backend Image
```bash
# Build backend image
bash deploy/docker/build-backend.sh [TAG]

# Examples
bash deploy/docker/build-backend.sh latest
bash deploy/docker/build-backend.sh v1.0.0

# Run backend container
docker run -p 8080:8080 neuro-dev/backend:latest
```

### Frontend Image
```bash
# Build frontend image
bash deploy/docker/build-frontend.sh [TAG]

# Examples
bash deploy/docker/build-frontend.sh latest
bash deploy/docker/build-frontend.sh v1.0.0

# Run frontend container
docker run -p 3000:3000 neuro-dev/frontend:latest
```

## Combined Building

### Build All Images
```bash
# Basic usage
bash deploy/docker/build-all.sh [TAG] [REGISTRY] [PUSH]

# Examples
bash deploy/docker/build-all.sh                          # Build with 'latest' tag
bash deploy/docker/build-all.sh v1.2.0                   # Build with custom tag
bash deploy/docker/build-all.sh v1.2.0 my-registry.com  # Build and tag for registry
bash deploy/docker/build-all.sh v1.2.0 my-registry.com true  # Build, tag, and push
```

### Parameters
- **TAG**: Image tag (default: `latest`)
- **REGISTRY**: Container registry URL (optional)
- **PUSH**: Push to registry after build (`true`/`false`, default: `false`)

## Docker Compose Usage

### Development Environment
```bash
# Start services in development mode
docker-compose -f deploy/docker/docker-compose.yml up -d

# View service status
docker-compose -f deploy/docker/docker-compose.yml ps

# View logs for specific service
docker-compose -f deploy/docker/docker-compose.yml logs -f neuro-dev-backend
docker-compose -f deploy/docker/docker-compose.yml logs -f neuro-dev-frontend

# Execute commands in running containers
docker-compose -f deploy/docker/docker-compose.yml exec neuro-dev-backend /bin/sh
docker-compose -f deploy/docker/docker-compose.yml exec neuro-dev-frontend /bin/sh

# Stop and remove all services
docker-compose -f deploy/docker/docker-compose.yml down -v
```

### Production-like Environment
```bash
# Use environment-specific compose file
docker-compose -f deploy/docker/docker-compose.yml -f deploy/docker/docker-compose.prod.yml up -d
```

## Image Details

### Backend Image (`neuro-dev/backend`)
- **Base Image**: golang:1.20-alpine (builder), alpine:latest (runtime)
- **Port**: 8080
- **Health Check**: `GET /health`
- **Security**: Non-root user, minimal base image
- **Size**: ~15-25MB (estimated)

### Frontend Image (`neuro-dev/frontend`)
- **Base Image**: node:18-alpine (builder), nginx:alpine (runtime)
- **Port**: 3000
- **Health Check**: `GET /health`
- **Features**: Gzip compression, security headers, API proxying
- **Size**: ~25-35MB (estimated)

## Configuration

### Environment Variables

#### Backend
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment mode
- `NEURO_SETTINGS_PATH`: Configuration file path

#### Frontend
- `REACT_APP_API_URL`: Backend API URL
- `NODE_ENV`: Environment mode

### Volume Mounts
- `backend-data`: Backend application data
- `./logs`: Application logs (development)

### Networking
- **Network Name**: `neuro-dev-network`
- **Backend Service**: `neuro-dev-backend:8080`
- **Frontend Service**: `neuro-dev-frontend:3000`

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean Docker build cache
docker system prune -af

# Rebuild without cache
docker build --no-cache -f deploy/docker/backend.Dockerfile -t neuro-dev/backend:latest .
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8080
netstat -tulpn | grep :3000

# Use different ports
docker run -p 8081:8080 neuro-dev/backend:latest
docker run -p 3001:3000 neuro-dev/frontend:latest
```

#### Container Health Issues
```bash
# Check container logs
docker logs neuro-dev-backend
docker logs neuro-dev-frontend

# Inspect container
docker inspect neuro-dev-backend
docker inspect neuro-dev-frontend

# Execute interactive shell
docker exec -it neuro-dev-backend /bin/sh
docker exec -it neuro-dev-frontend /bin/sh
```

### Performance Optimization

#### Multi-stage Build Benefits
- Smaller final images (excludes build dependencies)
- Better layer caching
- Security improvements (fewer attack vectors)

#### Build Cache Optimization
```bash
# Pre-download dependencies for better caching
docker build --target builder -f deploy/docker/backend.Dockerfile -t neuro-dev/backend:builder .
```

## Production Deployment

### Registry Push
```bash
# Tag for production registry
docker tag neuro-dev/backend:latest your-registry.com/neuro-dev/backend:v1.0.0
docker tag neuro-dev/frontend:latest your-registry.com/neuro-dev/frontend:v1.0.0

# Push to registry
docker push your-registry.com/neuro-dev/backend:v1.0.0
docker push your-registry.com/neuro-dev/frontend:v1.0.0
```

### Kubernetes Integration
The Docker images work seamlessly with the Kubernetes charts in `deploy/charts/`:
```bash
# Update image tags in values.yaml
helm upgrade neuro-dev deploy/charts/neuro-dev \
  --set backend.image.tag=v1.0.0 \
  --set frontend.image.tag=v1.0.0
```

## Security Considerations

### Image Security
- Non-root users in containers
- Minimal base images (Alpine Linux)
- No unnecessary packages or files
- Security headers in Nginx configuration

### Best Practices
- Regular image updates
- Vulnerability scanning
- Secret management via environment variables
- Network isolation with Docker networks

## Development Workflow

### Local Development
1. Make code changes
2. Build new images: `bash deploy/docker/build-all.sh dev`
3. Update compose and restart: `docker-compose up -d --build`
4. Test changes
5. Tag and push when ready: `bash deploy/docker/build-all.sh v1.x.x registry.com true`

### CI/CD Integration
```bash
# Example CI/CD pipeline step
#!/bin/bash
set -e

# Build and test
bash deploy/docker/build-all.sh ${CI_COMMIT_TAG:-latest}

# Push to registry
bash deploy/docker/build-all.sh ${CI_COMMIT_TAG:-latest} ${DOCKER_REGISTRY} true

# Deploy to staging/production
helm upgrade neuro-dev deploy/charts/neuro-dev --set backend.image.tag=${CI_COMMIT_TAG:-latest}
```

## Support and Maintenance

### Monitoring
- Container health checks enabled
- Application logs available via Docker logs
- Metrics collection ready for integration

### Updates
- Regularly update base images
- Monitor for security vulnerabilities
- Test image updates in development first

For issues or questions, check the logs and container status, or contact the development team.