output "api_url" {
  description = "API load balancer URL"
  value       = module.api.alb_dns_name
}

output "ui_cloudfront_url" {
  description = "UI CloudFront distribution URL"
  value       = module.ui.cloudfront_distribution_domain
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "api_repository_url" {
  description = "ECR repository URL for API"
  value       = module.ecr.api_repository_url
}

output "ui_repository_url" {
  description = "ECR repository URL for UI"
  value       = module.ecr.ui_repository_url
}

output "cloudwatch_log_group_api" {
  description = "CloudWatch log group for API"
  value       = module.api.cloudwatch_log_group
}

output "cloudwatch_log_group_ui" {
  description = "CloudWatch log group for UI"
  value       = module.ui.cloudwatch_log_group
}