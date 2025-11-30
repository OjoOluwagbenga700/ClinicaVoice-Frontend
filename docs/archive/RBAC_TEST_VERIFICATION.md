# Role-Based Access Control (RBAC) Test Verification

## Test Checkpoint for Task 7

This document provides a comprehensive test plan to verify that role-based access control is working correctly in the ClinicaVoice application.

## Implementation Summary

The following RBAC components have been implemented:

### 1. Core Authentication & Role Management
- ✅ `src/utils/auth.js` - User type retrieval from Cognito custom attributes
- ✅ `src/hooks/useUserRole.js` - Custom hook for accessing user role
- ✅ `src/components/ProtectedRoute.jsx` - Route protection component
- ✅ `src/config/roles.js` - Role constants and route permissions

### 2. Route Protection
- ✅ Dashboard routes wrapped with ProtectedRoute
- ✅ Transcribe page restricted to clinicians only
- ✅ Template builder restricted to clinicians only
- ✅ Profile page restricted to patients only
- ✅ Reports and Settings accessible to both roles

### 3. UI Adaptations
- ✅ Sidebar menu filtered by user role
- ✅ Overview page shows different content for clinicians vs patients
- ✅ Reports page filters data by user role
- ✅ Read-only mode for patient reports

## Test Plan

### Test 1: Clinician Login and Full Access

**Objective**: Verify that clinicians have full access to all clinical features

**Prerequisites**: 
- A clinician user account registered in AWS Cognito with `custom:user_type = "clinician"`

**Steps**:
1. Navigate to `/login`
2. Log in with clinician credentials
3. Verify redirect to `/dashboard`
4. Check sidebar menu items

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ Sidebar shows: Overview, Transcribe, Reports, Templates, Settings
- ✅ Sidebar does NOT show: My Reports, My Profile

**Dashboard Overview Verification**:
5. Verify Overview page displays:
   - Active Patients count
   - Recent Transcriptions count
   - Pending Reviews count
   - Activity chart
   - Recent notes list
   - Quick actions: New Transcription, Upload Audio, Export Report, Edit Templates

**Feature Access Verification**:
6. Navigate to `/dashboard/transcribe`
   - ✅ Page loads successfully
   - ✅ Recording and upload controls visible

7. Navigate to `/dashboard/templates`
   - ✅ Page loads successfully
   - ✅ Template builder interface visible

8. Navigate to `/dashboard/reports`
   - ✅ Page loads successfully
   - ✅ All reports visible (not filtered to specific patient)
   - ✅ "Open Transcription" button visible (not "View Report")
   - ✅ No "View Only" chip on reports
   - ✅ No "managed by clinician" message

9. Navigate to `/dashboard/settings`
   - ✅ Page loads successfully

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

### Test 2: Patient Login and Restricted Access

**Objective**: Verify that patients have restricted, view-only access

**Prerequisites**: 
- A patient user account registered in AWS Cognito with `custom:user_type = "patient"`

**Steps**:
1. Log out from clinician account
2. Navigate to `/login`
3. Log in with patient credentials
4. Verify redirect to `/dashboard`
5. Check sidebar menu items

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ Sidebar shows: Overview, My Reports, My Profile, Settings
- ✅ Sidebar does NOT show: Transcribe, Templates

**Dashboard Overview Verification**:
6. Verify Overview page displays:
   - My Reports count
   - Upcoming Appointments count
   - Last Visit date
   - Welcome message
   - Recent reports list
   - Quick actions: View My Reports, My Profile
   - ✅ NO activity chart
   - ✅ NO clinician-specific quick actions

**Feature Access Verification**:
7. Navigate to `/dashboard/reports`
   - ✅ Page loads successfully
   - ✅ Only patient's own reports visible (filtered)
   - ✅ "View Report" button visible (not "Open Transcription")
   - ✅ "View Only" chip displayed on reports
   - ✅ Info alert: "These reports are managed by your clinician..."

8. Navigate to `/dashboard/profile`
   - ✅ Page loads successfully
   - ✅ Patient profile information visible

