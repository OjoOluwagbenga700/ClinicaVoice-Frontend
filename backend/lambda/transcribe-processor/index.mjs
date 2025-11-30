import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  console.log('S3 Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Process each S3 record
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing file: ${key} from bucket: ${bucket}`);
      
      // Extract user info from file path (audio/{userId}_{timestamp}_{filename})
      const pathParts = key.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fileParts = fileName.split('_');
      
      // Create transcription record
      const transcriptionId = randomUUID();
      const jobName = `transcription-${Date.now()}-${transcriptionId}`;
      
      // Determine media format from file extension
      const extension = key.split('.').pop().toLowerCase();
      const formatMap = {
        'webm': 'webm',
        'mp3': 'mp3',
        'mp4': 'mp4',
        'm4a': 'mp4',
        'wav': 'wav'
      };
      const mediaFormat = formatMap[extension] || 'webm';
      
      // Update existing record in reports table (created by upload function)
      // Extract userId from file path if possible, or use a default approach
      const userId = 'system'; // Will be updated when we have proper user context
      
      await docClient.send(new UpdateCommand({
        TableName: process.env.REPORTS_TABLE,
        Key: { id: transcriptionId, userId: userId },
        UpdateExpression: 'SET jobName = :jobName, #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':jobName': jobName,
          ':status': 'processing',
          ':updatedAt': new Date().toISOString()
        }
      }));
      
      // Start AWS Transcribe job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: mediaFormat,
        Media: {
          MediaFileUri: `s3://${bucket}/${key}`
        },
        OutputBucketName: bucket,
        OutputKey: `transcripts/${jobName}.json`,
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 4
        }
      });
      
      await transcribeClient.send(startCommand);
      
      console.log(`Started transcription job: ${jobName} for file: ${key}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transcription jobs started successfully' })
    };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};