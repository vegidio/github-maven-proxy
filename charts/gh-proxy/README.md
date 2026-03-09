# GitHub Maven Proxy Helm Chart

A minimal Helm chart for deploying the GitHub Maven Proxy application to Kubernetes.

## Design Philosophy

This chart follows a **simplified approach** suitable for a reverse proxy application. It provides the essential Kubernetes resources with minimal configuration options.

The **Ingress resource is included in the chart** but **disabled by default**. This allows you to enable and configure it from your **GitOps repository** using environment-specific values, while keeping the Ingress definition in the application chart where it belongs.

**Other environment-specific configurations** such as HorizontalPodAutoscaler, resource limits, security contexts, node selectors, and other advanced features should be managed in your **GitOps repository** using Kustomize overlays or environment-specific value files.

## What's Included

This chart deploys:
- **Deployment**: Runs the application container with basic health probes
- **Service**: ClusterIP service exposing port 80
- **Ingress**: Disabled by default, can be enabled and configured from GitOps repo

## What's NOT Included (Belongs in GitOps Repo)

The following should be configured per environment in your GitOps repository:
- **HorizontalPodAutoscaler**: Autoscaling rules based on CPU/memory
- **Resource limits**: CPU and memory requests/limits
- **Security contexts**: Pod and container security settings
- **ServiceAccount**: Custom service accounts and RBAC
- **Node scheduling**: Node selectors, tolerations, affinity rules
- **Volumes**: ConfigMaps, Secrets, PersistentVolumes
- **Annotations and labels**: Environment-specific metadata

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+

## Installing the Chart

```bash
helm install gh-proxy ./charts/gh-proxy
```

With custom image tag:

```bash
helm install gh-proxy ./charts/gh-proxy --set image.tag=latest
```

## Configuration

| Parameter | Description | Default                              |
|-----------|-------------|--------------------------------------|
| `replicaCount` | Number of replicas | `1`                                  |
| `image.repository` | Image repository | `ghcr.io/vegidio/gh-maven-proxy`     |
| `image.pullPolicy` | Image pull policy | `IfNotPresent`                       |
| `image.tag` | Image tag (overrides appVersion) | `"latest"`                           |
| `nameOverride` | Override chart name | `""`                                 |
| `fullnameOverride` | Override full name | `""`                                 |
| `env.GITHUB_USER` | GitHub username for authentication | `""`                                 |
| `env.GITHUB_TOKEN` | GitHub personal access token | `""`                                 |
| `service.type` | Service type | `ClusterIP`                          |
| `service.port` | Service port | `80`                                 |
| `ingress.enabled` | Enable ingress | `true`                               |
| `ingress.className` | Ingress class name | `"nginx"`                            |
| `ingress.annotations` | Ingress annotations | `{}`                                 |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml                      |
| `ingress.tls` | Ingress TLS configuration | `[]`                                 |

## GitOps Deployment with ArgoCD

This chart is designed for GitOps workflows. In your GitOps repository, create environment-specific configurations:

### Directory Structure Example

```
gitops-repo/
├── base/
│   └── application.yaml          # ArgoCD Application pointing to this chart
├── overlays/
    ├── staging/
    │   ├── values.yaml           # Staging values (enable ingress, set hostname)
    │   └── hpa.yaml              # Staging autoscaling
    └── production/
        ├── values.yaml           # Production values (enable ingress, TLS, etc.)
        ├── hpa.yaml              # Production autoscaling
        └── resources.yaml        # Production resource limits
```

### Example ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gh-proxy-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/vegidio/github-maven-proxy
    targetRevision: main
    path: charts/gh-proxy
    helm:
      values: |
        image:
          tag: "latest"
        replicaCount: 3
        env:
          GITHUB_USER: "your-github-username"
          GITHUB_TOKEN: "your-personal-access-token"
        ingress:
          enabled: true
          className: nginx
          annotations:
            cert-manager.io/cluster-issuer: letsencrypt-prod
          hosts:
            - host: maven.vinicius.io
              paths:
                - path: /
                  pathType: Prefix
          tls:
            - secretName: gh-proxy-tls
              hosts:
                - maven.vinicius.io
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Example Environment-Specific Values (in GitOps Repo)

**Production Values** (`overlays/production/values.yaml`):
```yaml
image:
  tag: "latest"

replicaCount: 3

env:
  GITHUB_USER: "your-github-username"
  GITHUB_TOKEN: "your-personal-access-token"

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: maven.vinicius.io
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: gh-proxy-tls
      hosts:
        - maven.vinicius.io
```

**Staging Values** (`overlays/staging/values.yaml`):
```yaml
image:
  tag: "latest"

env:
  GITHUB_USER: "your-github-username"
  GITHUB_TOKEN: "your-personal-access-token"

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: gh-proxy-staging.example.com
      paths:
        - path: /
          pathType: Prefix
```

### Example Additional Resources (in GitOps Repo)

**HorizontalPodAutoscaler** (`overlays/production/hpa.yaml`):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gh-proxy
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gh-proxy
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
```

## Benefits of This Approach

1. **Simplicity**: The chart remains simple and focused on the application deployment
2. **Ingress in the Right Place**: Ingress definition lives with the app chart, but configuration comes from GitOps
3. **Separation of Concerns**: Application deployment logic vs environment configuration
4. **Environment Flexibility**: Each environment can have different ingress, scaling, and security policies
5. **GitOps Best Practices**: Environment-specific configurations are versioned in the GitOps repo
6. **No Duplication**: Ingress template is defined once in the chart, not duplicated per environment
