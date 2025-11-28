# Manual Testing & Validation Guide

## Overview
This guide provides step-by-step instructions for manually testing the ClinicaVoice platform to ensure all features work correctly in real-world scenarios.

## Prerequisites
- Application running locally (`npm run dev`)
- AWS Amplify configured with Cognito
- Test accounts created:
  - Clinician account (email + password)
  - Patient account (email + password)
- Modern browser (Chrome, Firefox, Safari, or Edge)
- Microphone access available
- Sample audio files ready (mp3, wav, webm, m4a formats)

---

## Test Suite 1: Authentication & User Management

### 1.1 User Registration (Clinician)
**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Name: "Dr. Jane Smith"
   - Email: "jane.smith@clinic.com"
   - Password: (meet AWS Cognito requirements)
   - User Type: Select "Clinician"
3. Click "Register"
4. Check email for confirmation code
5. Enter confirmation code
6. Verify redirect to login page

**Expected Results:**
- ✅ Registration succeeds without errors
- ✅ Confirmation email received
- ✅ Account activated after code entry
- ✅ User type stored as "clinician"

### 1.2 User Registration (Patient)
**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Name: "John Doe"
   - Email: "john.doe@email.com"
   - Password: (meet AWS Cognito requirements)
   - User Type: Select "Patient"
3. Complete registration flow

**Expected Results:**
- ✅ Registration succeeds
- ✅ User type stored as "patient"

### 1.3 Login - Valid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter valid clinician credentials
3. Click "Login"

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirected to `/dashboard`
- ✅ Authentication token stored in session storage
- ✅ User remains logged in on page refresh

### 1.4 Login - Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter incorrect password
3. Click "Login"

