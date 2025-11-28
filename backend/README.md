# ClinicaVoice Backend - Terraform + Lambda

Complete backend infrastructure for ClinicaVoice platform using Terraform and AWS Lambda.

## 🏗️ Architecture

```
Frontend (React) → API Gateway → Lambda Functions → DynamoDB
                                      ↓
                                AWS Transcribe
                                      ↓
                                    S3
```

## 📦 What's Included

- **3 DynamoDB Tables**: Reports, Templates, Transcriptions
- **8 Lambda Functions**: Dashboard, Reports, Templates, Transcriptions
- **API Gateway Integration**: REST API with Cognito authorizer
- **IAM Roles & Policies**: Least privilege access

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured
- Terraform installed (v1.0+)
- Node.js 18+ (for Lambda functions)

### Deploy

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 📁 Structure

```
backend/
├── lambda/              # Lambda function code
│   ├── dashboard-stats/
│   ├── reports/
│   ├── templates/
│   └── ...
├── terraform/           # Infrastructure as Code
│   ├── main.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   └── variables.tf
└── README.md
```

## 🔧 Configuration

Update `terraform/variables.tf` with your values:
- AWS region
- Cognito User Pool ID
- S3 bucket name

## 📝 API Endpoints

After deployment, your API Gateway will have:

- `GET /dashboard/stats` - Clinician statistics
- `GET /dashboard/activity` - Activity chart data
- `GET /dashboard/recent-notes` - Recent transcriptions
- `GET /reports` - List all reports
- `POST /reports` - Create report
- `PUT /reports/{id}` - Update report
- `DELETE /reports/{id}` - Delete report
- `GET /templates` - List templates
- `POST /templates` - Create template
- `PUT /templates/{id}` - Update template
- `DELETE /templates/{id}` - Delete template

## 🧪 Testing

```bash
# Test Lambda functions locally
cd lambda/dashboard-stats
node index.mjs

# Test with SAM
sam local invoke DashboardStatsFunction
```

## 📊 Monitoring

- CloudWatch Logs for each Lambda
- DynamoDB metrics
- API Gateway metrics

## 🔐 Security

- Cognito authorizer on all endpoints
- IAM roles with least privilege
- Encrypted DynamoDB tables
- VPC endpoints (optional)

## 💰 Cost Estimate

- DynamoDB: Pay per request (~$1-5/month)
- Lambda: First 1M requests free (~$0-2/month)
- API Gateway: First 1M requests free (~$0-3/month)

**Total: ~$5-10/month for small usage**

## 🆘 Troubleshooting

See `docs/TROUBLESHOOTING.md`

## 📚 Documentation

- [Lambda Functions](docs/LAMBDA.md)
- [DynamoDB Schema](docs/DYNAMODB.md)
- [API Reference](docs/API.md)
