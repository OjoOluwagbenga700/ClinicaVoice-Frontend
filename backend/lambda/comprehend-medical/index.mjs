import { ComprehendMedicalClient, DetectEntitiesV2Command, DetectPHICommand } from '@aws-sdk/client-comprehendmedical';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const comprehendClient = new ComprehendMedicalClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  console.log('Comprehend Medical event received:', JSON.stringify(event, null, 2));
  
  try {
    // This function is triggered by S3 when transcription JSON is created
    let transcriptionId, transcript;
    
    if (event.Records && event.Records[0].s3) {
      // Triggered by S3 event
      const bucket = event.Records[0].s3.bucket.name;
      const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing transcription file: ${key} from bucket: ${bucket}`);
      
      // Extract transcription ID from filename (transcripts/transcription-{timestamp}-{id}.json)
      const fileName = key.split('/').pop();
      const matches = fileName.match(/transcription-\d+-(.+)\.json$/);
      transcriptionId = matches ? matches[1] : null;
      
      if (!transcriptionId) {
        throw new Error(`Could not extract transcription ID from filename: ${fileName}`);
      }
      
      // Download and parse the transcription JSON from S3
      const s3Client = new S3Client({});
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const s3Response = await s3Client.send(getObjectCommand);
      const transcriptionData = JSON.parse(await s3Response.Body.transformToString());
      
      // Extract transcript text from AWS Transcribe output format
      transcript = transcriptionData.results?.transcripts?.[0]?.transcript;
      
      if (!transcript) {
        throw new Error('No transcript text found in transcription file');
      }
    } else {
      // Direct invocation (for testing)
      transcriptionId = event.transcriptionId;
      transcript = event.transcript;
    }
    
    if (!transcript) {
      throw new Error('No transcript available for medical analysis');
    }
    
    console.log(`Analyzing transcript for ID: ${transcriptionId}`);
    
    // Detect medical entities
    const entitiesCommand = new DetectEntitiesV2Command({
      Text: transcript
    });
    
    const entitiesResult = await comprehendClient.send(entitiesCommand);
    
    // Detect PHI (Protected Health Information)
    const phiCommand = new DetectPHICommand({
      Text: transcript
    });
    
    const phiResult = await comprehendClient.send(phiCommand);
    
    // Process and categorize medical entities
    const medicalAnalysis = {
      entities: entitiesResult.Entities.map(entity => ({
        text: entity.Text,
        category: entity.Category,
        type: entity.Type,
        confidence: entity.Score,
        beginOffset: entity.BeginOffset,
        endOffset: entity.EndOffset
      })),
      phi: phiResult.Entities.map(phi => ({
        text: phi.Text,
        category: phi.Category,
        type: phi.Type,
        confidence: phi.Score,
        beginOffset: phi.BeginOffset,
        endOffset: phi.EndOffset
      })),
      summary: {
        totalEntities: entitiesResult.Entities.length,
        totalPHI: phiResult.Entities.length,
        categories: [...new Set(entitiesResult.Entities.map(e => e.Category))],
        analyzedAt: new Date().toISOString()
      }
    };
    
    // Update transcription record with medical analysis
    // Note: We'll need proper userId context
    const userId = 'system'; // Placeholder - needs proper implementation
    
    await docClient.send(new UpdateCommand({
      TableName: process.env.REPORTS_TABLE,
      Key: { id: transcriptionId, userId: userId },
      UpdateExpression: 'SET medicalAnalysis = :analysis, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':analysis': medicalAnalysis,
        ':status': 'completed',
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    console.log(`Medical analysis completed for transcription: ${transcriptionId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        transcriptionId,
        medicalAnalysis: medicalAnalysis.summary
      })
    };
  } catch (error) {
    console.error('Error in medical analysis:', error);
    throw error;
  }
};