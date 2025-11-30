#!/bin/bash

# Security Configuration Validation Script
echo "🔒 ClinicaVoice Security Configuration Validator"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Initialize counters
PASS=0
FAIL=0
WARN=0

echo ""
echo "📁 Checking File Structure..."

# Check if required files exist
if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
    ((PASS++))
else
    check_fail ".env.example missing"
    ((FAIL++))
fi

if [ -f ".env.production.example" ]; then
    check_pass ".env.production.example exists"
    ((PASS++))
else
    check_fail ".env.production.example missing"
    ((FAIL++))
fi

if [ -f "backend/terraform/terraform.tfvars.example" ]; then
    check_pass "terraform.tfvars.example exists"
    ((PASS++))
else
    check_fail "terraform.tfvars.example missing"
    ((FAIL++))
fi

if [ -f "SECURITY.md" ]; then
    check_pass "SECURITY.md documentation exists"
    ((PASS++))
else
    check_fail "SECURITY.md missing"
    ((FAIL++))
fi

echo ""
echo "🔍 Checking Source Code Security..."

# Check for hardcoded credentials in source code
echo "  Checking for hardcoded AWS credentials..."

# Check for User Pool IDs
if grep -r "us-east-1_" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "import.meta.env" >/dev/null; then
    check_fail "Found hardcoded AWS User Pool IDs in source code"
    echo "    Found: $(grep -r "us-east-1_" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "import.meta.env")"
    ((FAIL++))
else
    check_pass "No hardcoded AWS User Pool IDs found"
    ((PASS++))
fi

# Check for Client IDs (specific Cognito client ID pattern)
if grep -r "[0-9a-z]\{26\}.*amazonaws" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "import.meta.env" >/dev/null; then
    check_fail "Found potential hardcoded Client IDs in source code"
    ((FAIL++))
else
    check_pass "No hardcoded Client IDs found"
    ((PASS++))
fi

# Check for Identity Pool IDs
if grep -r "us-east-1:[a-f0-9-]\{36\}" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "import.meta.env" >/dev/null; then
    check_fail "Found hardcoded Identity Pool IDs in source code"
    ((FAIL++))
else
    check_pass "No hardcoded Identity Pool IDs found"
    ((PASS++))
fi

# Check for API Gateway URLs
if grep -r "https://[a-z0-9]\{10\}\.execute-api" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "import.meta.env" >/dev/null; then
    check_fail "Found hardcoded API Gateway URLs in source code"
    ((FAIL++))
else
    check_pass "No hardcoded API Gateway URLs found"
    ((PASS++))
fi

# Check if environment variables are used
if grep -r "import.meta.env.VITE_" src/ >/dev/null 2>&1; then
    check_pass "Environment variables are being used"
    ((PASS++))
else
    check_fail "Environment variables not found in source code"
    ((FAIL++))
fi

# Check for wildcard CORS in terraform
if grep -r 'allowed_origins.*=.*\[.*"\*".*\]' backend/terraform/ >/dev/null 2>&1; then
    check_fail "Found wildcard CORS (*) in Terraform configuration"
    ((FAIL++))
else
    check_pass "No wildcard CORS found in Terraform"
    ((PASS++))
fi

echo ""
echo "⚙️  Checking Configuration Files..."

# Check if production config exists
if [ -f ".env.production" ]; then
    check_pass ".env.production exists"
    ((PASS++))
    
    # Check if it has required variables
    required_vars=("VITE_AWS_USER_POOL_ID" "VITE_AWS_USER_POOL_CLIENT_ID" "VITE_API_ENDPOINT")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.production; then
            check_pass "$var is configured in .env.production"
            ((PASS++))
        else
            check_fail "$var is missing from .env.production"
            ((FAIL++))
        fi
    done
else
    check_warn ".env.production not found (create for production deployment)"
    ((WARN++))
fi

# Check terraform vars
if [ -f "backend/terraform/terraform.tfvars" ]; then
    check_pass "terraform.tfvars exists"
    ((PASS++))
    
    if grep -q "frontend_domain.*https://" backend/terraform/terraform.tfvars; then
        check_pass "frontend_domain uses HTTPS"
        ((PASS++))
    else
        check_fail "frontend_domain should use HTTPS"
        ((FAIL++))
    fi
else
    check_warn "terraform.tfvars not found (create for deployment)"
    ((WARN++))
fi

echo ""
echo "🛡️  Checking .gitignore..."

# Check if sensitive files are ignored
sensitive_files=(".env.production" "terraform.tfvars" "*.tfstate")
for file in "${sensitive_files[@]}"; do
    if grep -q "$file" .gitignore; then
        check_pass "$file is in .gitignore"
        ((PASS++))
    else
        check_fail "$file should be in .gitignore"
        ((FAIL++))
    fi
done

echo ""
echo "📊 Security Validation Summary"
echo "=============================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"

echo ""
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Security validation passed! Your configuration is production-ready.${NC}"
    exit 0
else
    echo -e "${RED}🚨 Security validation failed! Please fix the issues above before deploying.${NC}"
    echo ""
    echo "📚 For help, see SECURITY.md"
    exit 1
fi