9. Navigate to `/dashboard/settings`
   - ✅ Page loads successfully

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

### Test 3: Unauthorized Access - Patient Attempting Clinician Routes

**Objective**: Verify that patients are blocked from accessing clinician-only features

**Prerequisites**: 
- Logged in as patient user

**Steps**:
1. Attempt to navigate to `/dashboard/transcribe` (manually type URL or use browser navigation)

**Expected Results**:
- ✅ Access denied page displayed
- ✅ Error message: "Access Denied - You do not have permission to access this page. This feature is only available to clinicians."
- ✅ User is NOT redirected to login
- ✅ User remains authenticated

2. Attempt to navigate to `/dashboard/templates`

**Expected Results**:
- ✅ Access denied page displayed
- ✅ Error message: "Access Denied - You do not have permission to access this page. This feature is only available to clinicians."

3. Click on a report in the Reports page

**Expected Results**:
- ✅ Warning message displayed: "You do not have permission to edit transcriptions. Reports are managed by your clinician."
- ✅ Navigation to transcription edit is prevented

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

### Test 4: Unauthorized Access - Unauthenticated User

**Objective**: Verify that unauthenticated users are redirected to login

**Prerequisites**: 
- No user logged in (logged out state)

**Steps**:
1. Navigate to `/dashboard`

**Expected Results**:
- ✅ Redirected to `/login`
- ✅ Loading spinner shown briefly during auth check

2. Navigate to `/dashboard/transcribe`

**Expected Results**:
- ✅ Redirected to `/login`

3. Navigate to `/dashboard/reports`

**Expected Results**:
- ✅ Redirected to `/login`

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

### Test 5: Role-Based Menu Rendering

**Objective**: Verify that navigation menus adapt to user role

**Test 5a: Clinician Menu**
- Logged in as clinician
- Sidebar displays:
  - ✅ Overview (with Dashboard icon)
  - ✅ Transcribe (with Mic icon)
  - ✅ Reports (with Description icon)
  - ✅ Templates (with NoteAdd icon)
  - ✅ Settings (with Settings icon)

**Test 5b: Patient Menu**
- Logged in as patient
- Sidebar displays:
  - ✅ Overview (with Dashboard icon)
  - ✅ My Reports (with Description icon)
  - ✅ My Profile (with Person icon)
  - ✅ Settings (with Settings icon)

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

### Test 6: Session and Authentication Flow

**Objective**: Verify authentication state management

**Steps**:
1. Log in as clinician
2. Verify authentication token stored in session storage
3. Refresh the page
4. Verify user remains authenticated and role is preserved
5. Log out
6. Verify redirect to home page
7. Verify session storage cleared
8. Attempt to access `/dashboard`
9. Verify redirect to login

**Expected Results**:
- ✅ Token stored in session storage after login
- ✅ Role persists across page refreshes
- ✅ Logout clears session and redirects
- ✅ Protected routes redirect to login after logout

**Status**: ✅ PASS / ❌ FAIL / ⏸️ PENDING

---

## Test Execution Checklist

- [ ] Test 1: Clinician Login and Full Access
- [ ] Test 2: Patient Login and Restricted Access
- [ ] Test 3: Unauthorized Access - Patient Attempting Clinician Routes
- [ ] Test 4: Unauthorized Access - Unauthenticated User
- [ ] Test 5: Role-Based Menu Rendering
- [ ] Test 6: Session and Authentication Flow

## Issues Found

Document any issues discovered during testing:

| Test # | Issue Description | Severity | Status |
|--------|------------------|----------|--------|
|        |                  |          |        |

## Notes

- All tests require actual AWS Cognito user accounts with proper `custom:user_type` attributes
- Tests should be performed in a browser with DevTools open to monitor console errors
- Session storage can be inspected in DevTools > Application > Session Storage
- Network requests can be monitored in DevTools > Network tab

## Sign-off

- Tester: _______________
- Date: _______________
- Overall Status: ✅ PASS / ❌ FAIL / ⏸️ PENDING
