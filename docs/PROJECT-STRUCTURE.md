# 📁 ClinicaVoice Project Structure

## 🗂️ Root Directory

### Scripts (4 files)
```
deploy.sh                    # Deploy backend infrastructure
destroy-backend.sh           # Destroy infrastructure (cleanup)
get-amplify-env-vars.sh     # Extract environment variables for Amplify
validate-security.sh        # Security configuration validation
```

### Configuration Files
```
README.md                   # Main project documentation
package.json               # NPM dependencies and scripts
amplify.yml                # Amplify build configuration
vite.config.mjs            # Vite build configuration
vitest.config.mjs          # Test configuration
.env.example               # Environment variables template
.env.local                 # Local development environment
.env.production.example    # Production environment template
.gitignore                 # Git ignore rules
```

## 📚 Documentation (docs/)

### Quick Start
- `SIMPLE-DEPLOY.md` - **START HERE** - Simple 3-step deployment
- `README.md` - Documentation index

### Deployment Guides
- `DEPLOYMENT.md` - Detailed deployment instructions
- `DEPLOY_NOW.md` - Alternative quick deployment
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `AMPLIFY_DEPLOYMENT_GUIDE.md` - Amplify-specific guide

### Security & Testing
- `SECURITY.md` - Security configuration and best practices
- `TESTING_GUIDE.md` - Testing overview
- `MANUAL_TESTING_GUIDE.md` - Manual testing procedures
- `PRE_DEPLOYMENT_TEST.md` - Pre-deployment testing
- `RBAC_QUICK_TEST_GUIDE.md` - Role-based access testing

### Backend Integration
- `BACKEND_INTEGRATION_STATUS.md` - Backend status
- `DASHBOARD_BACKEND_INTEGRATION.md` - Dashboard APIs
- `REPORTS_BACKEND_INTEGRATION.md` - Reports APIs
- `TEMPLATE_BACKEND_INTEGRATION.md` - Template APIs

### Implementation Details
- `SESSION_EXPIRATION_IMPLEMENTATION.md` - Session management
- `RBAC_TEST_VERIFICATION.md` - RBAC verification

### Project History
- `CHECKPOINT_7_SUMMARY.md` - Project milestone summary
- `BACKEND_DEPLOYMENT_READY.md` - Backend deployment status
- `BACKEND_TERRAFORM_COMPLETE_GUIDE.md` - Terraform guide
- `COMPLETE_TERRAFORM_DEPLOYMENT.md` - Complete deployment
- `FINAL_DEPLOYMENT_SUMMARY.md` - Final deployment summary

## 🏗️ Source Code Structure

```
src/                        # Frontend source code
├── components/             # React components
├── pages/                  # Page components
├── services/              # API services
├── aws/                   # AWS configuration
├── utils/                 # Utility functions
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization
└── __tests__/             # Test files

backend/                   # Backend infrastructure
├── terraform/             # Infrastructure as Code
│   ├── *.tf              # Terraform configuration files
│   └── terraform.tfvars.example  # Configuration template
└── lambda/                # Lambda function source code
    ├── dashboard/         # Dashboard API
    ├── reports/           # Reports API
    ├── templates/         # Templates API
    ├── transcribe/        # Transcription API
    ├── upload/            # File upload API
    ├── transcribe-processor/  # S3 event processor
    └── comprehend-medical/    # Medical analysis
```

## 🚀 Quick Commands

```bash
# Deploy backend
npm run deploy

# Get environment variables for Amplify
npm run deploy:get-env

# Validate security configuration
npm run security:validate

# Start development
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📋 Deployment Workflow

1. **Deploy Backend**: `npm run deploy`
2. **Get Environment Variables**: `npm run deploy:get-env`
3. **Deploy Frontend**: Follow `docs/SIMPLE-DEPLOY.md`

---

**Ready to deploy?** Start with `docs/SIMPLE-DEPLOY.md` 🚀