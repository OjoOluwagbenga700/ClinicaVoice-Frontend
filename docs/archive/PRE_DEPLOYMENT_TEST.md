# Pre-Deployment Testing Guide

## Overview
Before deploying to AWS Amplify, let's test the application locally with the mock API to ensure everything works correctly.

---

## ✅ Current Configuration

- **Mock API:** ✅ Enabled (`USE_MOCK_API = true`)
- **AWS Cognito:** ✅ Configured (real authentication)
- **AWS S3:** ✅ Configured (real file storage)
- **AWS Transcribe:** ✅ Configured (real transcription)
- **Dashboard Data:** 🔄 Mock API
- **Reports Data:** 🔄 Mock API
- **Templates Data:** 🔄 Mock API

This means:
- Authentication is REAL (you can create actual accounts)
- File uploads are REAL (files go to S3)
- Transcription is REAL (uses AWS Transcribe)
- Dashboard/Reports/Templates use mock data (but work perfectly for testing)

---

## 🧪 Local Testing Steps

### 1. Start Development Server

```bash
npm run dev
```

The app should start at `http://localhost:5173`

### 2. Test Authentication Flow

#### Register New User (Clinician)
1. Navigate to `/register`
2. Fill in:
   - Name: "Dr. Test Clinician"
   - Email: "test-clinician@example.com"
   - Password: (meet Cognito requirements - 8+ chars, uppercase, lowercase, number)
   - User Type: **Clinician**
3. Click "Register"
4. Check email for confirmation code
5. Enter code and confirm
6. Should redirect to login

#### Register New User (Patient)
1. Navigate to `/register`
2. Fill in:
   - Name: "Test Patient"
   - Email: "test-patient@example.com"
   - Password: (meet Cognito requirements)
   - User Type: **Patient**
3. Complete registration flow

#### Login
1. Navigate to `/login`
2. Enter credentials
3. Should redirect to dashboard

### 3. Test Clinician Dashboard

Login as clinician and verify:

- [ ] **Dashboard Overview**
  - Statistics cards show: 128 active patients, 24 transcriptions, 7 pending reviews
  - Activity chart displays with data
  - Recent notes section shows 3 notes
  - Quick action buttons visible

- [ ] **Transcribe Page**
  - Can access transcribe page
  - Record button works (requests microphone)
  - Upload button works
  - File validation works (try invalid file)

- [ ] **Reports Page**
  - Shows 7 mock reports
  - Search functionality works
  - Can click on reports
  - Reports display patient names and dates

- [ ] **Template Builder**
  - Can create new templates
  - Can edit template names
  - Rich text editor works
  - Can insert placeholders
  - Preview mode works
  - Can delete templates
  - Can switch between templates

- [ ] **Navigation**
  - All sidebar links work
  - Can navigate between pages
  - Logout works

### 4. Test Patient Dashboard

Login as patient and verify:

- [ ] **Dashboard Overview**
  - Shows simplified patient view
  - Statistics: 8 reports, 2 appointments, last visit date
  - Recent reports section shows 3 reports

- [ ] **My Reports**
  - Shows only patient's reports (3 reports)
  - Reports are in read-only mode
  - Cannot edit or delete

- [ ] **Access Restrictions**
  - Cannot access `/dashboard/transcribe`
  - Cannot access `/dashboard/templates`
  - Sidebar only shows: My Reports, My Profile, Settings

- [ ] **Navigation**
  - Limited navigation menu
  - Logout works

### 5. Test Role-Based Access Control

- [ ] Try accessing clinician routes as patient (should be blocked)
- [ ] Try accessing patient routes as clinician (should work)
- [ ] Verify different sidebar menus for each role
- [ ] Verify different dashboard views for each role

### 6. Test Responsive Design

- [ ] Resize browser to mobile width (< 768px)
- [ ] Verify mobile layout works
- [ ] Test on tablet width (768-1024px)
- [ ] Test on desktop width (> 1024px)

### 7. Test Language Switching

- [ ] Switch to French
- [ ] Verify interface updates
- [ ] Switch back to English
- [ ] Verify state is preserved

