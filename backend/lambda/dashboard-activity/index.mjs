import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Query reports for last 30 days
    const command = new QueryCommand({
      TableName: process.env.REPORTS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    });
    
    const result = await docClient.send(command);
    const reports = result.Items || [];
    
    // Group by date
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
    
    // Convert to array format
    const activityData = Object.entries(activityMap)
      .map(([date, transcriptions]) => ({ date, transcriptions }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
