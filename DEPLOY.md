  # Sharnom EKS Deployment Guide

## Prerequisites

- AWS CLI configured
- kubectl installed
- eksctl installed
- Domain name (optional, can use ALB DNS)

## Step 1: Create EKS Cluster

```bash
eksctl create cluster \
  --name sharnom-cluster \
  --region eu-north-1 \
  --nodegroup-name sharnom-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed
```

## Step 2: Configure kubectl

```bash
aws eks update-kubeconfig --region eu-north-1 --name sharnom-cluster
kubectl get nodes
```

## Step 3: Setup OIDC Provider

```bash
eksctl utils associate-iam-oidc-provider \
  --region eu-north-1 \
  --cluster sharnom-cluster \
  --approve
```

## Step 4: Create IAM Roles

### ECR Access Role
```bash
eksctl create iamserviceaccount \
  --name ecr-access \
  --namespace yellowbooks \
  --cluster sharnom-cluster \
  --region eu-north-1 \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly \
  --approve \
  --override-existing-serviceaccounts
```

### ALB Ingress Controller Policy
```bash
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

eksctl create iamserviceaccount \
  --cluster=sharnom-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::797583072626:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --region eu-north-1 \
  --approve
```

## Step 5: Install AWS Load Balancer Controller

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=sharnom-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=eu-north-1 \
  --set vpcId=<YOUR_VPC_ID>
```

Get VPC ID:
```bash
aws eks describe-cluster --name sharnom-cluster --region eu-north-1 --query "cluster.resourcesVpcConfig.vpcId" --output text
```

## Step 6: Request SSL Certificate (ACM)

```bash
aws acm request-certificate \
  --domain-name sharnom.yourdomain.com \
  --validation-method DNS \
  --region eu-north-1
```

Add DNS validation records to Route53, then wait for validation.

## Step 7: Deploy Application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy API (with PVC)
kubectl apply -f k8s/api-deployment.yaml

# Run migrations
kubectl apply -f k8s/migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/prisma-migration -n yellowbooks

# Deploy Web
kubectl apply -f k8s/web-deployment.yaml

# Setup HPA
kubectl apply -f k8s/hpa.yaml

# Deploy Ingress (update certificate ARN first!)
kubectl apply -f k8s/ingress.yaml
```

## Step 8: Configure Route53

```bash
# Get ALB DNS name
kubectl get ingress -n yellowbooks

# Create Route53 A record (Alias) pointing to ALB
```

## Step 9: Verify Deployment

```bash
# Check pods
kubectl get pods -n yellowbooks

# Check services
kubectl get svc -n yellowbooks

# Check ingress
kubectl get ingress -n yellowbooks

# Check HPA
kubectl get hpa -n yellowbooks

# View logs
kubectl logs -n yellowbooks -l app=sharnom-api
kubectl logs -n yellowbooks -l app=sharnom-web
```

## Step 10: GitHub Actions Setup

Add these secrets to GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`: eu-north-1
- `EKS_CLUSTER_NAME`: sharnom-cluster
- `KUBE_CONFIG_DATA`: (base64 encoded kubeconfig)

Get kubeconfig:
```bash
aws eks update-kubeconfig --region eu-north-1 --name sharnom-cluster
cat ~/.kube/config | base64
```

## Troubleshooting

### Pods not pulling images
```bash
# Check if ECR access is configured
kubectl get serviceaccount ecr-access -n yellowbooks
kubectl describe serviceaccount ecr-access -n yellowbooks
```

### ALB not created
```bash
# Check load balancer controller logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Check ingress events
kubectl describe ingress sharnom-ingress -n yellowbooks
```

### Database not persisting
```bash
# Check PVC
kubectl get pvc -n yellowbooks
kubectl describe pvc sharnom-api-pvc -n yellowbooks
```

## Clean Up

```bash
# Delete all resources
kubectl delete namespace yellowbooks
kubectl delete -f k8s/

# Delete cluster
eksctl delete cluster --name sharnom-cluster --region eu-north-1
```

## URLs

- Application: https://sharnom.yourdomain.com
- ALB Health Check: http://<ALB-DNS>/

## Architecture

```
Internet -> Route53 -> ALB (HTTPS) -> Ingress -> Services -> Pods
                                                    |
                                                    +-> sharnom-web (2-10 replicas)
                                                    +-> sharnom-api (2-5 replicas)
                                                              |
                                                              +-> PVC (SQLite DB)
```
