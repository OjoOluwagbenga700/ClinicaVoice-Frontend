# 🚀 Simple Deployment Guide

## Quick Start - Deploy Backend First

### 1. Deploy Backend Infrastructure

```bash
# Deploy backend with permissive CORS
npm run deploy:backend
```

This will:
- ✅ Create `terraform.tfvars` from template
- ✅ Deploy all AWS infrastructure (API Gateway, Lambda, DynamoDB, S3, Cognito)
- ✅ Generate `.env.production` with all the values you need
- ✅ Show you the environment variables for Amplify

### 2. Deploy Frontend to Amplify

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. **Create New App** → "Host web app"
3. **Connect GitHub** → Select your repository → Choose branch
4. **Add Environment Variables** (from the output of step 1):

```
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

5. **Deploy** → Amplify will build and deploy your app

### 3. Test Your Application

- Visit your Amplify URL
- Test user registration
- Test file upload
- Test transcription workflow

## That's It! 🎉

Your application is now live with:
- ✅ Secure authentication (Cognito)
- ✅ File upload (S3 with presigned URLs)
- ✅ Transcription processing (AWS Transcribe)
- ✅ Medical analysis (Comprehend Medical)
- ✅ All data encrypted and backed up

## Security Note

The backend is deployed with permissive CORS (`*`) for simplicity. For production, you can later restrict CORS to your specific Amplify domain by:

1. Updating `frontend_domain` in `backend/terraform/terraform.tfvars`
2. Running `terraform apply` again

## Troubleshooting

### Backend Issues
```bash
# Check terraform outputs
cd backend/terraform && terraform output

# Check logs
aws logs describe-log-groups --log-group-name-prefix="/aws/lambda/clinicavoice"
```

### Frontend Issues
- Check Amplify build logs in the console
- Verify all environment variables are set
- Check browser console for errors

### Need Help?
- See `DEPLOYMENT.md` for detailed instructions
- Check `SECURITY.md` for security best practices
- Run `npm run security:validate` to check configuration