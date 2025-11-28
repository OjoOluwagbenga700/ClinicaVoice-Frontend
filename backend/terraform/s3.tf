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
    allowed_origins = [
      "http://localhost:5173",
      "https://${var.frontend_domain}"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket lifecycle rule
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "delete-old-transcriptions"
    status = "Enabled"

    filter {
      prefix = "transcriptions/"
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
