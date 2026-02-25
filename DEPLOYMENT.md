# Production Deployment Guide

This guide covers deploying the Realtime Markdown Editor to AWS using Terraform and GitHub Actions.

## Architecture Overview

### Backend (NestJS API)
- **ECS Fargate** for container orchestration
- **Application Load Balancer** with health checks and SSL
- **Auto Scaling** (2-10 tasks) based on CPU and memory
- **Multi-AZ deployment** for high availability
- **MongoDB Atlas** for database
- **Secrets Manager** for secure credential storage

### Frontend (Next.js)
- **S3** for static hosting
- **CloudFront CDN** for global distribution
- **Lambda@Edge** for security headers
- **Route 53** for DNS management

### Monitoring & Reliability
- **CloudWatch** for logs and metrics
- **CloudWatch Alarms** for notifications
- **CloudWatch Dashboard** for visualization
- **Auto Scaling** for capacity management

## Prerequisites

### Required Tools
- [Terraform](https://terraform.io/) >= 1.5.0
- [AWS CLI](https://aws.amazon.com/cli/) >= 2.0
- [pnpm](https://pnpm.io/) >= 10.15.0
- [Docker](https://docker.com/) >= 20.10
- [GitHub CLI](https://cli.github.com/) (optional)

### AWS Account Setup

1. **Create an AWS Account**
   ```bash
   # Configure AWS CLI
   aws configure
   ```

2. **Create IAM User for Terraform**
   - Go to IAM → Users → Create user
   - Name: `terraform-deployer`
   - Attach policies:
     - `AdministratorAccess` (for initial setup)
     - Or create custom policy with least privileges

3. **Create S3 Bucket for Terraform State**
   ```bash
   aws s3api create-bucket \
     --bucket realtime-md-editor-terraform-state \
     --region us-east-1

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket realtime-md-editor-terraform-state \
     --versioning-configuration Status=Enabled

   # Create DynamoDB table for state locking
   aws dynamodb create-table \
     --table-name realtime-md-editor-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
     --region us-east-1
   ```

4. **Create OIDC Provider for GitHub Actions**
   - Go to IAM → Identity providers → Add provider
   - Provider type: OpenID Connect
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

5. **Create IAM Role for GitHub Actions**
   ```bash
   # Create trust policy file
   cat > trust-policy.json << EOF
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithSAML",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/realtime-md-editor:*"
           }
         }
       }
     ]
   }
   EOF

   # Create the role
   aws iam create-role \
     --role-name github-actions-deployer \
     --assume-role-policy-document file://trust-policy.json

   # Attach policies
   aws iam attach-role-policy \
     --role-name github-actions-deployer \
     --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

   # Note the ARN for GitHub Secrets
   aws iam get-role --role-name github-actions-deployer --query Role.Arn --output text
   ```

6. **Setup MongoDB Atlas**
   - Create a MongoDB Atlas account
   - Create a cluster (preferably M10+ for production)
   - Create a database user
   - Get the connection string
   - Configure IP whitelist (0.0.0.0/0 for ECS, or use VPC peering)

7. **Setup SSL Certificate (Optional)**
   ```bash
   # If using custom domain
   aws acm request-certificate \
     --domain-name example.com \
     --subject-alternative-names www.example.com \
     --validation-method DNS

   # After validation, note the certificate ARN
   ```

## Deployment Steps

### 1. Clone and Configure Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/realtime-md-editor.git
cd realtime-md-editor

# Copy environment example
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Configure Terraform

```bash
cd terraform/environments/prod

# Edit terraform.tfvars with your values
nano terraform.tfvars

# Create backend.tfvars with secrets (DO NOT COMMIT)
cp backend.tfvars.example backend.tfvars
nano backend.tfvars
```

### 3. Initialize Terraform

```bash
cd ../..

# Initialize Terraform
terraform init \
  -backend-config="bucket=realtime-md-editor-terraform-state" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=realtime-md-editor-terraform-locks"

# Validate configuration
terraform validate

# Format configuration
terraform fmt -recursive
```

### 4. Plan Infrastructure

```bash
# Review what will be created
terraform plan \
  -var-file="environments/prod/terraform.tfvars" \
  -var-file="environments/prod/backend.tfvars" \
  -out=tfplan

# Save the plan for approval
terraform show -json tfplan > tfplan.json
```

### 5. Deploy Infrastructure

```bash
# Apply the infrastructure
terraform apply tfplan

# Note the outputs for GitHub Secrets
terraform output
```

Expected outputs:
- `api_url` - API load balancer URL
- `ui_cloudfront_url` - CloudFront distribution URL
- `api_repository_url` - ECR repository URL for API
- `ui_repository_url` - ECR repository URL for UI

### 6. Configure GitHub Secrets

Go to your repository settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ROLE_ARN` | IAM role ARN for GitHub Actions | `arn:aws:iam::123456789:role/github-actions-deployer` |
| `AWS_ECR_REPOSITORY_API` | ECR repository name for API | `realtime-md-editor-prod-api` |
| `AWS_ECR_REPOSITORY_UI` | ECR repository name for UI | `realtime-md-editor-prod-ui` |
| `AWS_S3_BUCKET_UI` | S3 bucket name for UI | `realtime-md-editor-prod-ui` |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `XXXXXXXXXXXX` |
| `API_PUBLIC_URL` | Public API URL | `https://api.example.com` |
| `UI_DOMAIN` | UI domain name | `https://example.com` |
| `CODECOV_TOKEN` | Codecov token (optional) | |
| `SNYK_TOKEN` | Snyk token (optional) | |

### 7. Deploy Application

Push to main branch to trigger deployment:

```bash
git add .
git commit -m "chore: add production infrastructure"
git push origin main
```

Or trigger manually:
- Go to Actions tab in GitHub
- Select "Deploy to Production"
- Click "Run workflow"
- Select options and run

### 8. Verify Deployment

```bash
# Check API health
curl https://api.example.com/health

# Check UI
curl https://example.com

# Check ECS service
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api

# Check CloudWatch logs
aws logs tail /ecs/realtime-md-editor-prod-api --follow
```

## Day 2 Operations

### Monitoring

**CloudWatch Dashboard:**
- URL: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=realtime-md-editor-prod-dashboard`
- Shows API logs, request metrics, and resource utilization

**Alarms:**
- ALB 5XX error rate
- ALB response time
- Unhealthy hosts
- ECS CPU/Memory utilization
- Set to send notifications to SNS topic

### Scaling

The application auto-scales based on:
- **CPU**: Target 70% utilization
- **Memory**: Target 80% utilization
- **Range**: 2-10 tasks

Manual scaling:
```bash
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --desired-count 4
```

### Logs

View logs:
```bash
# API logs
aws logs tail /ecs/realtime-md-editor-prod-api --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "ERROR"

# Export logs
aws logs create-export-task \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --from $(date -d '7 days ago' +%s)000 \
  --to $(date +%s)000 \
  --destination bucket-name \
  --destination-prefix logs
```

### Backups

**MongoDB Atlas:**
- Automatic daily backups (retention: 7 days)
- Manual snapshots available via Atlas console

**S3:**
- Versioning enabled
- Cross-region replication (optional)

### Security Best Practices

1. **Rotate secrets regularly**
   ```bash
   # Update JWT secret
   aws secretsmanager put-secret-value \
     --secret-id realtime-md-editor/prod/jwt-secret \
     --secret-string "$(openssl rand -base64 32)"

   # Trigger ECS redeployment to pick up new secret
   aws ecs update-service \
     --cluster realtime-md-editor-prod-cluster \
     --service realtime-md-editor-prod-api \
     --force-new-deployment
   ```

2. **Enable CloudTrail for audit logging**
3. **Use AWS Shield for DDoS protection**
4. **Enable AWS Config for compliance**
5. **Regular security patches**
   ```bash
   # Update base Docker images
   docker pull node:20-alpine
   ```

### Troubleshooting

**API returns 502:**
```bash
# Check ECS tasks
aws ecs list-tasks --cluster realtime-md-editor-prod-cluster

# Check task health
aws ecs describe-tasks \
  --cluster realtime-md-editor-prod-cluster \
  --tasks <task-id>

# Check CloudWatch logs
aws logs tail /ecs/realtime-md-editor-prod-api --follow
```

**Deployment stuck:**
```bash
# Check service deployment status
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api

# Force new deployment
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --force-new-deployment
```

**Rollback:**
```bash
# Get previous task definition
aws ecs describe-task-definition \
  --task-definition realtime-md-editor-prod-api:1

# Update service with old task definition
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --task-definition realtime-md-editor-prod-api:1
```

### Performance Optimization

1. **Enable connection pooling**
2. **Use Redis for session storage** (via ElastiCache)
3. **Enable database indexing**
4. **Use CloudFront cache for static assets**
5. **Enable Gzip compression**
6. **Monitor and optimize query performance**

### Disaster Recovery

**Recovery Time Objective (RTO):** ~15 minutes
**Recovery Point Objective (RPO):** ~5 minutes

**Steps:**
1. Restore MongoDB from latest snapshot
2. Redeploy ECS service
3. Update DNS to point to new infrastructure
4. Verify all systems operational

### Cost Optimization

Current estimated costs (us-east-1):

| Service | Monthly Cost |
|---------|--------------|
| ECS Fargate (2 tasks avg) | ~$60 |
| ALB | ~$20 |
| CloudFront | ~$5-20 |
| S3 | ~$1 |
| CloudWatch | ~$5 |
| MongoDB Atlas M10 | ~$57 |
| Data Transfer | ~$10-30 |
| **Total** | **~$158-193/month** |

**Optimization tips:**
- Use reserved instances for savings
- Enable S3 lifecycle policies
- Use Spot instances for non-prod
- Monitor and right-size resources

## Support and Maintenance

**Monitoring Schedule:**
- Daily: Check CloudWatch dashboard
- Weekly: Review cost reports
- Monthly: Security patch review
- Quarterly: Architecture review

**Contacts:**
- DevOps: devops@example.com
- Development: dev@example.com
- On-call: oncall@example.com

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)