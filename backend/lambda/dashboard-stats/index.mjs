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
    
    const command = new QueryCommand({
      TableName: process.env.REPORTS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    });
    
    const result = await docClient.send(command);
    const reports = result.Items || [];
    
    const activePatients = new Set(reports.map(r => r.patientId)).size;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTranscriptions = reports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;
    const pendingReviews = reports.filter(r => r.status === 'pending' || r.status === 'draft').length;
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ activePatients, recentTranscriptions, pendingReviews })
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
