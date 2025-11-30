# 🏥 ClinicaVoice - Medical Transcription Platform

A modern, secure medical transcription platform built with React and AWS services.

## ✨ Features

- 🎤 **Audio Recording & Upload** - Record or upload medical audio files
- 📝 **AI Transcription** - AWS Transcribe for accurate medical transcription  
- 🏥 **Medical Analysis** - AWS Comprehend Medical for entity extraction
- 👥 **User Management** - Secure authentication with role-based access
- 📊 **Dashboard** - Real-time analytics and activity tracking
- 📋 **Report Templates** - Customizable medical report templates
- 🔒 **HIPAA Compliant** - End-to-end encryption and secure data handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured  
- Terraform installed

### 1. Setup
```bash
git clone <repository-url>
cd clinica-voice-frontend
npm install
```

### 2. Deploy Backend
```bash
npm run deploy
```

### 3. Deploy Frontend
See [Simple Deployment Guide](docs/SIMPLE-DEPLOY.md) for step-by-step instructions.

## 📁 Project Structure

```
├── src/                    # Frontend source code
├── backend/terraform/      # Infrastructure as Code
├── backend/lambda/         # Lambda functions
├── docs/                   # Documentation
└── scripts/               # Deployment scripts
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run deploy` - Deploy backend infrastructure
- `npm run deploy:get-env` - Get environment variables for frontend
- `npm run security:validate` - Validate security configuration
- `npm run test` - Run tests

## 📚 Documentation

- **[Simple Deployment Guide](docs/SIMPLE-DEPLOY.md)** - Quick deployment steps
- **[Detailed Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions  
- **[Security Guide](docs/SECURITY.md)** - Security configuration and best practices

## 🏗️ Architecture

**Frontend**: React 18 + Material-UI + AWS Amplify  
**Backend**: AWS Lambda + API Gateway + DynamoDB  
**AI Services**: AWS Transcribe + Comprehend Medical  
**Infrastructure**: Terraform (Infrastructure as Code)

## 🔒 Security

- ✅ AWS Cognito authentication with MFA
- ✅ Role-based access control (Clinician/Patient)
- ✅ All data encrypted in transit and at rest
- ✅ HIPAA compliant with PHI detection
- ✅ Complete audit logging

## 📄 License

MIT License - see LICENSE file for details.