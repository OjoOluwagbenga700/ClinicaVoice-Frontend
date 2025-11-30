# API Gateway Configuration with Locals and For_Each
locals {
  # Define API routes with their configurations
  api_routes = {
    # Dashboard endpoints (unified function)
    "dashboard/stats" = {
      http_method     = "GET"
      lambda_function = "dashboard"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "dashboard/activity" = {
      http_method     = "GET"
      lambda_function = "dashboard"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "dashboard/recent-notes" = {
      http_method     = "GET"
      lambda_function = "dashboard"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }

    # Reports endpoints
    "reports" = {
      http_method     = "GET"
      lambda_function = "reports"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "reports-post" = {
      path            = "reports"
      http_method     = "POST"
      lambda_function = "reports"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "reports/{id}" = {
      http_method     = "GET"
      lambda_function = "reports"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "reports/{id}-put" = {
      path            = "reports/{id}"
      http_method     = "PUT"
      lambda_function = "reports"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "reports/{id}-delete" = {
      path            = "reports/{id}"
      http_method     = "DELETE"
      lambda_function = "reports"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }

    # Templates endpoints
    "templates" = {
      http_method     = "GET"
      lambda_function = "templates"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "templates-post" = {
      path            = "templates"
      http_method     = "POST"
      lambda_function = "templates"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "templates/{id}" = {
      http_method     = "GET"
      lambda_function = "templates"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "templates/{id}-put" = {
      path            = "templates/{id}"
      http_method     = "PUT"
      lambda_function = "templates"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "templates/{id}-delete" = {
      path            = "templates/{id}"
      http_method     = "DELETE"
      lambda_function = "templates"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }

    # Transcribe endpoints
    "transcribe" = {
      http_method     = "GET"
      lambda_function = "transcribe"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "transcribe-post" = {
      path            = "transcribe"
      http_method     = "POST"
      lambda_function = "transcribe"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    "transcribe/{id}" = {
      http_method     = "GET"
      lambda_function = "transcribe"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
    
    # Upload endpoint for presigned URLs
    "upload/presign" = {
      http_method     = "POST"
      lambda_function = "upload"
      authorization   = "COGNITO_USER_POOLS"
      require_api_key = false
    }
  }

}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "ClinicaVoice REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-api"
    Environment = var.environment
  }
}

# API Gateway Authorizer (Cognito)
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.project_name}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.main.arn]
}

# Create parent resources (dashboard, reports, templates, transcribe)
resource "aws_api_gateway_resource" "dashboard" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "dashboard"
}

resource "aws_api_gateway_resource" "reports" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "reports"
}

resource "aws_api_gateway_resource" "templates" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "templates"
}

resource "aws_api_gateway_resource" "transcribe" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "transcribe"
}

resource "aws_api_gateway_resource" "upload" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "upload"
}

resource "aws_api_gateway_resource" "upload_presign" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.upload.id
  path_part   = "presign"
}

# Create child resources under dashboard
resource "aws_api_gateway_resource" "dashboard_stats" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.dashboard.id
  path_part   = "stats"
}

resource "aws_api_gateway_resource" "dashboard_activity" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.dashboard.id
  path_part   = "activity"
}

resource "aws_api_gateway_resource" "dashboard_recent_notes" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.dashboard.id
  path_part   = "recent-notes"
}

# Create {id} path parameter resources
resource "aws_api_gateway_resource" "reports_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.reports.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "templates_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.templates.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "transcribe_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.transcribe.id
  path_part   = "{id}"
}

# Map route keys to resource IDs
locals {
  route_to_resource = {
    "dashboard/stats"        = aws_api_gateway_resource.dashboard_stats.id
    "dashboard/activity"     = aws_api_gateway_resource.dashboard_activity.id
    "dashboard/recent-notes" = aws_api_gateway_resource.dashboard_recent_notes.id
    "reports"                = aws_api_gateway_resource.reports.id
    "reports-post"           = aws_api_gateway_resource.reports.id
    "reports/{id}"           = aws_api_gateway_resource.reports_id.id
    "reports/{id}-put"       = aws_api_gateway_resource.reports_id.id
    "reports/{id}-delete"    = aws_api_gateway_resource.reports_id.id
    "templates"              = aws_api_gateway_resource.templates.id
    "templates-post"         = aws_api_gateway_resource.templates.id
    "templates/{id}"         = aws_api_gateway_resource.templates_id.id
    "templates/{id}-put"     = aws_api_gateway_resource.templates_id.id
    "templates/{id}-delete"  = aws_api_gateway_resource.templates_id.id
    "transcribe"             = aws_api_gateway_resource.transcribe.id
    "transcribe-post"        = aws_api_gateway_resource.transcribe.id
    "transcribe/{id}"        = aws_api_gateway_resource.transcribe_id.id
    "upload/presign"         = aws_api_gateway_resource.upload_presign.id
  }
}

# Create API Gateway Methods
resource "aws_api_gateway_method" "routes" {
  for_each = local.api_routes

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = local.route_to_resource[each.key]
  http_method   = each.value.http_method
  authorization = each.value.authorization
  authorizer_id = each.value.authorization == "COGNITO_USER_POOLS" ? aws_api_gateway_authorizer.cognito.id : null

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

# Map static keys to resources for OPTIONS
locals {
  options_resources = {
    "dashboard"              = aws_api_gateway_resource.dashboard.id
    "dashboard-stats"        = aws_api_gateway_resource.dashboard_stats.id
    "dashboard-activity"     = aws_api_gateway_resource.dashboard_activity.id
    "dashboard-recent-notes" = aws_api_gateway_resource.dashboard_recent_notes.id
    "reports"                = aws_api_gateway_resource.reports.id
    "reports-id"             = aws_api_gateway_resource.reports_id.id
    "templates"              = aws_api_gateway_resource.templates.id
    "templates-id"           = aws_api_gateway_resource.templates_id.id
    "transcribe"             = aws_api_gateway_resource.transcribe.id
    "transcribe-id"          = aws_api_gateway_resource.transcribe_id.id
    "upload"                 = aws_api_gateway_resource.upload.id
    "upload-presign"         = aws_api_gateway_resource.upload_presign.id
  }
}

# Create OPTIONS methods for CORS
resource "aws_api_gateway_method" "options" {
  for_each = local.options_resources

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Create OPTIONS method responses for CORS
resource "aws_api_gateway_method_response" "options" {
  for_each = local.options_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# Create OPTIONS integrations for CORS
resource "aws_api_gateway_integration" "options" {
  for_each = local.options_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Create OPTIONS integration responses for CORS
resource "aws_api_gateway_integration_response" "options" {
  for_each = local.options_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options]
}

# Create Lambda Integrations
resource "aws_api_gateway_integration" "lambda" {
  for_each = local.api_routes

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = local.route_to_resource[each.key]
  http_method             = aws_api_gateway_method.routes[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.functions[each.value.lambda_function].invoke_arn
}

# Create Method Responses
resource "aws_api_gateway_method_response" "routes" {
  for_each = local.api_routes

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = local.route_to_resource[each.key]
  http_method = aws_api_gateway_method.routes[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-api-logs"
    Environment = var.environment
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.main.body,
      jsonencode(local.api_routes),
      jsonencode([for k, v in aws_api_gateway_integration.lambda : v.id]),
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.options,
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "${var.project_name}-api-stage"
    Environment = var.environment
  }
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = 5000
    throttling_rate_limit  = 10000
  }
}

# Enable CORS for API Gateway
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'*'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'*'"
  }
}
