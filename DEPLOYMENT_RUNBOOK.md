# Deployment Runbook

This runbook contains step-by-step procedures for common operational tasks.

## Table of Contents
- [Initial Deployment](#initial-deployment)
- [Routine Deployments](#routine-deployments)
- [Emergency Procedures](#emergency-procedures)
- [Maintenance Tasks](#maintenance-tasks)
- [Troubleshooting](#troubleshooting)

## Initial Deployment

### Step 1: Prerequisites Checklist
- [ ] AWS account configured
- [ ] MongoDB Atlas cluster created
- [ ] Domain name obtained (if using custom domain)
- [ ] SSL certificate obtained (if using custom domain)
- [ ] GitHub repository created
- [ ] Terraform installed locally
- [ ] AWS CLI configured

### Step 2: Infrastructure Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd realtime-md-editor

# 2. Navigate to Terraform directory
cd terraform

# 3. Copy and edit configuration files
cd environments/prod
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Update with your values

cp backend.tfvars.example backend.tfvars
nano backend.tfvars  # Add sensitive data

# 4. Return to root and initialize
cd ../..
terraform init \
  -backend-config="bucket=realtime-md-editor-terraform-state" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=realtime-md-editor-terraform-locks"

# 5. Review plan
terraform plan \
  -var-file="environments/prod/terraform.tfvars" \
  -var-file="environments/prod/backend.tfvars" \
  -out=tfplan

# 6. Apply infrastructure
terraform apply tfplan
```

### Step 3: Configure GitHub Actions

```bash
# Get required values from Terraform outputs
terraform output

# Add secrets to GitHub:
# 1. Go to repository Settings → Secrets and variables → Actions
# 2. Add each secret from the outputs
# 3. Add additional secrets from .env.example
```

### Step 4: Trigger Deployment

```bash
# Option 1: Push to main branch
git checkout -b main
git push origin main

# Option 2: Manual trigger via GitHub UI
# Actions → Deploy to Production → Run workflow
```

### Step 5: Verification

```bash
# Check API health
API_URL=$(terraform output -raw api_url)
curl https://$API_URL/health

# Check UI
UI_URL=$(terraform output -raw ui_cloudfront_url)
curl https://$UI_URL

# Check ECS service
CLUSTER=$(terraform output -raw ecs_cluster_name)
aws ecs describe-services \
  --cluster $CLUSTER \
  --services realtime-md-editor-prod-api
```

## Routine Deployments

### Standard Application Deployment

#### Automated Deployment (via Git)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test
# ... development work ...

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Create PR via GitHub UI
# 5. After approval, merge to main
# 6. Deployment triggers automatically
```

#### Manual Deployment

```bash
# 1. Via GitHub Actions UI
# Actions → Deploy to Production → Run workflow
# Select components to deploy
# Click "Run workflow"

# 2. Monitor deployment
# Watch the workflow progress in real-time
```

### Rolling Updates

The production deployment uses ECS rolling updates:

1. **New task definition** is created
2. **ECS scheduler** starts new tasks
3. **Health checks** verify new tasks
4. **ALB** shifts traffic to new tasks
5. **Old tasks** are drained and stopped

```bash
# Monitor rolling update
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api \
  --query 'services[0].deployments'

# Check task status
aws ecs list-tasks \
  --cluster realtime-md-editor-prod-cluster \
  --desired-status RUNNING
```

## Emergency Procedures

### Immediate Rollback

**Scenario:** Critical bug detected in production

```bash
# 1. Identify last stable version
aws ecs describe-task-definition \
  --task-definition realtime-md-editor-prod-api \
  --query 'taskDefinition.revision' \
  --output text

# 2. Rollback to previous revision
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --task-definition realtime-md-editor-prod-api:<PREVIOUS_REVISION>

# 3. Monitor rollback
aws ecs wait services-stable \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api

# 4. Verify application
curl https://api.example.com/health
```

### Scale Up Quickly

**Scenario:** Traffic spike, service degrading

```bash
# Immediate scale up
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --desired-count 10

# Verify capacity
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api \
  --query 'services[0].runningCount'
```

### Emergency Database Access

**Scenario:** Need to access MongoDB directly

```bash
# Port forward via bastion (if setup)
ssh -L 27017:atlas-cluster.mongodb.com:27017 user@bastion

# Or connect via MongoDB Atlas UI
# 1. Go to Atlas console
# 2. Clusters → Connect
# 3. Connect with MongoDB Shell
```

### Full Service Outage Recovery

**Scenario:** Complete service failure

```bash
# 1. Check current state
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api

# 2. Force redeploy
aws ecs update-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api \
  --force-new-deployment

# 3. If still failing, check logs
aws logs tail /ecs/realtime-md-editor-prod-api --follow

# 4. Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# 5. If task failing, check task definition
aws ecs describe-task-definition \
  --task-definition realtime-md-editor-prod-api

# 6. Last resort: recreate service
# (WARNING: This will cause downtime)
aws ecs delete-service \
  --cluster realtime-md-editor-prod-cluster \
  --service realtime-md-editor-prod-api --force

# Recreate with Terraform
cd terraform
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## Maintenance Tasks

### Weekly Tasks

#### Check System Health

```bash
# ECS Service Health
aws ecs describe-services \
  --cluster realtime-md-editor-prod-cluster \
  --services realtime-md-editor-prod-api \
  --query 'services[0].[runningCount,status,deployments]'

# ALB Health
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# CloudWatch Alarms
aws cloudwatch describe-alarms \
  --alarm-names PATTERN realtime-md-editor-prod
```

#### Review Logs

```bash
# Check for errors
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '7 days ago' +%s)000

# Check slow requests (if logged)
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "duration > 1000" \
  --start-time $(date -d '7 days ago' +%s)000
```

### Monthly Tasks

#### Security Updates

```bash
# Check for security vulnerabilities
docker pull node:20-alpine
docker scan node:20-alpine

# Update base images in Dockerfiles
# Rebuild and redeploy

# Review security groups
aws ec2 describe-security-groups \
  --filters Name=group-name,Values=*realtime-md-editor*
```

#### Cost Review

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-start $(date -d 'first day of this month' +%Y-%m-%d) \
  --time-end $(date -d 'tomorrow' +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Review ECS task utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=realtime-md-editor-prod-api \
  --start-time $(date -d '30 days ago' +%Y-%m-%dT00:00:00) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average
```

### Quarterly Tasks

#### Architecture Review

- Review scaling metrics and adjust thresholds
- Review database performance and optimize queries
- Review CDN cache hit rates
- Review security compliance
- Update runbooks based on incidents

#### Dependency Updates

```bash
# Update dependencies locally
pnpm update

# Test thoroughly
pnpm test

# Deploy to staging first
git checkout -b chore/dependency-updates
git push origin chore/dependency-updates

# After staging verification, deploy to prod
```

## Troubleshooting

### Common Issues

#### Issue: API Returning 502 Bad Gateway

**Symptoms:**
- ALB returns 502 errors
- Health checks failing
- Service marked as unhealthy

**Diagnosis:**
```bash
# Check ECS task status
aws ecs list-tasks --cluster realtime-md-editor-prod-cluster

# Check task health
aws ecs describe-tasks \
  --cluster realtime-md-editor-prod-cluster \
  --tasks <task-id>

# Check recent logs
aws logs tail /ecs/realtime-md-editor-prod-api --since 1h
```

**Solutions:**
1. If task crashed: Check logs for error, fix bug, redeploy
2. If task stuck: Restart task or service
3. If database connection failed: Check Atlas status
4. If out of memory: Increase container memory

#### Issue: High Memory Usage

**Symptoms:**
- Tasks getting killed (OOMKilled)
- Service unstable

**Diagnosis:**
```bash
# Check memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=realtime-md-editor-prod-api \
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum,Average
```

**Solutions:**
1. Check for memory leaks (profile application)
2. Increase container memory in Terraform
3. Implement memory limits
4. Check for proper cleanup (connections, etc.)

#### Issue: Slow API Response Times

**Symptoms:**
- API taking >5 seconds to respond
- Users experiencing delays

**Diagnosis:**
```bash
# Check ALB response time
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Check database query performance in MongoDB Atlas
```

**Solutions:**
1. Add database indexes
2. Enable connection pooling
3. Add caching layer (Redis)
4. Optimize slow queries
5. Scale up resources

#### Issue: Deployment Failed

**Symptoms:**
- GitHub Actions workflow fails
- Terraform apply fails
- Container won't start

**Diagnosis:**
```bash
# Check workflow logs in GitHub Actions

# For Terraform failures:
terraform plan -out=tfplan
terraform apply tfplan

# For Docker issues:
# Test build locally
docker build -f apps/api/Dockerfile .

# Check ECR permissions
aws ecr describe-repositories --repository-names realtime-md-editor-prod-api
```

**Solutions:**
1. Fix build errors locally
2. Test container locally
3. Check ECR permissions
4. Verify ECS task role
5. Check CloudWatch logs for container errors

#### Issue: WebSocket Connections Failing

**Symptoms:**
- Real-time collaboration not working
- Socket.io connection errors

**Diagnosis:**
```bash
# Check ALB settings (sticky sessions)
aws elbv2 describe-target-groups \
  --target-group-arns <TARGET_GROUP_ARN>

# Check CloudWatch logs for WebSocket errors
aws logs filter-log-events \
  --log-group-name /ecs/realtime-md-editor-prod-api \
  --filter-pattern "websocket"
```

**Solutions:**
1. Enable sticky sessions on ALB
2. Check timeout settings (default 60s may be too low)
3. Verify WebSocket configuration in NestJS
4. Check if scaling disrupts connections

### Getting Help

**Internal Resources:**
- Team chat: #deployment-support
- On-call: Page on-call engineer
- Documentation: [DEPLOYMENT.md](DEPLOYMENT.md)

**External Resources:**
- AWS Support: Enterprise Support
- MongoDB Atlas Support: Atlas Support Portal
- GitHub Actions: [GitHub Actions Docs](https://docs.github.com/en/actions)

**Escalation Path:**
1. On-call engineer (immediate)
2. Tech lead (1 hour)
3. Engineering manager (2 hours)
4. CTO (4 hours)

## Runbook Maintenance

This runbook should be updated:
- After every incident
- Quarterly for routine review
- After major architecture changes

Maintained by: DevOps Team
Last updated: 2025-01-24