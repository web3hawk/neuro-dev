#!/bin/bash

# Combined build script for neuro-dev frontend and backend Docker images

set -e

# Configuration
TAG="${1:-latest}"
REGISTRY="${2:-}"
PUSH="${3:-false}"

# Image names
BACKEND_IMAGE="neuro-dev/backend"
FRONTEND_IMAGE="neuro-dev/frontend"

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 [TAG] [REGISTRY] [PUSH]"
    echo ""
    echo "Parameters:"
    echo "  TAG        Image tag (default: latest)"
    echo "  REGISTRY   Container registry URL (optional)"
    echo "  PUSH       Push to registry after build (true/false, default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build with 'latest' tag"
    echo "  $0 v1.0.0                           # Build with 'v1.0.0' tag"
    echo "  $0 v1.0.0 my-registry.com true     # Build, tag for registry, and push"
}

# Check if help is requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Prepare image names with registry if provided
if [ -n "$REGISTRY" ]; then
    BACKEND_IMAGE_FULL="${REGISTRY}/${BACKEND_IMAGE}"
    FRONTEND_IMAGE_FULL="${REGISTRY}/${FRONTEND_IMAGE}"
else
    BACKEND_IMAGE_FULL="${BACKEND_IMAGE}"
    FRONTEND_IMAGE_FULL="${FRONTEND_IMAGE}"
fi

print_status "Building neuro-dev Docker images..."
print_status "Tag: $TAG"
print_status "Registry: ${REGISTRY:-'(none)'}"
print_status "Push after build: $PUSH"

# Build backend image
print_status "========================================="
print_status "Building Backend Image"
print_status "========================================="

if ! bash deploy/docker/build-backend.sh "$TAG"; then
    print_error "Failed to build backend image"
    exit 1
fi

# Tag for registry if provided
if [ -n "$REGISTRY" ]; then
    print_status "Tagging backend image for registry..."
    docker tag "${BACKEND_IMAGE}:${TAG}" "${BACKEND_IMAGE_FULL}:${TAG}"
fi

# Build frontend image
print_status "========================================="
print_status "Building Frontend Image"
print_status "========================================="

if ! bash deploy/docker/build-frontend.sh "$TAG"; then
    print_error "Failed to build frontend image"
    exit 1
fi

# Tag for registry if provided
if [ -n "$REGISTRY" ]; then
    print_status "Tagging frontend image for registry..."
    docker tag "${FRONTEND_IMAGE}:${TAG}" "${FRONTEND_IMAGE_FULL}:${TAG}"
fi

# Push images if requested
if [ "$PUSH" = "true" ] && [ -n "$REGISTRY" ]; then
    print_status "========================================="
    print_status "Pushing Images to Registry"
    print_status "========================================="
    
    print_status "Pushing backend image..."
    docker push "${BACKEND_IMAGE_FULL}:${TAG}"
    
    print_status "Pushing frontend image..."
    docker push "${FRONTEND_IMAGE_FULL}:${TAG}"
    
    print_success "Images pushed successfully!"
fi

# Summary
print_status "========================================="
print_status "Build Summary"
print_status "========================================="

print_success "All images built successfully!"
print_status "Backend image:  ${BACKEND_IMAGE_FULL}:${TAG}"
print_status "Frontend image: ${FRONTEND_IMAGE_FULL}:${TAG}"

# Show image sizes
print_status "Image sizes:"
docker images "${BACKEND_IMAGE}:${TAG}" --format "{{.Repository}}:{{.Tag}} - {{.Size}}"
docker images "${FRONTEND_IMAGE}:${TAG}" --format "{{.Repository}}:{{.Tag}} - {{.Size}}"

print_status "To run the complete application:"
print_status "docker-compose up -d"

if [ "$PUSH" = "false" ] && [ -n "$REGISTRY" ]; then
    print_status "To push images to registry:"
    print_status "$0 $TAG $REGISTRY true"
fi