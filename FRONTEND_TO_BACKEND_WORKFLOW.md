# Frontend to Backend Workflow - ClinicaVoice

## 🎯 Complete Data Flow Explanation

### Architecture Overview

```
User Browser
    ↓
React Frontend (Amplify Hosted)
    ↓
AWS Amplify SDK
    ↓
┌─────────────────────────────────────┐
│  AWS Cognito (Authentication)       │
│  API Gateway (REST API)             │
│  S3 (File Storage)                  │
└─────────────────────────────────────┘
    ↓
Lambda Functions
    ↓
DynamoDB Tables
```

---

## 📋 Detailed Workflows

### 1. User Authentication Flow

**Step-by-Step:**

```
1. User enters email/password in Login.jsx
   ↓
2. Frontend calls: signIn({ username, password })
   ↓
3. AWS Amplify SDK → AWS Cognito
   ↓
4. Cognito validates credentials
   ↓
5. Returns JWT token + user attributes (including custom:user_type)
   ↓
6. Frontend stores token in session storage
   ↓
7. Token included in all subsequent API requests
```

**Code Flow:**

```javascript
// Frontend: src/pages/Login.jsx
const handleLogin = async () => {
  const result = await signIn({ 
    username: email, 
    password 
  });
  // Token automatically stored by Amplify
  navigate('/dashboard');
};

// Token automatically included in API calls
// via Amplify SDK
```

---

### 2. Dashboard Statistics Flow

**Step-by-Step:**

```
1. User opens Dashboard (Overview.jsx)
   ↓
2. Component calls: fetchDashboardStats()
   ↓
3. src/services/api.js → apiGet('/dashboard/stats')
   ↓
4. Amplify SDK adds Authorization header with JWT token
   ↓
5. Request sent to: API Gateway
   URL: https://r7le6kf535.execute-api.us-east-1.amazonaws.com/dashboard/stats
   ↓
6. API Gateway validates JWT with Cognito
   ↓
7. API Gateway extracts user info from token:
   - userId (sub claim)
   - userType (custom:user_type claim)
   ↓
8. API Gateway invokes: dashboard-stats Lambda
   ↓
9. Lambda receives event with:
   - event.requestContext.authorizer.claims.sub (userId)
   - event.requestContext.authorizer.claims['custom:user_type']
   ↓
10. Lambda queries DynamoDB:
    - Table: clinicavoice-reports
    - Index: UserIdIndex
    - Filter: userId = current user
   ↓
11. Lambda calculates statistics:
    - Active patients (unique patientIds)
    - Recent transcriptions (last 30 days)
    - Pending reviews (status = 'pending' or 'draft')
   ↓
12. Lambda returns JSON response
   ↓
13. API Gateway forwards response to frontend
   ↓
14. Frontend displays statistics in dashboard
```

**Code Flow:**

```javascript
// Frontend: src/pages/dashboard/Overview.jsx
useEffect(() => {
  const loadData = async () => {
    const stats = await fetchDashboardStats();
    setStats(stats); // { activePatients, recentTranscriptions, pendingReviews }
  };
  loadData();
}, []);

// API Service: src/services/api.js
export async function fetchDashboardStats() {
  return await apiGet('/dashboard/stats');
}

export async function apiGet(path) {
  const headers = await getAuthHeaders(); // Gets JWT token
  const restOperation = get({
    apiName: 'ClinicaVoiceAPI',
    path,
    options: { headers }
  });
  const response = await restOperation.response;
  return await response.body.json();
}

// Backend: backend/lambda/dashboard-stats/index.mjs
export const handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;
  const userType = event.requestContext.authorizer.claims['custom:user_type'];
  
  // Query DynamoDB
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Calculate stats
  const activePatients = new Set(reports.map(r => r.patientId)).size;
  // ... more calculations
  
  return {
    statusCode: 200,
    body: JSON.stringify({ activePatients, recentTranscriptions, pendingReviews })
  };
};
```

---

### 3. Create Template Flow

**Step-by-Step:**

```
1. User clicks "New Template" in TemplateBuilder.jsx
   ↓
2. Frontend calls: apiPost('/templates', { name, content })
   ↓
3. Amplify SDK adds Authorization header
   ↓
4. Request sent to API Gateway: POST /templates
   Body: { name: "SOAP Note", content: "..." }
   ↓
5. API Gateway validates JWT
   ↓
6. API Gateway invokes: templates Lambda
   ↓
7. Lambda receives:
   - event.httpMethod = 'POST'
   - event.body = '{"name":"SOAP Note","content":"..."}'
   - event.requestContext.authorizer.claims.sub = userId
   ↓
8. Lambda checks user type (must be clinician)
   ↓
9. Lambda creates new template:
   - Generates UUID for id
   - Adds userId, timestamps
   ↓
10. Lambda saves to DynamoDB:
    Table: clinicavoice-templates
    Item: { id, userId, name, content, createdAt, updatedAt }
   ↓
11. Lambda returns new template object
   ↓
12. Frontend receives template with id
   ↓
13. Frontend adds template to local state
   ↓
14. UI updates to show new template
```

