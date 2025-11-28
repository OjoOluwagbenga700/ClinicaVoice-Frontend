#!/bin/bash

set -e  # Exit on error

echo "🚀 ClinicaVoice Backend Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi
print_success "AWS CLI installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi
print_success "AWS credentials configured"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform not found. Please install it first."
    echo "Visit: https://www.terraform.io/downloads"
    exit 1
fi
print_success "Terraform installed ($(terraform version | head -n1))"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install it first."
    exit 1
fi
print_success "Node.js installed ($(node --version))"

echo ""
echo "=========================================="
echo ""

# Step 1: Install Lambda dependencies
echo "📦 Step 1: Installing Lambda dependencies..."
echo ""

LAMBDA_DIRS=(
    "backend/lambda/dashboard-stats"
    "backend/lambda/dashboard-activity"
    "backend/lambda/dashboard-recent-notes"
    "backend/lambda/reports"
    "backend/lambda/templates"
    "backend/lambda/transcribe"
)

for dir in "${LAMBDA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Installing dependencies in $dir..."
        (cd "$dir" && npm install --production) || {
            print_error "Failed to install dependencies in $dir"
            exit 1
        }
        print_success "Dependencies installed in $dir"
    else
        print_warning "Directory $dir not found, skipping..."
    fi
done

echo ""
print_success "All Lambda dependencies installed"
echo ""

# Step 2: Initialize Terraform
echo "🔧 Step 2: Initializing Terraform..."
echo ""

cd backend/terraform || {
    print_error "backend/terraform directory not found"
    exit 1
}

terraform init || {
    print_error "Terraform initialization failed"
    exit 1
}

print_success "Terraform initialized"
echo ""

# Step 3: Validate Terraform configuration
echo "✓ Step 3: Validating Terraform configuration..."
echo ""

terraform validate || {
    print_error "Terraform validation failed"
    exit 1
}

print_success "Terraform configuration is valid"
echo ""

# Step 4: Plan deployment
echo "📝 Step 4: Planning deployment..."
echo ""

terraform plan -out=tfplan || {
    print_error "Terraform plan failed"
    exit 1
}

print_success "Terraform plan created"
echo ""

# Step 5: Confirm deployment
echo "=========================================="
echo ""
print_warning "Ready to deploy the following resources:"
echo "  - Cognito User Pool"
echo "  - Cognito User Pool Client"
echo "  - S3 Bucket (with encryption and versioning)"
echo "  - API Gateway REST API"
echo "  - 3 DynamoDB Tables (Reports, Templates, Transcriptions)"
echo "  - 6 Lambda Functions (Dashboard, Reports, Templates, Transcribe)"
echo "  - IAM Roles and Policies"
echo "  - CloudWatch Log Groups"
echo ""
print_info "Estimated deployment time: 5-10 minutes"
print_info "Estimated monthly cost: \$5-15 (for low usage)"
echo ""

read -p "Do you want to proceed with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_warning "Deployment cancelled"
    rm -f tfplan
    exit 0
fi

echo ""

# Step 6: Apply Terraform
echo "🚀 Step 6: Deploying infrastructure..."
echo ""

terraform apply tfplan || {
    print_error "Terraform apply failed"
    rm -f tfplan
    exit 1
}

rm -f tfplan

print_success "Infrastructure deployed successfully!"
echo ""

# Step 7: Get outputs
echo "📊 Step 7: Retrieving deployment outputs..."
echo ""

terraform output > ../../terraform-outputs.txt

print_success "Outputs saved to terraform-outputs.txt"
echo ""

# Display important outputs
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "📋 Important Configuration Values:"
echo ""

COGNITO_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "N/A")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id 2>/dev/null || echo "N/A")
API_ENDPOINT=$(terraform output -raw api_gateway_endpoint 2>/dev/null || echo "N/A")
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "N/A")

echo "Cognito User Pool ID:     $COGNITO_POOL_ID"
echo "Cognito Client ID:        $COGNITO_CLIENT_ID"
echo "API Gateway Endpoint:     $API_ENDPOINT"
echo "S3 Bucket Name:           $S3_BUCKET"
echo ""

# Step 8: Update frontend configuration
echo "=========================================="
echo "📝 Next Steps:"
echo "=========================================="
echo ""
echo "1. Update your frontend configuration:"
echo "   File: src/aws/amplifyConfig.js"
echo ""
echo "   const awsConfig = {"
echo "     Auth: {"
echo "       Cognito: {"
echo "         userPoolId: \"$COGNITO_POOL_ID\","
echo "         userPoolClientId: \"$COGNITO_CLIENT_ID\","
echo "         signUpVerificationMethod: \"code\","
echo "         loginWith: { email: true },"
echo "       },"
echo "     },"
echo "     API: {"
echo "       endpoints: [{"
echo "         name: \"ClinicaVoiceAPI\","
echo "         endpoint: \"$API_ENDPOINT\","
echo "         region: \"us-east-1\","
echo "       }],"
echo "     },"
echo "     Storage: {"
echo "       S3: {"
echo "         bucket: \"$S3_BUCKET\","
echo "         region: \"us-east-1\","
echo "       },"
echo "     },"
echo "   };"
echo ""
echo "2. Switch from mock to real API:"
echo "   File: src/services/api.js"
echo "   Change: const USE_MOCK_API = false;"
echo ""
echo "3. Test locally:"
echo "   npm run dev"
echo ""
echo "4. Deploy frontend to Amplify:"
echo "   git add ."
echo "   git commit -m \"Connect to real backend\""
echo "   git push origin main"
echo ""

print_success "Backend deployment complete! 🎉"
echo ""
echo "All configuration values have been saved to: terraform-outputs.txt"
echo ""

cd ../..
