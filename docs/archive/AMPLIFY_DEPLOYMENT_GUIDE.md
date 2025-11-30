# AWS Amplify Deployment Guide for ClinicaVoice

## Overview
This guide walks you through deploying your ClinicaVoice application to AWS Amplify Hosting with continuous deployment from your Git repository.

---

## Prerequisites

✅ **You Already Have:**
- AWS Account with Amplify configured
- Cognito User Pool: `us-east-1_7fvXVi5oM`
- API Gateway: `https://r7le6kf535.execute-api.us-east-1.amazonaws.com`
- S3 Bucket: `terraform-20251121023049872500000001`

📋 **You Need:**
- Git repository (GitHub, GitLab, Bitbucket, or AWS CodeCommit)
- Code pushed to repository
- AWS Console access

---

## Step 1: Prepare Your Repository

### 1.1 Update .gitignore
First, let's ensure your .gitignore is comprehensive:

```bash
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production build
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Amplify
amplify/
.amplify/
amplify-backup/

# Misc
*.pem
```

### 1.2 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit - ClinicaVoice application"
```

### 1.3 Push to Remote Repository

**For GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/clinica-voice.git
git branch -M main
git push -u origin main
```

**For GitLab:**
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/clinica-voice.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create amplify.yml Build Configuration

Create a build configuration file for Amplify:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
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

Save this as `amplify.yml` in your project root, then commit:

```bash
git add amplify.yml
git commit -m "Add Amplify build configuration"
git push
```

---

## Step 3: Deploy to AWS Amplify Hosting

### 3.1 Access AWS Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Make sure you're in the **us-east-1** region (same as your backend)
3. Click **"New app"** → **"Host web app"**

### 3.2 Connect Your Repository

1. **Select your Git provider:**
   - GitHub
   - GitLab
   - Bitbucket
   - AWS CodeCommit

2. **Authorize AWS Amplify:**
   - Click "Authorize" when prompted
   - Grant access to your repositories

3. **Select repository and branch:**
   - Repository: `clinica-voice` (or your repo name)
   - Branch: `main` (or your default branch)
   - Click **"Next"**

### 3.3 Configure Build Settings

1. **App name:** `ClinicaVoice` (or your preferred name)

2. **Build settings:** Amplify should auto-detect your `amplify.yml` file
   - If not detected, paste the amplify.yml content manually

3. **Advanced settings (Optional):**
   - Add environment variables if needed (though your config is hardcoded)
   - Build image: Leave as default (Amazon Linux 2023)

4. Click **"Next"**

### 3.4 Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**

3. **Wait for deployment** (usually 3-5 minutes):
   - Provision: Setting up build environment
   - Build: Running `npm ci` and `npm run build`
   - Deploy: Uploading to Amplify CDN
   - Verify: Health checks

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

1. In Amplify Console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain (e.g., `clinicavoice.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (can take up to 24 hours)

### 4.2 Default Amplify Domain

Your app will be available at:
```
https://main.YOUR_APP_ID.amplifyapp.com
```

---

## Step 5: Configure Environment Variables (If Needed)

If you want to move your AWS config to environment variables:

### 5.1 Update amplifyConfig.js

```javascript
import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_7fvXVi5oM",
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "16vaq7l91itotdblpngintd71n",
      signUpVerificationMethod: "code",
      loginWith: { 
        email: true 
      },
    },
  },
  API: {
    endpoints: [
      {
        name: "ClinicaVoiceAPI",
        endpoint: import.meta.env.VITE_API_ENDPOINT || "https://r7le6kf535.execute-api.us-east-1.amazonaws.com",
        region: import.meta.env.VITE_AWS_REGION || "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET || "terraform-20251121023049872500000001",
      region: import.meta.env.VITE_AWS_REGION || "us-east-1",
    },
  },
};

Amplify.configure(awsConfig);
export default awsConfig;
```

### 5.2 Add Environment Variables in Amplify Console

1. Go to **"App settings"** → **"Environment variables"**
2. Add variables:
   - `VITE_USER_POOL_ID`: `us-east-1_7fvXVi5oM`
   - `VITE_USER_POOL_CLIENT_ID`: `16vaq7l91itotdblpngintd71n`
   - `VITE_API_ENDPOINT`: `https://r7le6kf535.execute-api.us-east-1.amazonaws.com`
   - `VITE_AWS_REGION`: `us-east-1`
   - `VITE_S3_BUCKET`: `terraform-20251121023049872500000001`
3. Click **"Save"**
4. Redeploy the app

---

## Step 6: Set Up Continuous Deployment

### 6.1 Automatic Deployments

Amplify automatically deploys when you push to your connected branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push

