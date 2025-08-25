#!/bin/bash

# Build script for neuro-dev backend Docker image

set -e

# Configuration
IMAGE_NAME="neuro-dev/backend"
TAG="${1:-latest}"
DOCKERFILE="deploy/docker/backend.Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    print_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

# Build the image
print_status "Building backend Docker image..."
print_status "Image: ${IMAGE_NAME}:${TAG}"
print_status "Dockerfile: $DOCKERFILE"

docker build \
    --file "$DOCKERFILE" \
    --tag "${IMAGE_NAME}:${TAG}" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    .

if [ $? -eq 0 ]; then
    print_success "Backend image built successfully: ${IMAGE_NAME}:${TAG}"
    
    # Show image info
    print_status "Image details:"
    docker images "${IMAGE_NAME}:${TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    # Optional: Run basic validation
    print_status "Running basic image validation..."
    docker run --rm "${IMAGE_NAME}:${TAG}" --version 2>/dev/null || echo "Version check not available"
    
else
    print_error "Failed to build backend image"
    exit 1
fi

print_status "To run the image:"
print_status "docker run -p 8080:8080 ${IMAGE_NAME}:${TAG}"

print_status "To push the image:"
print_status "docker push ${IMAGE_NAME}:${TAG}"