import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;
  const userType = event.requestContext.authorizer.claims['custom:user_type'];
  const method = event.requestContext.http.method;
  const pathParameters = event.pathParameters || {};
  
  // Only clinicians can manage templates
  if (userType !== 'clinician') {
    return {
      statusCode: 403,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Only clinicians can manage templates' })
    };
  }
  
  try {
    // GET /templates - List all templates
    if (method === 'GET' && !pathParameters.id) {
      const command = new QueryCommand({
        TableName: process.env.TEMPLATES_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: result.Items || [] })
      };
    }
    
    // GET /templates/{id} - Get specific template
    if (method === 'GET' && pathParameters.id) {
      const command = new GetCommand({
        TableName: process.env.TEMPLATES_TABLE,
        Key: { id: pathParameters.id, userId }
      });
      
      const result = await docClient.send(command);
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
      };
    }
    
    // POST /templates - Create new template
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const template = {
        id: randomUUID(),
        userId,
        name: body.name || 'New Template',
        content: body.content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const command = new PutCommand({
        TableName: process.env.TEMPLATES_TABLE,
        Item: template
      });
      
      await docClient.send(command);
      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      };
    }
    
    // PUT /templates/{id} - Update template
    if (method === 'PUT' && pathParameters.id) {
      const body = JSON.parse(event.body);
      const command = new UpdateCommand({
        TableName: process.env.TEMPLATES_TABLE,
        Key: { id: pathParameters.id, userId },
        UpdateExpression: 'SET #name = :name, #content = :content, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#content': 'content'
        },
        ExpressionAttributeValues: {
          ':name': body.name,
          ':content': body.content,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Attributes)
      };
    }
    
    // DELETE /templates/{id} - Delete template
    if (method === 'DELETE' && pathParameters.id) {
      const command = new DeleteCommand({
        TableName: process.env.TEMPLATES_TABLE,
        Key: { id: pathParameters.id, userId }
      });
      
      await docClient.send(command);
      return {
        statusCode: 204,
        headers: { 'Access-Control-Allow-Origin': '*' }
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};