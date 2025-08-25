#!/bin/bash

# Neuro-Dev Deployment Script
# This script helps deploy the neuro-dev application to Kubernetes

set -e

# Default values
NAMESPACE="neuro-dev"
RELEASE_NAME="neuro-dev"
CHART_PATH="./deploy"
VALUES_FILE=""
DRY_RUN=false
UPGRADE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --namespace NAMESPACE    Kubernetes namespace (default: neuro-dev)"
    echo "  -r, --release RELEASE        Helm release name (default: neuro-dev)"
    echo "  -f, --values FILE            Custom values file"
    echo "  -u, --upgrade                Upgrade existing deployment"
    echo "  -d, --dry-run                Perform a dry run"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Install with default values"
    echo "  $0 -f custom-values.yaml             # Install with custom values"
    echo "  $0 -u -f production-values.yaml      # Upgrade with production values"
    echo "  $0 -d -f values.yaml                 # Dry run with custom values"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -r|--release)
            RELEASE_NAME="$2"
            shift 2
            ;;
        -f|--values)
            VALUES_FILE="$2"
            shift 2
            ;;
        -u|--upgrade)
            UPGRADE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_error "Helm is not installed. Please install Helm 3.x"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl"
        exit 1
    fi
    
    # Check if we can connect to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Create namespace if it doesn't exist
create_namespace() {
    print_status "Checking namespace: $NAMESPACE"
    
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_status "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
        print_success "Namespace created: $NAMESPACE"
    else
        print_status "Namespace already exists: $NAMESPACE"
    fi
}

# Deploy or upgrade the application
deploy_application() {
    print_status "Deploying neuro-dev application..."
    
    # Build helm command
    HELM_CMD="helm"
    
    if [ "$UPGRADE" = true ]; then
        HELM_CMD="$HELM_CMD upgrade"
    else
        HELM_CMD="$HELM_CMD install"
    fi
    
    HELM_CMD="$HELM_CMD $RELEASE_NAME $CHART_PATH"
    HELM_CMD="$HELM_CMD --namespace $NAMESPACE"
    HELM_CMD="$HELM_CMD --create-namespace"
    
    if [ -n "$VALUES_FILE" ]; then
        if [ -f "$VALUES_FILE" ]; then
            HELM_CMD="$HELM_CMD --values $VALUES_FILE"
            print_status "Using custom values file: $VALUES_FILE"
        else
            print_error "Values file not found: $VALUES_FILE"
            exit 1
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        HELM_CMD="$HELM_CMD --dry-run --debug"
        print_warning "Performing dry run..."
    fi
    
    # Execute helm command
    print_status "Executing: $HELM_CMD"
    eval $HELM_CMD
    
    if [ "$DRY_RUN" = false ]; then
        print_success "Deployment completed successfully"
    else
        print_success "Dry run completed successfully"
    fi
}

# Show deployment status
show_status() {
    if [ "$DRY_RUN" = false ]; then
        print_status "Checking deployment status..."
        
        echo ""
        echo "Helm Release Status:"
        helm status "$RELEASE_NAME" --namespace "$NAMESPACE"
        
        echo ""
        echo "Kubernetes Resources:"
        kubectl get pods,services,ingress --namespace "$NAMESPACE"
        
        echo ""
        print_status "To access the application:"
        print_status "Frontend: kubectl port-forward service/${RELEASE_NAME}-frontend 8080:80 --namespace $NAMESPACE"
        print_status "Backend: kubectl port-forward service/${RELEASE_NAME}-backend 8081:8080 --namespace $NAMESPACE"
        
        if kubectl get ingress --namespace "$NAMESPACE" &> /dev/null; then
            INGRESS_HOST=$(kubectl get ingress --namespace "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
            if [ -n "$INGRESS_HOST" ]; then
                print_status "Or access via ingress: http://$INGRESS_HOST"
            fi
        fi
    fi
}

# Main execution
main() {
    print_status "Starting neuro-dev deployment..."
    print_status "Release: $RELEASE_NAME"
    print_status "Namespace: $NAMESPACE"
    print_status "Chart: $CHART_PATH"
    
    check_prerequisites
    create_namespace
    deploy_application
    show_status
    
    print_success "Deployment script completed!"
}

# Run main function
main