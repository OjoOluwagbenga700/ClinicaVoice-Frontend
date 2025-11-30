# 🚀 Production Deployment Guide

## Overview

This guide covers the complete deployment process for ClinicaVoice, including backend infrastructure and frontend deployment to AWS Amplify.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform installed
- Node.js and npm installed
- AWS Amplify app created (or will be created)

## Step 1: Deploy Backend Infrastructure

### 1.1 Configure Terraform Variables

```bash
# Copy and configure terraform variables
cp backend/terraform/terraform.tfvars.example backend/terraform/terraform.tfvars
```

Edit `backend/terraform/terraform.tfvars`:
```hcl
project_name = "clinicavoice"
environment = "prod"
aws_region = "us-east-1"

# IMPORTANT: Replace with your actual Amplify domain
frontend_domain = "https://main.d2x8j9k4l5m6n7.amplifyapp.com"

# Optional customizations
log_retention_days = 30
enable_deletion_protection = true
backup_retention_days = 30
```

### 1.2 Deploy Backend

```bash
# Run the deployment script
./deploy-production.sh
```

Or manually:
```bash
cd backend/terraform
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### 1.3 Get Infrastructure Outputs

After deployment, get the values needed for frontend:
```bash
cd backend/terraform
terraform output -json > ../../infrastructure-outputs.json
```

## Step 2: Configure Frontend Environment

### 2.1 Create Production Environment File

```bash
# Copy template
cp .env.production.example .env.production
```

### 2.2 Fill in Values from Terraform Outputs

Use the values from `infrastructure-outputs.json` or terraform output:

```bash
# Get the values
terraform output cognito_user_pool_id
terraform output cognito_user_pool_client_id  
terraform output cognito_identity_pool_id
terraform output api_gateway_url
terraform output s3_bucket_name
```

Edit `.env.production`:
```env
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_YourPoolId
VITE_AWS_USER_POOL_CLIENT_ID=YourClientId
VITE_AWS_IDENTITY_POOL_ID=us-east-1:YourIdentityPoolId
VITE_API_ENDPOINT=https://YourApiGateway.execute-api.us-east-1.amazonaws.com/prod
VITE_S3_BUCKET=your-s3-bucket-name
VITE_APP_NAME=ClinicaVoice
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

## Step 3: Deploy to AWS Amplify

### Option A: Amplify Console (Recommended)

1. **Create Amplify App** (if not exists):
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Choose branch (main/master)

2. **Configure Build Settings**:
   - Amplify should auto-detect the `amplify.yml` file
   - If not, use this configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. **Set Environment Variables in Amplify Console**:
   - Go to App Settings → Environment variables
   - Add each variable from your `.env.production` file:

| Variable Name | Value |
|---------------|-------|
| `VITE_AWS_REGION` | `us-east-1` |
| `VITE_AWS_USER_POOL_ID` | `us-east-1_YourPoolId` |
| `VITE_AWS_USER_POOL_CLIENT_ID` | `YourClientId` |
| `VITE_AWS_IDENTITY_POOL_ID` | `us-east-1:YourIdentityPoolId` |
| `VITE_API_ENDPOINT` | `https://YourApiGateway.execute-api.us-east-1.amazonaws.com/prod` |
| `VITE_S3_BUCKET` | `your-s3-bucket-name` |
| `VITE_APP_NAME` | `ClinicaVoice` |
| `VITE_APP_VERSION` | `1.0.0` |
| `VITE_ENVIRONMENT` | `production` |

4. **Deploy**:
   - Click "Save and deploy"
   - Amplify will build and deploy your app

### Option B: Amplify CLI

```bash
# Install Amplify CLI if not installed
npm install -g @aws-amplify/cli

# Initialize Amplify (if not done)
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## Step 4: Update CORS Configuration

After getting your Amplify domain:

1. **Update Terraform variables**:
```hcl
# In backend/terraform/terraform.tfvars
frontend_domain = "https://main.d2x8j9k4l5m6n7.amplifyapp.com"  # Your actual domain
```

2. **Redeploy backend**:
```bash
cd backend/terraform
terraform apply -var-file="terraform.tfvars"
```

## Step 5: Verification

### 5.1 Test the Application
- Visit your Amplify URL
- Test user registration/login
- Test file upload functionality
- Test transcription workflow

### 5.2 Monitor Logs
- Check Amplify build logs
- Monitor Lambda function logs in CloudWatch
- Check API Gateway logs

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Verify variables are set in Amplify Console
   - Check variable names match exactly (case-sensitive)
   - Ensure all required variables are present

2. **CORS Errors**:
   - Verify `frontend_domain` in terraform.tfvars matches Amplify URL
   - Redeploy backend after updating domain

3. **Authentication Errors**:
   - Check Cognito User Pool configuration
   - Verify callback URLs include Amplify domain

4. **API Errors**:
   - Check API Gateway endpoint URL
   - Verify Lambda functions are deployed
   - Check CloudWatch logs for errors

### Debug Commands

```bash
# Check terraform outputs
cd backend/terraform && terraform output

# Validate security configuration
npm run security:validate

# Test build locally
npm run build:prod

# Check Amplify app status
aws amplify list-apps
```

## Security Checklist

Before going live:

- [ ] All environment variables configured in Amplify
- [ ] No hardcoded credentials in source code
- [ ] CORS restricted to production domain
- [ ] HTTPS enforced
- [ ] CloudWatch logging enabled
- [ ] Backup and monitoring configured

## Maintenance

### Regular Tasks
- Monitor CloudWatch logs
- Review security logs
- Update dependencies
- Backup verification
- Performance monitoring

### Updates
- Update environment variables in Amplify Console
- Redeploy backend with terraform
- Test thoroughly after updates