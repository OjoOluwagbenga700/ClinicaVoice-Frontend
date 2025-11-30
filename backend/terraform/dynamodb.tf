# Reports Table (includes transcriptions)
resource "aws_dynamodb_table" "reports" {
  name         = "${var.project_name}-reports-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

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

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "status"
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

  global_secondary_index {
    name            = "TypeIndex"
    hash_key        = "type"
    range_key       = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "userId"
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
  name         = "${var.project_name}-templates-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

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


