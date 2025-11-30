#!/bin/bash

# Simple Production Deployment Script for ClinicaVoice
echo "🚀 ClinicaVoice Simple Deployment"
echo "================================="

# Step 1: Check if terraform.tfvars exists
if [ ! -f "backend/terraform/terraform.tfvars" ]; then
    echo "📝 Creating terraform.tfvars from template..."
    cp backend/terraform/terraform.tfvars.example backend/terraform/terraform.tfvars
    echo "✅ Created backend/terraform/terraform.tfvars"
fi

# Step 2: Deploy backend
echo "🏗️  Deploying backend infrastructure..."
cd backend/terraform

terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars" -auto-approve

echo "✅ Backend deployed successfully!"

# Step 3: Get environment variables for frontend
echo "📤 Getting environment variables for frontend..."
terraform output -json > ../../infrastructure-outputs.json

cd ../..

# Step 4: Generate .env.production
echo "🔧 Generating .env.production..."
./get-amplify-env-vars.sh

echo ""
echo "🎉 Backend deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Your backend is deployed and ready"
echo "2. Environment variables are in .env.production"
echo "3. Deploy frontend to Amplify using these environment variables"
echo ""
echo "🚀 To deploy frontend:"
echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "2. Create new app → Connect GitHub repository"
echo "3. Add environment variables from the output above"
echo "4. Deploy!"