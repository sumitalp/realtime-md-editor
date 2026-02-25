variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_alb_arn" {
  description = "API ALB ARN"
  type        = string
}

variable "api_target_group_arn" {
  description = "API target group ARN"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "api_log_group" {
  description = "CloudWatch log group for API"
  type        = string
}

variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
  default     = ""
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-alarms"
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_5xx_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"

  alarm_actions          = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  ok_actions             = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  insufficient_data_actions = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []

  dimensions = {
    LoadBalancer = var.api_alb_arn
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"

  alarm_actions          = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  ok_actions             = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []

  dimensions = {
    LoadBalancer = var.api_alb_arn
  }
}

resource "aws_cloudwatch_metric_alarm" "target_unhealthy_hosts" {
  alarm_name          = "${var.project_name}-${var.environment}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"

  alarm_actions          = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  ok_actions             = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []

  dimensions = {
    TargetGroup = var.api_target_group_arn
  }
}

# CloudWatch Alarms for ECS
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  alarm_actions          = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  ok_actions             = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"

  alarm_actions          = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []
  ok_actions             = var.alarm_email != "" ? [aws_sns_topic.alarms.arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "log"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          logGroupName  = var.api_log_group
          title         = "API Logs"
          view          = "Table"
          region        = data.aws_region.current.name
          timeRange     = { relative = "1h" }
          queryString   = "fields @timestamp, @message | sort @timestamp desc"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 6
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { label = "Request Count" }],
            [".", "HTTPCode_Target_2XX_Count", { label = "2XX" }],
            [".", "HTTPCode_Target_4XX_Count", { label = "4XX" }],
            [".", "HTTPCode_Target_5XX_Count", { label = "5XX" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "ALB Requests"
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 6
        width  = 6
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { label = "CPU" }],
            [".", "MemoryUtilization", { label = "Memory" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS Resources"
        }
      }
    ]
  })
}

data "aws_region" "current" {}

output "sns_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  value = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}