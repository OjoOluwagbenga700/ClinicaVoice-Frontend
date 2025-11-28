#!/bin/bash

set -e

echo "🗑️  ClinicaVoice Backend Destruction Script"
echo "=========================================="
echo ""

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_warning "This will DESTROY all backend infrastructure:"
echo "  - Cognito User Pool (all users will be deleted)"
echo "  - S3 Bucket (all files will be deleted)"
echo "  - API Gateway"
echo "  - DynamoDB Tables (all data will be lost)"
echo "  - Lambda Functions"
echo "  - IAM Roles"
echo ""
print_error "THIS ACTION CANNOT BE UNDONE!"
echo ""

read -p "Type 'destroy' to confirm: " confirm

if [ "$confirm" != "destroy" ]; then
    echo "Destruction cancelled"
    exit 0
fi

echo ""
echo "Preparing for destruction..."
echo ""

cd backend/terraform || {
    print_error "backend/terraform directory not found"
    exit 1
}

# Get S3 bucket name from Terraform output
echo "📦 Emptying S3 bucket..."
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)

if [ -n "$S3_BUCKET" ] && [ "$S3_BUCKET" != "null" ]; then
    echo "Found S3 bucket: $S3_BUCKET"
    
    # Check if bucket exists
    if aws s3 ls "s3://$S3_BUCKET" 2>/dev/null; then
        echo "Deleting all objects in bucket..."
        aws s3 rm "s3://$S3_BUCKET" --recursive || {
            print_warning "Failed to empty S3 bucket. Continuing anyway..."
        }
        
        # Delete all versions if versioning is enabled
        echo "Deleting all object versions..."
        aws s3api delete-objects --bucket "$S3_BUCKET" \
            --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET" \
            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
            --max-items 1000)" 2>/dev/null || true
        
        # Delete all delete markers
        aws s3api delete-objects --bucket "$S3_BUCKET" \
            --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET" \
            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
            --max-items 1000)" 2>/dev/null || true
        
        echo "✅ S3 bucket emptied"
    else
        echo "S3 bucket not found or already deleted"
    fi
else
    print_warning "Could not determine S3 bucket name. Skipping bucket cleanup."
fi

echo ""
echo "🗑️  Destroying infrastructure..."
echo ""

terraform destroy || {
    print_error "Terraform destroy failed"
    echo ""
    print_warning "If the error is about S3 bucket not being empty, try:"
    echo "  aws s3 rm s3://$S3_BUCKET --recursive"
    echo "  terraform destroy"
    exit 1
}

echo ""
echo "✅ Infrastructure destroyed"
echo ""

cd ../..
