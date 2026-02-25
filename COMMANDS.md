# AWS Deployment Quick Reference

Quick reference commands for common deployment operations.

## Terraform Commands

### Initialize and Plan
```bash
# Initialize Terraform
terraform init \
  -backend-config="bucket=realtime-md-editor-terraform-state" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=realtime-md-editor-terraform-locks"

# Validate configuration
terraform validate

# Format files
terraform fmt -recursive

# See what will change
terraform plan \
  -var-file="environments/prod/terraform.tfvars" \
  -var-file="environments/prod/backend.tfvars"

# Apply changes
terraform apply \
  -var-file="environments/prod/terraform.tfvars" \
  -var-file="environments/prod/backend.tfvars"

# Destroy infrastructure (CAUTION!)
terraform destroy \
  -var-file="environments/prod/terraform.tfvars" \
  -var-file="environments/prod/backend.tfvars"
```

### Outputs and State
```bash
# Show all outputs
terraform output

# Show specific output
terraform output api_url

# Show current state
terraform show

# Refresh state
terraform refresh

# Import existing resource
terraform import aws_vpc.main vpc-xxxxxxxx
```

## ECS Commands

### Service Management
```bash
# Describe service
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api

# List running tasks
aws ecs list-tasks \
  --cluster realtime-md-editor-prod-cluster

# Describe specific task
aws ecs describe-tasks \
  --cluster realtime-md-editor-prod-cluster \
  --tasks <task-id>

# Update service (force new deployment)
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --force-new-deployment

# Scale service
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --desired-count 4

# Wait for service stability
aws ecs wait services-stable \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api
```

### Task Definitions
```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix realtime-md-editor-prod-api

# Describe task definition
aws ecs describe-task-definition \
  --task-definition realtime-md-editor-prod-api

# Create new revision
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

## Docker Commands

### Building and Testing
```bash
# Build API image locally
docker build -f apps/api/Dockerfile -t realtime-md-editor-api:local .

# Build UI image locally
docker build -f apps/ui/Dockerfile -t realtime-md-editor-ui:local .

# Run API locally
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb://localhost:27017/test" \
  -e JWT_SECRET="test-secret" \
  realtime-md-editor-api:local

# Run UI locally
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:3000" \
  realtime-md-editor-ui:local

# Test container health
docker exec <container-id> curl http://localhost:3000/health

# View container logs
docker logs -f <container-id>
```

### ECR Commands
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Push image to ECR
docker tag realtime-md-editor-api:local \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/realtime-md-editor-prod-api:latest
docker push \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/realtime-md-editor-prod-api:latest

# Pull image from ECR
docker pull \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/realtime-md-editor-prod-api:latest

# Scan image for vulnerabilities
docker scan \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/realtime-md-editor-prod-api:latest
```

## Load Balancer Commands

### ALB Management
```bash
# Describe load balancer
aws elbv2 describe-load-balancers \
  --names realtime-md-editor-prod-alb

# Describe target groups
aws elbv2 describe-target-groups \
  --load-balancer-arn <alb-arn>

# Describe target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Describe listeners
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn>

# Get ALB logs (S3)
aws s3 ls s3://alb-logs-realtime-md-editor/ \
  --recursive | tail -20
```

## CloudWatch Commands

### Logs
```bash
# Tail logs in real-time
aws logs tail /ecs/realtime-md-editor-prod-api --follow

# Get recent logs
aws logs tail /ecs/realtime-md-editor-prod-api --since 1h

# Filter logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Export logs to S3
aws logs create-export-task \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --from $(date -d '7 days ago' +%s)000 \
  --to $(date +%s)000 \
  --destination your-bucket \
  --destination-prefix logs/export

# Create log group
aws logs create-log-group \
  --log-group-name /ecs/realtime-md-editor-prod-api

# Set retention policy
aws logs put-retention-policy \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --retention-in-days 7
```

### Metrics and Alarms
```bash
# List metrics
aws cloudwatch list-metrics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=realtime-md-editor-prod-api \
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# List alarms
aws cloudwatch describe-alarms \
  --alarm-names PATTERN realtime-md-editor

# Disable alarm
aws cloudwatch disable-alarm-actions \
  --alarm-name realtime-md-editor-prod-alb-5xx-error-rate

# Enable alarm
aws cloudwatch enable-alarm-actions \
  --alarm-name realtime-md-editor-prod-alb-5xx-error-rate

# Create alarm (CLI)
aws cloudwatch put-metric-alarm \
  --alarm-name realtime-md-editor-prod-high-cpu \
  --alarm-description "Alert on CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## S3 and CloudFront Commands

### S3 Operations
```bash
# Sync files to S3
aws s3 sync apps/ui/.next/static \
  s3://realtime-md-editor-prod-ui/_next/static \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

# List S3 objects
aws s3 ls s3://realtime-md-editor-prod-ui/ --recursive

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket realtime-md-editor-prod-ui \
  --versioning-configuration Status=Enabled