**Code Flow:**

```javascript
// Frontend: src/pages/dashboard/TemplateBuilder.jsx
const handleCreateTemplate = async () => {
  const newTemplate = await apiPost('/templates', {
    name: "New Template",
    content: ""
  });
  setTemplates([...templates, newTemplate]);
  setSelectedTemplate(newTemplate.id);
};

// Backend: backend/lambda/templates/index.mjs
export const handler = async (event) => {
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body);
    const newTemplate = {
      id: randomUUID(),
      userId: event.requestContext.authorizer.claims.sub,
      name: body.name,
      content: body.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.TEMPLATES_TABLE,
      Item: newTemplate
    }));
    
    return {
      statusCode: 201,
      body: JSON.stringify(newTemplate)
    };
  }
};
```

---

### 4. Audio Transcription Flow

**Step-by-Step:**

```
1. User records/uploads audio in Transcribe.jsx
   ↓
2. Frontend uploads file DIRECTLY to S3:
   uploadData({ key: 'audio/123_recording.webm', data: audioFile })
   ↓
3. S3 stores file at: s3://bucket/audio/123_recording.webm
   ↓
4. Frontend calls: POST /transcribe
   Body: { fileKey: 'audio/123_recording.webm' }
   ↓
5. API Gateway validates JWT
   ↓
6. API Gateway invokes: transcribe Lambda
   ↓
7. Lambda receives fileKey
   ↓
8. Lambda starts AWS Transcribe job:
   - JobName: transcription-123456
   - MediaFileUri: s3://bucket/audio/123_recording.webm
   - LanguageCode: en-US
   ↓
9. Lambda polls AWS Transcribe every 2 seconds
   ↓
10. AWS Transcribe processes audio:
    - Converts speech to text
    - Generates transcript JSON
    - Saves to S3
   ↓
11. Lambda fetches transcript from S3
   ↓
12. Lambda saves to DynamoDB:
    Table: clinicavoice-transcriptions
    Item: { id, userId, fileKey, transcript, jobName, status }
   ↓
13. Lambda returns transcript text
   ↓
14. Frontend displays transcript in text field
   ↓
15. User can edit and save transcript
```

**Code Flow:**

```javascript
// Frontend: src/pages/dashboard/Transcribe.jsx
const handleTranscription = async () => {
  // Step 1: Upload to S3
  const uploadResult = await uploadData({
    key: `audio/${Date.now()}_${audioFile.name}`,
    data: audioFile,
    options: { contentType: audioFile.type }
  }).result;
  
  // Step 2: Trigger transcription
  const response = await post({
    apiName: "ClinicaVoiceAPI",
    path: "/transcribe",
    options: { body: { fileKey: uploadResult.key } }
  }).response;
  
  const data = await response.body.json();
  setTranscript(data.transcript);
};

// Backend: backend/lambda/transcribe/index.mjs
export const handler = async (event) => {
  const { fileKey } = JSON.parse(event.body);
  
  // Start transcription
  const jobName = `transcription-${Date.now()}`;
  await transcribeClient.send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    MediaFileUri: `s3://${process.env.S3_BUCKET}/${fileKey}`,
    LanguageCode: 'en-US'
  }));
  
  // Poll for completion
  let transcript = '';
  while (jobStatus === 'IN_PROGRESS') {
    await sleep(2000);
    const job = await transcribeClient.send(new GetTranscriptionJobCommand({
      TranscriptionJobName: jobName
    }));
    jobStatus = job.TranscriptionJob.TranscriptionJobStatus;
    
    if (jobStatus === 'COMPLETED') {
      const transcriptUri = job.TranscriptionJob.Transcript.TranscriptFileUri;
      const response = await fetch(transcriptUri);
      const data = await response.json();
      transcript = data.results.transcripts[0].transcript;
    }
  }
  
  // Save to DynamoDB
  await docClient.send(new PutCommand({
    TableName: process.env.TRANSCRIPTIONS_TABLE,
    Item: { id: randomUUID(), userId, fileKey, transcript }
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ transcript })
  };
};
```

---

### 5. Reports CRUD Flow

#### **List Reports (GET /reports)**

```
1. User opens Reports page
   ↓
2. Frontend: fetchReports()
   ↓
3. API: GET /reports
   ↓
