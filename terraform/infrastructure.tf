# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name        = var.project_name
  environment         = var.environment
  aws_region          = var.aws_region
  availability_zones  = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  enable_nat_gateway  = true
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  public_subnet_ids        = module.vpc.public_subnet_ids
  api_repository_url       = module.ecr.api_repository_url
  container_cpu            = var.container_cpu
  container_memory         = var.container_memory
  mongodb_connection_string = var.mongodb_connection_string
  jwt_secret               = var.jwt_secret
  allowed_origins          = var.allowed_origins
  desired_count            = var.api_desired_count
  min_capacity             = var.api_min_count
  max_capacity             = var.api_max_count
  acm_certificate_arn      = var.acm_certificate_arn
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name        = var.project_name
  environment         = var.environment
  domain_name         = var.domain_name
  acm_certificate_arn = var.acm_certificate_arn
  api_alb_dns_name    = module.ecs.alb_dns_name
  api_alb_zone_id     = module.ecs.alb_zone_id
  hosted_zone_id      = var.hosted_zone_id
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name        = var.project_name
  environment         = var.environment
  api_alb_arn         = module.ecs.alb_arn
  api_target_group_arn = module.ecs.target_group_arn
  ecs_cluster_name    = module.ecs.cluster_name
  ecs_service_name    = "${var.project_name}-${var.environment}-api"
  api_log_group       = module.ecs.cloudwatch_log_group
  alarm_email         = var.alarm_email
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
  default     = ""
}