### 8. Test Error Handling

- [ ] Try invalid login credentials
- [ ] Try uploading invalid file format
- [ ] Try uploading file > 100MB
- [ ] Verify error messages display correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Solution:** Clear browser cache and localStorage, then refresh

### Issue: Microphone not working
**Solution:** Ensure browser has microphone permissions

### Issue: Cognito errors
**Solution:** Verify AWS credentials in `src/aws/amplifyConfig.js`

### Issue: Build fails
**Solution:** Run `npm ci` to reinstall dependencies

---

## ✅ Pre-Deployment Checklist

Before deploying to Amplify, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Authentication works (register + login)
- [ ] Dashboard loads for both roles
- [ ] All navigation works
- [ ] Mock data displays correctly
- [ ] Responsive design works
- [ ] Language switching works
- [ ] Error handling works

---

## 🚀 Ready to Deploy?

Once all tests pass locally, you're ready to deploy to AWS Amplify!

### Quick Deployment Commands:

```bash
# 1. Ensure everything is committed
git add .
git commit -m "Ready for deployment with mock API"
git push origin main

# 2. Go to AWS Amplify Console
# https://console.aws.amazon.com/amplify/

# 3. Follow the deployment checklist in DEPLOYMENT_CHECKLIST.md
```

---

## 📊 What Users Will Experience

### With Mock API Deployed:

✅ **Working Features:**
- User registration and login (REAL)
- Role-based access control (REAL)
- Audio recording and upload (REAL)
- File transcription (REAL - uses AWS Transcribe)
- Dashboard with statistics (MOCK data)
- Reports viewing and search (MOCK data)
- Template creation and editing (MOCK data - not persisted)
- Responsive design
- Language switching
- CSV export

⚠️ **Limitations:**
- Dashboard statistics are static mock data
- Reports don't persist (refresh loses data)
- Templates don't persist (refresh loses data)
- No real patient-clinician data relationships

### When Real Backend is Added:

All features will work with real data persistence!

---

## 🎯 Testing Scenarios

### Scenario 1: New Clinician Onboarding
1. Register as clinician
2. Confirm email
3. Login
4. View dashboard overview
5. Create a template
6. Record a transcription
7. View reports

**Expected:** All steps work smoothly with mock data

### Scenario 2: Patient Viewing Reports
1. Register as patient
2. Confirm email
3. Login
4. View dashboard
5. Click on a report
6. Try to edit (should be blocked)

**Expected:** Patient sees limited interface, cannot edit

### Scenario 3: Multi-User Testing
1. Create 2 clinician accounts
2. Create 2 patient accounts
3. Login with each
4. Verify each sees appropriate interface

**Expected:** Role-based access works correctly

---

## 📝 Test Results Template

Use this to document your testing:

```
Date: ___________
Tester: ___________

Authentication:
[ ] Registration works
[ ] Email confirmation works
[ ] Login works
[ ] Logout works

Clinician Features:
[ ] Dashboard loads
[ ] Transcribe accessible
[ ] Templates accessible
[ ] Reports accessible
[ ] All features work

Patient Features:
[ ] Dashboard loads (simplified)
[ ] Reports accessible (read-only)
[ ] Transcribe blocked
[ ] Templates blocked

RBAC:
[ ] Clinician sees full menu
[ ] Patient sees limited menu
[ ] Access restrictions work

Responsive:
[ ] Mobile layout works
[ ] Tablet layout works
[ ] Desktop layout works

Issues Found:
_________________________________
_________________________________
_________________________________

Overall Status: [ ] PASS  [ ] FAIL
```

---

## 🎉 Success Criteria

Your application is ready to deploy when:

✅ All authentication flows work  
✅ Both user roles function correctly  
✅ Mock data displays properly  
✅ No console errors  
✅ Responsive design works  
✅ All navigation functions  
✅ Build completes successfully  

---

**Next Step:** Once local testing is complete, proceed to `DEPLOYMENT_CHECKLIST.md` to deploy to AWS Amplify!
