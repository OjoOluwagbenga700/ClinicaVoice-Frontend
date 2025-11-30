import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    if (userType !== 'clinician') {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only clinicians can access transcriptions' })
      };
    }
    
    const method = event.requestContext.http.method;
    const pathParameters = event.pathParameters || {};
    
    // GET /transcribe - List user's transcriptions
    if (method === 'GET' && !pathParameters.id) {
      const command = new QueryCommand({
        TableName: process.env.REPORTS_TABLE,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type AND userId = :userId',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { 
          ':type': 'transcription',
          ':userId': userId 
        },
        ScanIndexForward: false // Most recent first
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Items || [])
      };
    }
    
    // GET /transcribe/{id} - Get specific transcription
    if (method === 'GET' && pathParameters.id) {
      const command = new GetCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: pathParameters.id, userId: userId }
      });
      
      const result = await docClient.send(command);
      if (!result.Item || result.Item.type !== 'transcription') {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Transcription not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
      };
    }
    
    // POST /transcribe - Start transcription (now just returns upload URL)
    if (method === 'POST') {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Upload your file to S3. Transcription will start automatically.',
          status: 'upload_ready'
        })
      };
    }
    
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Server error' })
    };
  }
};