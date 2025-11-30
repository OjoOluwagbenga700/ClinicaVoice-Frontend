# S3 Bucket for audio files and transcriptions
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-storage-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}-storage"
  }
}

# Random string for unique bucket name
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "prod" ? [
      var.frontend_domain
    ] : [
      "http://localhost:5173",
      var.frontend_domain
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket lifecycle rule
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "delete-old-transcripts"
    status = "Enabled"

    filter {
      prefix = "transcripts/"
    }

    expiration {
      days = 90
    }
  }

  rule {
    id     = "transition-old-audio"
    status = "Enabled"

    filter {
      prefix = "audio/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 Event Notifications for Lambda triggers
resource "aws_s3_bucket_notification" "lambda_triggers" {
  bucket = aws_s3_bucket.main.id

  # Trigger transcribe-processor when audio files are uploaded
  lambda_function {
    lambda_function_arn = aws_lambda_function.functions["transcribe-processor"].arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "audio/"
    filter_suffix       = ""
  }

  # Trigger comprehend-medical when transcription JSON is created
  lambda_function {
    lambda_function_arn = aws_lambda_function.functions["comprehend-medical"].arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "transcripts/"
    filter_suffix       = ".json"
  }

  depends_on = [
    aws_lambda_permission.s3_invoke_transcribe_processor,
    aws_lambda_permission.s3_invoke_comprehend_medical
  ]
}

# Lambda permission for S3 to invoke transcribe-processor
resource "aws_lambda_permission" "s3_invoke_transcribe_processor" {
  statement_id  = "AllowS3InvokeTranscribeProcessor"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions["transcribe-processor"].function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.main.arn
}

# Lambda permission for S3 to invoke comprehend-medical
resource "aws_lambda_permission" "s3_invoke_comprehend_medical" {
  statement_id  = "AllowS3InvokeComprehendMedical"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions["comprehend-medical"].function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.main.arn
}

# S3 Bucket Policy for authenticated uploads
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAuthenticatedUploads"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.authenticated_user.arn
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/audio/*"
      },
      {
        Sid    = "AllowLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })
}
