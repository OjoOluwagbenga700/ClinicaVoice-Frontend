import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const userType = event.requestContext.authorizer.claims['custom:user_type'];
    
    // Allow both clinicians and patients to upload
    // Clinicians upload for transcription, patients might upload for their own records
    if (!userType || (userType !== 'clinician' && userType !== 'patient')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid user type. Please contact support.' })
      };
    }
    
    const { fileName, fileType, fileSize } = JSON.parse(event.body);
    
    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/m4a'];
    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid file type. Only audio files are allowed.' })
      };
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File too large. Maximum size is 100MB.' })
      };
    }
    
    // Generate unique file key
    const timestamp = Date.now();
    const fileId = randomUUID();
    const fileExtension = fileName.split('.').pop();
    const s3Key = `audio/${userId}/${timestamp}_${fileId}.${fileExtension}`;
    
    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        userId: userId,
        originalFileName: fileName,
        uploadedAt: new Date().toISOString()
      }
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 300 // 5 minutes
    });
    
    // Create initial transcription record in reports table
    const transcriptionRecord = {
      id: fileId,
      userId: userId,
      type: 'transcription',  // Distinguish from medical reports
      fileKey: s3Key,
      originalFileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
      status: 'pending_upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.REPORTS_TABLE,
      Item: transcriptionRecord
    }));
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        fileId: fileId,
        s3Key: s3Key,
        expiresIn: 300,
        message: 'Upload URL generated successfully'
      })
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate upload URL' })
    };
  }
};