**Expected Results:**
- ✅ Error message displayed
- ✅ Error message is generic (doesn't reveal if email or password is wrong)
- ✅ User remains on login page
- ✅ Form state preserved

### 1.5 Protected Route Access
**Steps:**
1. Open browser in incognito/private mode
2. Try to access `/dashboard` directly without logging in

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access dashboard without authentication

### 1.6 Logout
**Steps:**
1. Log in as any user
2. Click logout button in header
3. Try to access `/dashboard`

**Expected Results:**
- ✅ Session cleared
- ✅ Redirected to home page
- ✅ Cannot access protected routes
- ✅ Must log in again to access dashboard

---

## Test Suite 2: Role-Based Access Control (RBAC)

### 2.1 Clinician Dashboard Access
**Steps:**
1. Log in as clinician
2. Observe sidebar navigation
3. Check available menu items

**Expected Results:**
- ✅ Sidebar shows: Overview, Transcribe, Reports, Templates, Settings
- ✅ All menu items are clickable
- ✅ Dashboard shows clinician-specific statistics
- ✅ Quick action buttons visible: New Transcription, Upload Audio, Export Report, Edit Templates

### 2.2 Patient Dashboard Access
**Steps:**
1. Log in as patient
2. Observe sidebar navigation
3. Check available menu items

**Expected Results:**
- ✅ Sidebar shows: My Reports, My Profile, Settings
- ✅ "Transcribe" and "Templates" NOT visible
- ✅ Dashboard shows simplified patient view
- ✅ Only patient-relevant quick actions visible

### 2.3 Patient Access Restrictions
**Steps:**
1. Log in as patient
2. Try to access `/dashboard/transcribe` directly (type in URL)
3. Try to access `/dashboard/templates` directly

**Expected Results:**
- ✅ Access denied or redirected
- ✅ Appropriate error message displayed
- ✅ Patient cannot access clinician-only features

### 2.4 Clinician Full Access
**Steps:**
1. Log in as clinician
2. Navigate to each menu item:
   - Overview
   - Transcribe
   - Reports
   - Templates
   - Settings

**Expected Results:**
- ✅ All pages load successfully
- ✅ Full functionality available on each page
- ✅ No access restrictions

---

## Test Suite 3: Audio Recording & Transcription

### 3.1 Browser Audio Recording
**Steps:**
1. Log in as clinician
2. Navigate to Transcribe page
3. Click "Start Recording" button
4. Allow microphone access when prompted
5. Speak for 10-15 seconds
6. Click "Stop Recording"
7. Click "Transcribe"

**Expected Results:**
- ✅ Microphone permission requested
- ✅ Recording indicator shows while recording
- ✅ Audio blob created after stopping
- ✅ Transcription process starts
- ✅ Loading indicator displayed
- ✅ Transcript appears in text field
- ✅ Transcript is editable

### 3.2 Microphone Access Denied
**Steps:**
1. Navigate to Transcribe page
2. Click "Start Recording"
3. Deny microphone access

**Expected Results:**
- ✅ Error message displayed
- ✅ Message indicates microphone access was denied
- ✅ Application doesn't crash

### 3.3 Audio File Upload - Valid Format
**Steps:**
1. Navigate to Transcribe page
2. Click "Upload Audio" or file input
3. Select a valid audio file (mp3, wav, webm, or m4a)
4. Click "Transcribe"

**Expected Results:**
- ✅ File accepted
- ✅ File uploaded to S3
- ✅ Transcription initiated
- ✅ Transcript displayed when complete

### 3.4 Audio File Upload - Invalid Format
**Steps:**
1. Navigate to Transcribe page
2. Try to upload a non-audio file (e.g., .txt, .pdf, .jpg)

**Expected Results:**
- ✅ Error message displayed
- ✅ File rejected
- ✅ Supported formats listed in error message

### 3.5 Audio File Upload - Size Limit
**Steps:**
1. Navigate to Transcribe page
2. Try to upload a file larger than 100MB

**Expected Results:**
- ✅ Error message displayed
- ✅ File size limit mentioned
- ✅ File rejected

### 3.6 Transcript Editing
**Steps:**
1. Complete a transcription
2. Edit the transcript text
3. Click "Save"

**Expected Results:**
- ✅ Text field is editable
- ✅ Changes saved successfully
- ✅ Success message displayed
- ✅ Edited text persisted

### 3.7 Transcription Error Handling
**Steps:**
1. Simulate network error (disconnect internet)
2. Try to transcribe audio

**Expected Results:**
- ✅ Error message displayed
- ✅ Retry option available
- ✅ Application doesn't crash

---

## Test Suite 4: Template Management

### 4.1 Create New Template
**Steps:**
1. Log in as clinician
2. Navigate to Template Builder
3. Click "New Template" or add button
4. Enter template name: "SOAP Note"
5. Add content in rich text editor
6. Click "Save"

**Expected Results:**
- ✅ New template created
- ✅ Unique ID generated
- ✅ Template appears in template list
- ✅ Template saved to backend

### 4.2 Edit Template Name
**Steps:**
1. Select a template
2. Edit the template name
3. Save changes

**Expected Results:**
- ✅ Name updated in template list
- ✅ Changes persisted

### 4.3 Edit Template Content
**Steps:**
1. Select a template
2. Edit content using rich text editor:
   - Add bold text
   - Add line breaks
   - Add bullet points
3. Save template

**Expected Results:**
- ✅ Rich text formatting preserved
- ✅ Line breaks maintained
- ✅ Content saved correctly

### 4.4 Insert Placeholders
**Steps:**
1. Select a template
2. Click placeholder buttons:
   - {{PatientName}}
   - {{Date}}
   - {{Diagnosis}}
   - {{Medications}}
3. Verify placeholders inserted at cursor position

**Expected Results:**
- ✅ Placeholders inserted in correct format
- ✅ Placeholders visible in editor
- ✅ Multiple placeholders can be added

### 4.5 Template Preview
**Steps:**
1. Create template with placeholders
2. Switch to preview mode
3. Observe placeholder replacement

**Expected Results:**
- ✅ Placeholders replaced with sample data
- ✅ Preview updates in real-time
- ✅ Formatting preserved in preview
- ✅ Line breaks converted to HTML breaks

### 4.6 Delete Template
**Steps:**
1. Select a template
2. Click "Delete" button
3. Confirm deletion

**Expected Results:**
- ✅ Template removed from list
- ✅ UI switches to first available template
- ✅ Deletion persisted to backend

### 4.7 Switch Between Templates
**Steps:**
1. Create multiple templates
2. Click on different templates in the list

**Expected Results:**
- ✅ Template content loads correctly
- ✅ All placeholders displayed
- ✅ No data loss when switching

---

## Test Suite 5: Reports Management

### 5.1 View All Reports (Clinician)
**Steps:**
1. Log in as clinician
2. Navigate to Reports page
3. Observe report list

**Expected Results:**
- ✅ All clinician's reports displayed
- ✅ Each report shows: patient name, date, summary
- ✅ Reports displayed in card grid
- ✅ Loading indicator shown while fetching

### 5.2 View Reports (Patient)
**Steps:**
1. Log in as patient
2. Navigate to My Reports
3. Observe report list

**Expected Results:**
- ✅ Only patient's own reports displayed
- ✅ Cannot see other patients' reports
- ✅ Reports in read-only mode

### 5.3 Search Reports
**Steps:**
1. Navigate to Reports page
2. Enter search term in search field (e.g., patient name)
3. Observe filtered results

**Expected Results:**
- ✅ Reports filtered by search term
- ✅ Search works for patient name
- ✅ Search works for summary text
- ✅ Results update in real-time

### 5.4 Empty Search Results
**Steps:**
1. Navigate to Reports page
2. Enter search term with no matches

**Expected Results:**
- ✅ "No reports found" message displayed
- ✅ No reports shown
- ✅ Clear search to see all reports again

### 5.5 Open Report
**Steps:**
1. Navigate to Reports page
2. Click on a report card

**Expected Results:**
- ✅ Navigated to transcription page
- ✅ Report ID in URL parameter
- ✅ Report data loaded
- ✅ Transcript displayed

### 5.6 Patient Read-Only Access
**Steps:**
1. Log in as patient
2. Open a report
3. Try to edit the report

**Expected Results:**
- ✅ Report displayed in read-only mode
- ✅ Edit controls disabled or hidden
- ✅ Message: "Reports are managed by clinicians"
- ✅ Cannot modify report content

---

## Test Suite 6: Dashboard Overview

### 6.1 Clinician Dashboard Statistics
**Steps:**
1. Log in as clinician
2. Navigate to Overview page
3. Observe statistics cards

**Expected Results:**
- ✅ Active Patients count displayed
- ✅ Recent Transcriptions count displayed
- ✅ Pending Reviews count displayed
- ✅ Statistics load from backend

### 6.2 Activity Chart
**Steps:**
1. On Overview page, observe activity chart
2. Check data for last 30 days

**Expected Results:**
- ✅ Chart displays transcription trends
- ✅ X-axis shows dates
- ✅ Y-axis shows transcription counts
- ✅ Data loads from backend

### 6.3 Recent Notes
**Steps:**
1. On Overview page, scroll to recent notes section
2. Observe recent transcriptions

**Expected Results:**
- ✅ Most recent transcriptions displayed
- ✅ Status indicators shown (draft, reviewed, finalized)
- ✅ Patient names visible
- ✅ Dates displayed

### 6.4 Quick Actions
**Steps:**
1. On Overview page, test each quick action button:
   - New Transcription
   - Upload Audio
   - Export Report
   - Edit Templates

**Expected Results:**
- ✅ New Transcription → navigates to Transcribe page
- ✅ Upload Audio → opens modal with file upload
- ✅ Export Report → generates and downloads CSV
- ✅ Edit Templates → navigates to Template Builder

### 6.5 Patient Dashboard
**Steps:**
1. Log in as patient
2. Navigate to Overview

**Expected Results:**
- ✅ Simplified view displayed
- ✅ Patient-specific information shown
- ✅ No clinician statistics
- ✅ Recent reports visible

---

## Test Suite 7: CSV Export

### 7.1 Export Single Report
**Steps:**
1. Navigate to Overview page
2. Click "Export Report" button
3. Check downloaded file

**Expected Results:**
- ✅ CSV file downloaded
- ✅ File contains: patient name, date, summary
- ✅ File opens correctly in spreadsheet software
- ✅ Data formatted properly

### 7.2 Export Multiple Reports
**Steps:**
1. Generate multiple transcriptions
2. Export reports
3. Verify all data included

**Expected Results:**
- ✅ All reports included in export
- ✅ Data complete and accurate
- ✅ No data corruption

---

## Test Suite 8: Internationalization (i18n)

### 8.1 Language Switching
**Steps:**
1. Log in to application
2. Click language switcher in header
3. Select French
4. Navigate through different pages

**Expected Results:**
- ✅ All interface text updates to French
- ✅ Navigation labels translated
- ✅ Button text translated
- ✅ Error messages translated

### 8.2 State Preservation
**Steps:**
1. Fill out a form partially
2. Switch language
3. Check form state

**Expected Results:**
- ✅ Form data preserved
- ✅ User remains on same page
- ✅ No data loss

### 8.3 Default Language
**Steps:**
1. Open application in new browser
2. Check default language

**Expected Results:**
- ✅ Defaults to English
- ✅ All text displays correctly

---

## Test Suite 9: Responsive Design

### 9.1 Mobile View (< 768px)
**Steps:**
1. Resize browser to mobile width (e.g., 375px)
2. Navigate through all pages

**Expected Results:**
- ✅ Mobile layout activated
- ✅ Components stacked vertically
- ✅ Sidebar collapses or becomes hamburger menu
- ✅ Forms are touch-friendly
- ✅ All features accessible

### 9.2 Tablet View (768px - 1024px)
**Steps:**
1. Resize browser to tablet width (e.g., 768px)
2. Navigate through all pages

**Expected Results:**
- ✅ Tablet layout activated
- ✅ Grid adjusts column count
- ✅ Sidebar visible
- ✅ All features accessible

### 9.3 Desktop View (> 1024px)
**Steps:**
1. View on desktop resolution (e.g., 1920px)
2. Navigate through all pages

**Expected Results:**
- ✅ Desktop layout displayed
- ✅ Side-by-side components
- ✅ Full sidebar visible
- ✅ Optimal use of screen space

### 9.4 Device Rotation
**Steps:**
1. Test on actual mobile device or emulator
2. Rotate device between portrait and landscape

**Expected Results:**
- ✅ Layout adjusts to new orientation
- ✅ No content cut off
- ✅ All features remain accessible

---

## Test Suite 10: Session Management

### 10.1 Session Persistence
**Steps:**
1. Log in
2. Refresh page
3. Check authentication state

**Expected Results:**
- ✅ User remains logged in
- ✅ No redirect to login
- ✅ Session data intact

### 10.2 Session Expiration
**Steps:**
1. Log in
2. Wait for session to expire (or manually clear token)
3. Try to access protected resource

**Expected Results:**
- ✅ Redirected to login page
- ✅ Must re-authenticate
- ✅ Appropriate message displayed

### 10.3 Multiple Tabs
**Steps:**
1. Log in in one tab
2. Open application in another tab
3. Log out in first tab
4. Try to use second tab

**Expected Results:**
- ✅ Session cleared across all tabs
- ✅ Second tab requires re-authentication

---

## Test Suite 11: Error Handling

### 11.1 Network Errors
**Steps:**
1. Disconnect internet
2. Try various operations:
   - Login
   - Transcription
   - Save template
   - Load reports

**Expected Results:**
- ✅ Appropriate error messages displayed
- ✅ Application doesn't crash
- ✅ Retry options available
- ✅ User data preserved

### 11.2 API Errors
**Steps:**
1. Simulate API errors (if possible)
2. Observe error handling

**Expected Results:**
- ✅ Error messages displayed
- ✅ User-friendly messages (not technical jargon)
- ✅ Application remains functional

### 11.3 Form Validation Errors
**Steps:**
1. Submit forms with invalid data:
   - Empty required fields
   - Invalid email format
   - Weak password
2. Observe validation

**Expected Results:**
- ✅ Validation errors displayed
- ✅ Specific field errors highlighted
- ✅ Form submission prevented
- ✅ User can correct and resubmit

---

## Test Suite 12: Performance & Loading States

### 12.1 Loading Indicators
**Steps:**
1. Perform operations that fetch data:
   - Dashboard statistics
   - Reports list
   - Transcription
2. Observe loading states

**Expected Results:**
- ✅ Loading indicators displayed
- ✅ User knows operation is in progress
- ✅ UI doesn't freeze

### 12.2 Large Data Sets
**Steps:**
1. Create many reports (20+)
2. Load reports page
3. Search through reports

**Expected Results:**
- ✅ Page loads without significant delay
- ✅ Search remains responsive
- ✅ No performance degradation

---

## Test Checklist Summary

Use this checklist to track your testing progress:

### Authentication
- [ ] Clinician registration
- [ ] Patient registration
- [ ] Valid login
- [ ] Invalid login
- [ ] Protected routes
- [ ] Logout

### RBAC
- [ ] Clinician dashboard access
- [ ] Patient dashboard access
- [ ] Patient access restrictions
- [ ] Clinician full access

### Transcription
- [ ] Browser recording
- [ ] Microphone denied
- [ ] File upload (valid)
- [ ] File upload (invalid)
- [ ] File size limit
- [ ] Transcript editing
- [ ] Error handling

### Templates
- [ ] Create template
- [ ] Edit name
- [ ] Edit content
- [ ] Insert placeholders
- [ ] Preview
- [ ] Delete template
- [ ] Switch templates

### Reports
- [ ] View all (clinician)
- [ ] View own (patient)
- [ ] Search reports
- [ ] Empty search
- [ ] Open report
- [ ] Read-only (patient)

### Dashboard
- [ ] Statistics display
- [ ] Activity chart
- [ ] Recent notes
- [ ] Quick actions
- [ ] Patient dashboard

### Other Features
- [ ] CSV export
- [ ] Language switching
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] Desktop responsive
- [ ] Session management
- [ ] Error handling
- [ ] Loading states

---

## Reporting Issues

When you find issues during testing, document them with:

1. **Issue Title**: Brief description
2. **Steps to Reproduce**: Exact steps taken
3. **Expected Result**: What should happen
4. **Actual Result**: What actually happened
5. **Screenshots**: If applicable
6. **Browser/Device**: Testing envir