# Amplify will automatically:
# 1. Detect the push
# 2. Start a new build
# 3. Deploy the new version
# 4. Update your live site
```

### 6.2 Branch Deployments

You can deploy multiple branches:

1. In Amplify Console, click **"Connect branch"**
2. Select branch (e.g., `develop`, `staging`)
3. Each branch gets its own URL:
   - `main`: `https://main.YOUR_APP_ID.amplifyapp.com`
   - `develop`: `https://develop.YOUR_APP_ID.amplifyapp.com`

---

## Step 7: Configure Redirects for SPA

Since this is a React SPA with client-side routing, you need to configure redirects:

### 7.1 Add Redirect Rules

1. In Amplify Console, go to **"App settings"** → **"Rewrites and redirects"**
2. Add this rule:

```
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>
Target: /index.html
Type: 200 (Rewrite)
```

This ensures all routes (like `/dashboard`, `/login`) work correctly.

---

## Step 8: Monitor and Manage

### 8.1 View Deployment Status

In Amplify Console:
- **Build history**: See all deployments
- **Logs**: View build and deployment logs
- **Monitoring**: Check traffic and performance

### 8.2 Rollback if Needed

1. Go to **"Build history"**
2. Find a previous successful deployment
3. Click **"Redeploy this version"**

### 8.3 Set Up Notifications

1. Go to **"App settings"** → **"Notifications"**
2. Add email or SNS topic for:
   - Build success
   - Build failure
   - Deployment completion

---

## Step 9: Security Best Practices

### 9.1 Enable HTTPS Only

Amplify automatically provides SSL certificates and enforces HTTPS.

### 9.2 Configure CORS

Ensure your API Gateway has proper CORS settings:

```json
{
  "Access-Control-Allow-Origin": "https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
}
```

### 9.3 Review IAM Permissions

Ensure your Amplify service role has necessary permissions:
- S3 bucket access
- Cognito user pool access
- API Gateway invoke permissions

---

## Step 10: Performance Optimization

### 10.1 Enable Caching

Amplify automatically caches static assets. Verify in:
- **"App settings"** → **"General"** → **"Cache settings"**

### 10.2 Optimize Build

Update `vite.config.mjs` for production:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'aws-vendor': ['aws-amplify', '@aws-amplify/ui-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

---

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to build details
2. Click on failed phase
3. Review error messages

**Common issues:**
- Missing dependencies: Run `npm ci` locally to verify
- Build script errors: Test `npm run build` locally
- Memory issues: Increase build instance size in settings

### App Doesn't Load

**Check:**
1. Build artifacts are in `dist/` folder
2. `index.html` exists in dist
3. Redirect rules are configured
4. Browser console for errors

### API Calls Fail

**Verify:**
1. API Gateway endpoint is correct
2. CORS is configured properly
3. Cognito authentication works
4. IAM roles have proper permissions

### Environment Variables Not Working

**Ensure:**
1. Variables start with `VITE_` prefix
2. Variables are saved in Amplify Console
3. App is redeployed after adding variables
4. Variables are accessed with `import.meta.env.VITE_*`

---

## Quick Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] `amplify.yml` file created and committed
- [ ] `.gitignore` updated
- [ ] Connected repository to Amplify Console
- [ ] Build completed successfully
- [ ] App accessible at Amplify URL
- [ ] SPA redirect rules configured
- [ ] Test login functionality
- [ ] Test transcription workflow
- [ ] Test role-based access control
- [ ] Verify API calls work
- [ ] Check responsive design
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring and alerts

---

## Useful Commands

```bash
# Test build locally
npm run build
npm run preview

# Check build output
ls -la dist/

# View build size
du -sh dist/

# Test production build locally
npx serve dist
```

---

## Next Steps After Deployment

1. **Test thoroughly** on the live URL
2. **Share with stakeholders** for feedback
3. **Monitor performance** in Amplify Console
4. **Set up CI/CD** for automated testing
5. **Configure custom domain** for production
6. **Enable monitoring** with CloudWatch
7. **Set up backup strategy** for user data

---

## Support Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amplify Hosting Guide](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [AWS Support](https://console.aws.amazon.com/support/)

---

## Cost Estimation

**Amplify Hosting Pricing (as of 2024):**
- Build minutes: $0.01 per minute
- Hosting: $0.15 per GB served
- Free tier: 1000 build minutes/month, 15 GB served/month

**Estimated monthly cost for small app:**
- ~10 builds/month × 3 min = 30 build minutes = $0.30
- ~5 GB served = $0.75
- **Total: ~$1-2/month** (within free tier initially)

---

## Congratulations! 🎉

Your ClinicaVoice application is now deployed on AWS Amplify with:
- ✅ Automatic deployments from Git
- ✅ HTTPS enabled
- ✅ Global CDN distribution
- ✅ Continuous integration
- ✅ Easy rollback capability

Your app is live and ready for users!
