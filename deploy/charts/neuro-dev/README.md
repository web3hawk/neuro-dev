# Neuro-Dev Kubernetes Deployment

This directory contains Helm charts for deploying the neuro-dev application to Kubernetes.

## Prerequisites

- Kubernetes cluster (version 1.20+)
- Helm 3.x installed
- kubectl configured to access your cluster
- NGINX Ingress Controller (if using ingress)

## Project Structure

```
deploy/
├── Chart.yaml                 # Chart metadata
├── values.yaml               # Default configuration values
├── README.md                 # This file
└── templates/
    ├── namespace.yaml        # Namespace definition
    ├── backend-deployment.yaml    # Backend deployment
    ├── backend-service.yaml       # Backend service
    ├── frontend-deployment.yaml   # Frontend deployment
    ├── frontend-service.yaml      # Frontend service
    ├── configmap.yaml        # Configuration data
    ├── secret.yaml           # Sensitive data
    └── ingress.yaml          # External access configuration
```

## Quick Start

1. **Install the chart with default values:**
   ```bash
   helm install neuro-dev ./deploy
   ```

2. **Install with custom values:**
   ```bash
   helm install neuro-dev ./deploy -f custom-values.yaml
   ```

3. **Upgrade an existing deployment:**
   ```bash
   helm upgrade neuro-dev ./deploy
   ```

4. **Uninstall the deployment:**
   ```bash
   helm uninstall neuro-dev
   ```

## Configuration

### Key Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Kubernetes namespace | `neuro-dev` |
| `global.domain` | Base domain for ingress | `neuro-dev.local` |
| `backend.replicaCount` | Number of backend replicas | `1` |
| `backend.image.repository` | Backend image repository | `neuro-dev/backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `frontend.replicaCount` | Number of frontend replicas | `1` |
| `frontend.image.repository` | Frontend image repository | `neuro-dev/frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |

### Example Custom Values

Create a `custom-values.yaml` file:

```yaml
global:
  namespace: my-neuro-dev
  domain: myapp.example.com

backend:
  replicaCount: 3
  image:
    repository: my-registry/neuro-dev-backend
    tag: "v1.2.3"
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

frontend:
  replicaCount: 2
  image:
    repository: my-registry/neuro-dev-frontend
    tag: "v1.2.3"

ingress:
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
          service: neuro-dev-frontend
        - path: /api
          pathType: Prefix
          service: neuro-dev-backend
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
```

## Building Docker Images

Before deploying, you need to build and push Docker images for both services:

### Backend (Go application)
```bash
cd apps/backend
docker build -t neuro-dev/backend:latest .
docker push neuro-dev/backend:latest
```

### Frontend (React application)
```bash
cd apps/frontend
docker build -t neuro-dev/frontend:latest .
docker push neuro-dev/frontend:latest
```

## Deployment Commands

### Development Environment
```bash
# Install with development values
helm install neuro-dev ./deploy --set ingress.hosts[0].host=neuro-dev.local

# Port forward for local access (if not using ingress)
kubectl port-forward service/neuro-dev-frontend 8080:80
kubectl port-forward service/neuro-dev-backend 8081:8080
```

### Production Environment
```bash
# Install with production values
helm install neuro-dev ./deploy \
  --set backend.replicaCount=3 \
  --set frontend.replicaCount=2 \
  --set backend.resources.requests.memory=512Mi \
  --set backend.resources.limits.memory=1Gi
```

## Monitoring and Troubleshooting

### Check deployment status:
```bash
kubectl get pods -n neuro-dev
kubectl get services -n neuro-dev
kubectl get ingress -n neuro-dev
```

### View logs:
```bash
kubectl logs -f deployment/neuro-dev-backend -n neuro-dev
kubectl logs -f deployment/neuro-dev-frontend -n neuro-dev
```

### Debug issues:
```bash
kubectl describe pod <pod-name> -n neuro-dev
helm status neuro-dev
helm get values neuro-dev
```

## Security Considerations

1. **Secrets Management**: Update the secret templates with actual sensitive data
2. **RBAC**: Consider implementing Role-Based Access Control
3. **Network Policies**: Implement network policies for additional security
4. **TLS**: Configure TLS certificates for production use

## Scaling

Scale the application horizontally:
```bash
kubectl scale deployment neuro-dev-backend --replicas=5 -n neuro-dev
kubectl scale deployment neuro-dev-frontend --replicas=3 -n neuro-dev
```

## Updates and Rollbacks

```bash
# Update to new image version
helm upgrade neuro-dev ./deploy --set backend.image.tag=v1.2.4

# Rollback to previous version
helm rollback neuro-dev 1
```

## Support

For issues and questions:
- Check the application logs
- Verify Kubernetes cluster status
- Review Helm chart values
- Contact the development team