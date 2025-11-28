import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION || 'us-east-1' });
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
        body: JSON.stringify({ error: 'Only clinicians can transcribe audio' })
      };
    }
    
    const { fileKey } = JSON.parse(event.body);
    
    // Determine media format from file extension
    const extension = fileKey.split('.').pop().toLowerCase();
    const formatMap = {
      'webm': 'webm',
      'mp3': 'mp3',
      'mp4': 'mp4',
      'm4a': 'mp4',
      'wav': 'wav'
    };
    const mediaFormat = formatMap[extension] || 'webm';
    
    // Start transcription job
    const jobName = `transcription-${Date.now()}-${randomUUID()}`;
    const startCommand = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      MediaFormat: mediaFormat,
      Media: {
        MediaFileUri: `s3://${process.env.S3_BUCKET}/${fileKey}`
      },
      OutputBucketName: process.env.S3_BUCKET,
      OutputKey: `transcripts/${jobName}.json`
    });
    
    await transcribeClient.send(startCommand);
    
    // Poll for completion (max 5 minutes)
    let jobStatus = 'IN_PROGRESS';
    let transcript = '';
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    
    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const getCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });
      
      const response = await transcribeClient.send(getCommand);
      jobStatus = response.TranscriptionJob.TranscriptionJobStatus;
      
      if (jobStatus === 'COMPLETED') {
        const transcriptUri = response.TranscriptionJob.Transcript.TranscriptFileUri;
        const transcriptResponse = await fetch(transcriptUri);
        const transcriptData = await transcriptResponse.json();
        transcript = transcriptData.results.transcripts[0].transcript;
      } else if (jobStatus === 'FAILED') {
        throw new Error('Transcription job failed');
      }
    }
    
    if (jobStatus === 'IN_PROGRESS') {
      throw new Error('Transcription timeout');
    }
    
    // Save to DynamoDB
    const transcriptionRecord = {
      id: randomUUID(),
      userId,
      fileKey,
      transcript,
      jobName,
      createdAt: new Date().toISOString()
    };
    
    const putCommand = new PutCommand({
      TableName: process.env.TRANSCRIPTIONS_TABLE,
      Item: transcriptionRecord
    });
    
    await docClient.send(putCommand);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, id: transcriptionRecord.id })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Transcription failed' })
    };
  }
};