4. Lambda checks userType:
   - If clinician: Query by userId (all their reports)
   - If patient: Query by patientId (only their reports)
   ↓
5. Lambda queries DynamoDB
   ↓
6. Returns array of reports
   ↓
7. Frontend displays in card grid
```

#### **Create Report (POST /reports)**

```
1. User creates transcription
   ↓
2. Frontend: apiPost('/reports', { patientId, patientName, summary, content })
   ↓
3. Lambda validates: userType === 'clinician'
   ↓
4. Lambda creates report with UUID
   ↓
5. Lambda saves to DynamoDB
   ↓
6. Returns new report
   ↓
7. Frontend adds to reports list
```

#### **Update Report (PUT /reports/{id})**

```
1. User edits report
   ↓
2. Frontend: apiPut('/reports/123', { summary, content, status })
   ↓
3. Lambda validates: userType === 'clinician'
   ↓
4. Lambda updates DynamoDB
   ↓
5. Returns updated report
   ↓
6. Frontend updates local state
```

#### **Delete Report (DELETE /reports/{id})**

```
1. User clicks delete
   ↓
2. Frontend: apiDelete('/reports/123')
   ↓
3. Lambda validates: userType === 'clinician'
   ↓
4. Lambda deletes from DynamoDB
   ↓
5. Returns 204 No Content
   ↓
6. Frontend removes from list
```

---

## 🔐 Security Flow

### JWT Token in Every Request

```
1. User logs in → Receives JWT token
   ↓
2. Token contains:
   - sub: userId (e.g., "abc-123-def")
   - custom:user_type: "clinician" or "patient"
   - email: user's email
   - exp: expiration timestamp
   ↓
3. Every API request includes:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
4. API Gateway validates token with Cognito
   ↓
5. If valid: Extracts claims and passes to Lambda
   If invalid: Returns 401 Unauthorized
   ↓
6. Lambda uses claims for authorization:
   - Check userType for role-based access
   - Use userId to filter data
```

### Role-Based Access Control

```javascript
// In every Lambda function:
const userId = event.requestContext.authorizer.claims.sub;
const userType = event.requestContext.authorizer.claims['custom:user_type'];

// Clinician-only endpoints
if (userType !== 'clinician') {
  return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
}

// Data filtering by role
if (userType === 'patient') {
  // Query only patient's own data
  query.KeyConditionExpression = 'patientId = :userId';
} else {
  // Query all clinician's data
  query.KeyConditionExpression = 'userId = :userId';
}
```

---

## 📊 Data Flow Summary

### Request Path:
```
Frontend Component
  → API Service (src/services/api.js)
    → AWS Amplify SDK
      → API Gateway
        → Lambda Function
          → DynamoDB / S3 / Transcribe
            → Lambda Function
              → API Gateway
                → AWS Amplify SDK
                  → API Service
                    → Frontend Component
```

### Key Points:

1. **Authentication**: Handled by AWS Cognito, token in every request
2. **Authorization**: Lambda checks userType from JWT claims
3. **File Upload**: Direct to S3 (no Lambda needed)
4. **API Calls**: Through API Gateway → Lambda → DynamoDB
5. **Data Filtering**: Based on userId and userType
6. **Error Handling**: At every layer with proper status codes

---

## 🎯 Example: Complete User Journey

### Clinician Creates a Report

```
1. Clinician logs in
   → Cognito validates → Returns JWT with userType="clinician"

2. Opens Dashboard
   → GET /dashboard/stats
   → Lambda queries reports for this clinician
   → Returns statistics

3. Records audio
   → Browser MediaRecorder captures audio
   → Creates audio blob

4. Uploads audio
   → Direct upload to S3 via Amplify Storage
   → File stored at s3://bucket/audio/123.webm

5. Transcribes audio
   → POST /transcribe with fileKey
   → Lambda starts AWS Transcribe job
   → Polls until complete
   → Returns transcript text

6. Edits transcript
   → User modifies text in UI
   → Local state updated

7. Saves as report
   → POST /reports with { patientId, patientName, summary, content }
   → Lambda creates report in DynamoDB
   → Returns report with id

8. Views reports
   → GET /reports
   → Lambda queries all clinician's reports
   → Returns array
   → Frontend displays in grid
```

---

## 💡 Key Takeaways

1. **Frontend never talks directly to DynamoDB** - Always through Lambda
2. **Authentication is automatic** - Amplify SDK handles tokens
3. **Authorization in Lambda** - Check userType for every request
4. **File uploads bypass Lambda** - Direct to S3 for efficiency
5. **API Gateway is the gatekeeper** - Validates all requests
6. **Lambda is stateless** - Each request is independent
7. **DynamoDB is the source of truth** - All data persisted here

This architecture ensures security, scalability, and separation of concerns!
