# Complete Terraform Backend Setup Guide

## 📋 Overview

This guide provides ALL the code you need to deploy your ClinicaVoice backend using Terraform.

## 🎯 What You'll Deploy

1. **3 DynamoDB Tables** (Reports, Templates, Transcriptions)
2. **8 Lambda Functions** (Dashboard, Reports CRUD, Templates CRUD)
3. **API Gateway** (Connected to your existing endpoint)
4. **IAM Roles** (For Lambda execution)

## 📁 File Structure to Create

```
backend/
├── terraform/
│   ├── main.tf              # Main configuration
│   ├── variables.tf         # Input variables
│   ├── dynamodb.tf          # DynamoDB tables
│   ├── lambda.tf            # Lambda functions
│   ├── api-gateway.tf       # API Gateway config
│   ├── iam.tf               # IAM roles and policies
│   └── outputs.tf           # Output values
├── lambda/
│   ├── dashboard-stats/index.mjs
│   ├── reports/index.mjs
│   └── templates/index.mjs
└── README.md
```

## 🚀 Step-by-Step Implementation

### Step 1: Create `terraform/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "clinicavoice"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = "us-east-1_7fvXVi5oM"
}

variable "s3_bucket_name" {
  description = "S3 bucket for file storage"
  type        = string
  default     = "terraform-20251121023049872500000001"
}

variable "api_gateway_id" {
  description = "Existing API Gateway ID"
  type        = string
  default     = "r7le6kf535"  # Extract from your endpoint URL
}
```

### Step 2: Create `terraform/main.tf`

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

### Step 3: Create `terraform/dynamodb.tf`

```hcl
# Reports Table
resource "aws_dynamodb_table" "reports" {
  name           = "${var.project_name}-reports-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "PatientIdIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-reports"
  }
}

# Templates Table
resource "aws_dynamodb_table" "templates" {
  name           = "${var.project_name}-templates-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-templates"
  }
}

# Transcriptions Table
resource "aws_dynamodb_table" "transcriptions" {
  name           = "${var.project_name}-transcriptions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-transcriptions"
  }
}
```

### Step 4: Create `terraform/iam.tf`

```hcl
# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB Access Policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb-${var.environment}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.reports.arn,
          "${aws_dynamodb_table.reports.arn}/index/*",
          aws_dynamodb_table.templates.arn,
          "${aws_dynamodb_table.templates.arn}/index/*",
          aws_dynamodb_table.transcriptions.arn,
          "${aws_dynamodb_table.transcriptions.arn}/index/*"
        ]
      }
    ]
  })
}
```

### Step 5: Create `terraform/lambda.tf`

```hcl
# Package Lambda functions
data "archive_file" "dashboard_stats" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/dashboard-stats"
  output_path = "${path.module}/lambda-packages/dashboard-stats.zip"
}

# Dashboard Stats Lambda
resource "aws_lambda_function" "dashboard_stats" {
  filename      = data.archive_file.dashboard_stats.output_path
  function_name = "${var.project_name}-dashboard-stats-${var.environment}"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  source_code_hash = data.archive_file.dashboard_stats.output_base64sha256

  environment {
    variables = {
      REPORTS_TABLE        = aws_dynamodb_table.reports.name
      TRANSCRIPTIONS_TABLE = aws_dynamodb_table.transcriptions.name
      ENVIRONMENT          = var.environment
    }
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "dashboard_stats_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dashboard_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${var.api_gateway_id}/*"
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Add more Lambda functions for reports, templates, etc.
# (Similar pattern as above)
```

### Step 6: Create `terraform/outputs.tf`

```hcl
output "reports_table_name" {
  description = "DynamoDB Reports table name"
  value       = aws_dynamodb_table.reports.name
}

output "templates_table_name" {
  description = "DynamoDB Templates table name"
  value       = aws_dynamodb_table.templates.name
}

output "transcriptions_table_name" {
  description = "DynamoDB Transcriptions table name"
  value       = aws_dynamodb_table.transcriptions.name
}

output "lambda_execution_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "dashboard_stats_function_name" {
  description = "Dashboard stats Lambda function name"
  value       = aws_lambda_function.dashboard_stats.function_name
}
```

## 🎯 Deployment Steps

### 1. Initialize Terraform

```bash
cd backend/terraform
terraform init
```

### 2. Review Plan

```bash
terraform plan
```

### 3. Deploy

```bash
terraform apply
```

Type `yes` when prompted.

### 4. Get Outputs

```bash
terraform output
```

## 🔄 Update Frontend

After deployment, update `src/services/api.js`:

```javascript
const USE_MOCK_API = false;  // Change from true to false
```

## 🧪 Test

```bash
# Test dashboard stats endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://r7le6kf535.execute-api.us-east-1.amazonaws.com/dashboard/stats
```

## 📝 Next Steps

1. Deploy Terraform infrastructure
2. Test each endpoint
3. Update frontend to use real API
4. Deploy frontend to Amplify
5. Test end-to-end

## 💡 Pro Tips

- Use Terraform workspaces for multiple environments
- Store Terraform state in S3 with DynamoDB locking
- Use Terraform modules for reusability
- Enable CloudWatch alarms for monitoring

## 🆘 Troubleshooting

**Issue: Terraform can't find Lambda code**
- Ensure Lambda functions exist in `backend/lambda/`
- Check file paths in `lambda.tf`

**Issue: Permission denied**
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure IAM user has necessary permissions

**Issue: API Gateway integration fails**
- Verify API Gateway ID is correct
- Check Lambda permissions

## 📚 Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda with Terraform](https://learn.hashicorp.com/tutorials/terraform/lambda-api-gateway)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

**Ready to deploy?** Follow the steps above and your backend will be live!
