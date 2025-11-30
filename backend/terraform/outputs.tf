# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 Bucket Name"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "S3 Bucket ARN"
  value       = aws_s3_bucket.main.arn
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_url" {
  description = "API Gateway Invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_endpoint" {
  description = "API Gateway Endpoint (for frontend config)"
  value       = aws_api_gateway_stage.main.invoke_url
}

# DynamoDB Outputs
output "reports_table_name" {
  description = "DynamoDB Reports Table Name"
  value       = aws_dynamodb_table.reports.name
}

output "templates_table_name" {
  description = "DynamoDB Templates Table Name"
  value       = aws_dynamodb_table.templates.name
}



# Frontend Configuration
output "frontend_config" {
  description = "Configuration for frontend amplifyConfig.js"
  value = {
    cognito_user_pool_id        = aws_cognito_user_pool.main.id
    cognito_user_pool_client_id = aws_cognito_user_pool_client.main.id
    api_gateway_endpoint        = aws_api_gateway_stage.main.invoke_url
    s3_bucket_name              = aws_s3_bucket.main.id
    aws_region                  = var.aws_region
  }
}

# Cognito Identity Pool Output
output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID for S3 uploads"
  value       = aws_cognito_identity_pool.main.id
}
