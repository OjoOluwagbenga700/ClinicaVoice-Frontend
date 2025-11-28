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

variable "frontend_domain" {
  description = "Frontend domain for CORS (will be updated after Amplify deployment)"
  type        = string
  default     = "*" # Change to your Amplify domain after deployment
}
