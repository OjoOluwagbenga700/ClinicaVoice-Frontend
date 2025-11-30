# ClinicaVoice Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] `amplify.yml` created
- [x] `.gitignore` updated
- [x] Build tested locally (`npm run build` successful)
- [x] Build output verified in `dist/` folder
- [x] All tests passing (27 tests)

## 📋 Next Steps: Deploy to AWS Amplify

### Step 1: Commit and Push to Git

```bash
# Add all files
git add .

# Commit with deployment message
git commit -m "Add Amplify deployment configuration"

# Push to your repository
git push origin main
```

### Step 2: Connect to AWS Amplify Console

1. Go to: https://console.aws.amazon.com/amplify/
2. Ensure you're in **us-east-1** region
3. Click **"New app"** → **"Host web app"**

### Step 3: Connect Repository

1. Select your Git provider (GitHub/GitLab/Bitbucket)
2. Click **"Authorize"** to grant access
3. Select your repository
4. Select branch: **main**
5. Click **"Next"**

### Step 4: Configure Build Settings

1. **App name:** `ClinicaVoice`
2. **Build settings:** Should auto-detect `amplify.yml`
3. **Environment:** Leave as default
4. Click **"Next"**

### Step 5: Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Wait 3-5 minutes for deployment

### Step 6: Configure SPA Redirects (IMPORTANT!)

After deployment completes:

1. Go to **"App settings"** → **"Rewrites and redirects"**
2. Click **"Add rule"**
3. Configure:
   - **Source address:** `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address:** `/index.html`
   - **Type:** `200 (Rewrite)`
4. Click **"Save"**

This ensures React Router works correctly!

### Step 7: Test Your Deployment

Your app will be available at:
```
https://main.YOUR_APP_ID.amplifyapp.com
```

Test these critical features:
- [ ] Home page loads
- [ ] Login page accessible
- [ ] Register page accessible
- [ ] Can log in with test account
- [ ] Dashboard loads after login
- [ ] Navigation works (all routes)
- [ ] Transcribe page accessible
- [ ] Template builder accessible
- [ ] Reports page accessible
- [ ] Logout works

## 🔧 Optional: Custom Domain Setup

1. In Amplify Console → **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain
4. Follow DNS configuration steps
5. Wait for SSL certificate (up to 24 hours)

## 📊 Monitor Your Deployment

### View Build Status
- Amplify Console → Your App → **"Build history"**

### View Logs
- Click on any build → View detailed logs

### Check Performance
- Amplify Console → **"Monitoring"**

## 🚨 Troubleshooting

### If Build Fails:
1. Check build logs in Amplify Console
2. Verify `npm run build` works locally
3. Check Node.js version compatibility

### If App Doesn't Load:
1. Verify SPA redirect rule is configured
2. Check browser console for errors
3. Verify API endpoints are accessible

### If Login Doesn't Work:
1. Check Cognito configuration
2. Verify CORS settings on API Gateway
3. Check browser console for auth errors

## 🎯 Post-Deployment Tasks

- [ ] Test all user workflows
- [ ] Verify role-based access control
- [ ] Test on mobile devices
- [ ] Share URL with stakeholders
- [ ] Set up monitoring alerts
- [ ] Configure custom domain (optional)
- [ ] Document production URL

## 📝 Important URLs

- **AWS Amplify Console:** https://console.aws.amazon.com/amplify/
- **Your Cognito User Pool:** us-east-1_7fvXVi5oM
- **Your API Gateway:** https://r7le6kf535.execute-api.us-east-1.amazonaws.com
- **Your S3 Bucket:** terraform-20251121023049872500000001

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ App loads at Amplify URL
- ✅ Users can register and login
- ✅ All routes work correctly
- ✅ API calls succeed
- ✅ File uploads work
- ✅ Role-based access control functions

---

## Need Help?

Refer to:
- `AMPLIFY_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `MANUAL_TESTING_GUIDE.md` - Testing procedures
- AWS Amplify Documentation: https://docs.amplify.aws/

---

**Ready to deploy? Run the commands in Step 1 above!** 🚀