# Get bucket policy
aws s3api get-bucket-policy --bucket realtime-md-editor-prod-ui

# Set bucket policy
aws s3api put-bucket-policy \
  --bucket realtime-md-editor-prod-ui \
  --policy file://policy.json
```

### CloudFront Operations
```bash
# List distributions
aws cloudfront list-distributions

# Get distribution info
aws cloudfront get-distribution \
  --id <distribution-id>

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# List invalidations
aws cloudfront list-invalidations \
  --distribution-id <distribution-id>

# Get invalidation status
aws cloudfront get-invalidation \
  --distribution-id <distribution-id> \
  --id <invalidation-id>

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://dist-config.json
```

## Secrets Manager Commands

### Managing Secrets
```bash
# Create secret
aws secretsmanager create-secret \
  --name realtime-md-editor/prod/jwt-secret \
  --secret-string "your-secret-here"

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id realtime-md-editor/prod/jwt-secret

# Update secret
aws secretsmanager put-secret-value \
  --secret-id realtime-md-editor/prod/jwt-secret \
  --secret-string "new-secret-here"

# Rotate secret
aws secretsmanager rotate-secret \
  --secret-id realtime-md-editor/prod/jwt-secret

# List secrets
aws secretsmanager list-secrets

# Delete secret (soft delete)
aws secretsmanager delete-secret \
  --secret-id realtime-md-editor/prod/jwt-secret \
  --recovery-window-days 7

# Restore deleted secret
aws secretsmanager restore-secret \
  --secret-id realtime-md-editor/prod/jwt-secret
```

## Health Check Commands

### Application Health
```bash
# API health check
curl https://api.example.com/health

# UI health check
curl https://example.com/api/health

# WebSocket connection test
wscat -c wss://api.example.com

# Full check script
#!/bin/bash
API_URL="https://api.example.com"
UI_URL="https://example.com"

echo "Checking API..."
curl -f ${API_URL}/health || echo "API health check failed"

echo "Checking UI..."
curl -f ${UI_URL} || echo "UI health check failed"

echo "All checks complete!"
```

## Troubleshooting Commands

### Diagnostics
```bash
# Check ECS events
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api \
  --query 'services[0].events'

# Check CloudTrail events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=realtime-md-editor-prod-api

# Get instance metadata (from within container)
curl http://169.254.169.254/latest/meta-data/

# Network connectivity test
docker run --rm alpine ping -c 3 google.com

# DNS resolution test
nslookup api.example.com

# SSL certificate check
openssl s_client -connect api.example.com:443 -servername api.example.com
```

### Log Analysis
```bash
# Find errors in last hour
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --query 'events[*].message' \
  --output table

# Count errors by type
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '24 hours ago' +%s)000 | \
  jq '.events[].message' | \
  sort | uniq -c | sort -rn

# Find slow requests
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "duration > 1000" \
  --start-time $(date -d '1 hour ago' +%s)000

# Export logs for analysis
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --start-time $(date -d '1 hour ago' +%s)000 > logs.json
```

## Cost Management Commands

### Billing
```bash
# Get current month cost
aws ce get-cost-and-usage \
  --time-start $(date -d 'first day of this month' +%Y-%m-%d) \
  --time-end $(date -d 'tomorrow' +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Get daily costs
aws ce get-cost-and-usage \
  --time-start $(date -d '30 days ago' +%Y-%m-%d) \
  --time-end $(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost

# Forecast cost
aws ce get-cost-and-usage \
  --time-start $(date +%Y-%m-%d) \
  --time-end $(date -d 'next month' +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --prediction
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Terraform aliases
alias tf='terraform'
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tfo='terraform output'

# ECS aliases
alias ecs-list='aws ecs list-tasks --cluster realtime-md-editor-prod-cluster'
alias ecs-desc='aws ecs describe-services --cluster realtime-md-editor-prod-cluster --services realtime-md-editor-prod-api'
alias ecs-deploy='aws ecs update-service --cluster realtime-md-editor-prod-cluster --service realtime-md-editor-prod-api --force-new-deployment'

# Logs aliases
alias logs-api='aws logs tail /ecs/realtime-md-editor-prod-api --follow'
alias logs-errors='aws logs filter-log-events --log-group-name /ecs/realtime-md-editor-prod-api --filter-pattern "ERROR"'

# Health check aliases
alias health-api='curl https://api.example.com/health'
alias health-ui='curl https://example.com/api/health'
```

---

**Quick Tips:**
- Use `--dry-run` flag to test commands without making changes
- Enable shell autocompletion for AWS CLI: `aws configure`
- Use jq for JSON parsing: `sudo apt install jq` (Linux) or `brew install jq` (Mac)
- Save frequently used commands as shell scripts

**Resources:**
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
- [Terraform CLI Reference](https://www.terraform.io/docs/commands/index.html)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)