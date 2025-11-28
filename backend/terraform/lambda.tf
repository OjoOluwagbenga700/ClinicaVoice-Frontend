# Lambda Functions Configuration
locals {
  lambda_functions = {
    dashboard-stats = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 30
      memory_size = 256
      environment_variables = {
        REPORTS_TABLE        = aws_dynamodb_table.reports.name
        TRANSCRIPTIONS_TABLE = aws_dynamodb_table.transcriptions.name
        ENVIRONMENT          = var.environment
      }
    }
    dashboard-activity = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 30
      memory_size = 256
      environment_variables = {
        REPORTS_TABLE = aws_dynamodb_table.reports.name
        ENVIRONMENT   = var.environment
      }
    }
    dashboard-recent-notes = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 30
      memory_size = 256
      environment_variables = {
        REPORTS_TABLE = aws_dynamodb_table.reports.name
        ENVIRONMENT   = var.environment
      }
    }
    reports = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 60
      memory_size = 512
      environment_variables = {
        REPORTS_TABLE = aws_dynamodb_table.reports.name
        ENVIRONMENT   = var.environment
      }
    }
    templates = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 30
      memory_size = 256
      environment_variables = {
        TEMPLATES_TABLE = aws_dynamodb_table.templates.name
        ENVIRONMENT     = var.environment
      }
    }
    transcribe = {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      timeout     = 900  # 15 minutes for transcription
      memory_size = 1024
      environment_variables = {
        TRANSCRIPTIONS_TABLE = aws_dynamodb_table.transcriptions.name
        S3_BUCKET           = aws_s3_bucket.main.id
        ENVIRONMENT         = var.environment
      }
    }
  }
}

# Package Lambda functions
data "archive_file" "lambda_packages" {
  for_each = local.lambda_functions
  
  type        = "zip"
  source_dir  = "${path.module}/../lambda/${each.key}"
  output_path = "${path.module}/lambda-packages/${each.key}.zip"
}

# Lambda Functions
resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions
  
  filename         = data.archive_file.lambda_packages[each.key].output_path
  function_name    = "${var.project_name}-${each.key}-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = each.value.handler
  runtime         = each.value.runtime
  timeout         = each.value.timeout
  memory_size     = each.value.memory_size
  source_code_hash = data.archive_file.lambda_packages[each.key].output_base64sha256

  environment {
    variables = each.value.environment_variables
  }


  tags = {
    Name        = "${var.project_name}-${each.key}"
    Function    = each.key
    Environment = var.environment
  }
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  for_each = local.lambda_functions
  
  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# CloudWatch Log Groups for Lambda Functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions
  
  name              = "/aws/lambda/${aws_lambda_function.functions[each.key].function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${each.key}-logs"
    Environment = var.environment
  }
}

# Outputs
output "lambda_function_names" {
  description = "Names of all Lambda functions"
  value = {
    for k, v in aws_lambda_function.functions : k => v.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs of all Lambda functions"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "lambda_function_invoke_arns" {
  description = "Invoke ARNs of all Lambda functions"
  value = {
    for k, v in aws_lambda_function.functions : k => v.invoke_arn
  }
}