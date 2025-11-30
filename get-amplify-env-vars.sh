#!/bin/bash

# Script to extract Terraform outputs and format them for Amplify Console
echo "🔧 Extracting Environment Variables for Amplify Deployment"
echo "========================================================"

# Check if terraform outputs exist
if [ ! -f "backend/terraform/terraform.tfstate" ]; then
    echo "❌ Error: Terraform state not found. Please deploy backend infrastructure first."
    echo "Run: ./deploy-production.sh"
    exit 1
fi

cd backend/terraform

echo "📤 Getting Terraform outputs..."

# Get outputs
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null)
CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id 2>/dev/null)
IDENTITY_POOL_ID=$(terraform output -raw cognito_identity_pool_id 2>/dev/null)
API_ENDPOINT=$(terraform output -raw api_gateway_url 2>/dev/null)
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

cd ../..

# Validate outputs
if [ -z "$USER_POOL_ID" ] || [ -z "$CLIENT_ID" ] || [ -z "$IDENTITY_POOL_ID" ] || [ -z "$API_ENDPOINT" ] || [ -z "$S3_BUCKET" ]; then
    echo "❌ Error: Could not retrieve all required outputs from Terraform"
    echo "Please ensure backend infrastructure is deployed successfully"
    exit 1
fi

echo "✅ Successfully retrieved all outputs"
echo ""

# Create .env.production file
echo "📝 Creating .env.production file..."
cat > .env.production << EOF
# Production Environment Configuration
# Generated automatically from Terraform outputs
# $(date)

# AWS Configuration
VITE_AWS_REGION=$AWS_REGION
VITE_AWS_USER_POOL_ID=$USER_POOL_ID
VITE_AWS_USER_POOL_CLIENT_ID=$CLIENT_ID
VITE_AWS_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
VITE_API_ENDPOINT=$API_ENDPOINT
VITE_S3_BUCKET=$S3_BUCKET

# Application Configuration
VITE_APP_NAME=ClinicaVoice
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
EOF

echo "✅ Created .env.production file"
echo ""

# Display for Amplify Console
echo "🚀 Environment Variables for AWS Amplify Console"
echo "================================================"
echo ""
echo "Copy and paste these into your Amplify Console:"
echo "App Settings → Environment variables → Manage variables"
echo ""
echo "Variable Name                    | Value"
echo "--------------------------------|----------------------------------------"
echo "VITE_AWS_REGION                 | $AWS_REGION"
echo "VITE_AWS_USER_POOL_ID           | $USER_POOL_ID"
echo "VITE_AWS_USER_POOL_CLIENT_ID    | $CLIENT_ID"
echo "VITE_AWS_IDENTITY_POOL_ID       | $IDENTITY_POOL_ID"
echo "VITE_API_ENDPOINT               | $API_ENDPOINT"
echo "VITE_S3_BUCKET                  | $S3_BUCKET"
echo "VITE_APP_NAME                   | ClinicaVoice"
echo "VITE_APP_VERSION                | 1.0.0"
echo "VITE_ENVIRONMENT                | production"
echo "VITE_ENABLE_DEBUG               | false"
echo ""

# Create JSON format for easy copying
echo "📋 JSON Format (for bulk import if supported):"
echo "=============================================="
cat << EOF
{
  "VITE_AWS_REGION": "$AWS_REGION",
  "VITE_AWS_USER_POOL_ID": "$USER_POOL_ID",
  "VITE_AWS_USER_POOL_CLIENT_ID": "$CLIENT_ID",
  "VITE_AWS_IDENTITY_POOL_ID": "$IDENTITY_POOL_ID",
  "VITE_API_ENDPOINT": "$API_ENDPOINT",
  "VITE_S3_BUCKET": "$S3_BUCKET",
  "VITE_APP_NAME": "ClinicaVoice",
  "VITE_APP_VERSION": "1.0.0",
  "VITE_ENVIRONMENT": "production",
  "VITE_ENABLE_DEBUG": "false"
}
EOF

echo ""
echo "📚 Next Steps:"
echo "1. Go to AWS Amplify Console"
echo "2. Select your app"
echo "3. Go to App Settings → Environment variables"
echo "4. Add each variable listed above"
echo "5. Save and redeploy your app"
echo ""
echo "🔗 Amplify Console: https://console.aws.amazon.com/amplify/"