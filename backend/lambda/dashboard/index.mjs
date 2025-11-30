import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Unified Dashboard Lambda Function
 * Handles all dashboard endpoints: /stats, /activity, /recent-notes
 */
export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    // Authorization check
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Extract endpoint from path
    const path = event.requestContext.http.path;
    const endpoint = path.split('/').pop(); // Gets 'stats', 'activity', or 'recent-notes'
    
    console.log(`Dashboard endpoint: ${endpoint} for user: ${userId}`);
    
    // Route to appropriate handler
    switch (endpoint) {
      case 'stats':
        return await handleStats(userId);
      case 'activity':
        return await handleActivity(userId);
      case 'recent-notes':
        return await handleRecentNotes(userId);
      default:
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid dashboard endpoint' })
        };
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Handle /dashboard/stats endpoint
 * Returns: activePatients, recentTranscriptions, pendingReviews
 */
async function handleStats(userId) {
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Calculate statistics
  const activePatients = new Set(reports.map(r => r.patientId)).size;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTranscriptions = reports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;
  
  const pendingReviews = reports.filter(r => r.status === 'pending' || r.status === 'draft').length;
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      activePatients, 
      recentTranscriptions, 
      pendingReviews 
    })
  };
}

/**
 * Handle /dashboard/activity endpoint
 * Returns: Array of {date, transcriptions} for last 30 days
 */
async function handleActivity(userId) {
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Group by date for last 30 days
  const activityMap = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  reports.forEach(report => {
    const date = new Date(report.createdAt);
    if (date >= thirtyDaysAgo) {
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
  });
  
  // Convert to array format and sort by date
  const activityData = Object.entries(activityMap)
    .map(([date, transcriptions]) => ({ date, transcriptions }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData)
  };
}

/**
 * Handle /dashboard/recent-notes endpoint
 * Returns: Array of recent reports (last 10)
 */
async function handleRecentNotes(userId) {
  const command = new QueryCommand({
    TableName: process.env.REPORTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    Limit: 10,
    ScanIndexForward: false // Most recent first
  });
  
  const result = await docClient.send(command);
  const reports = result.Items || [];
  
  // Format for frontend
  const recentNotes = reports.map(report => ({
    id: report.id,
    patient: report.patientName || 'Unknown Patient',
    status: report.status || 'draft',
    date: report.createdAt
  }));
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(recentNotes)
  };
}