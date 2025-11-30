import { post } from 'aws-amplify/api';

/**
 * Upload service for handling file uploads via presigned URLs
 */

/**
 * Get a presigned URL for file upload
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} Upload URL and metadata
 */
export async function getPresignedUploadUrl(file) {
  try {
    console.log('🔍 Requesting presigned URL for:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Import fetchAuthSession to check authentication
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    
    console.log('🔐 Auth session:', {
      isAuthenticated: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken
    });

    const restOperation = post({
      apiName: "ClinicaVoiceAPI",
      path: "/upload/presign",
      options: {
        body: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        },
        headers: {
          Authorization: `Bearer ${session.tokens.idToken.toString()}`
        }
      }
    });

    const response = await restOperation.response;

    console.log('✅ Response received:', response.status);
    const data = await response.body.json();
    console.log('✅ Presigned URL data:', { ...data, uploadUrl: '***' }); // Hide URL for security
    return data;
  } catch (error) {
    console.error('❌ Error getting presigned URL:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response,
      status: error.$metadata?.httpStatusCode
    });
    throw new Error(`Failed to get upload URL: ${error.message}`);
  }
}

/**
 * Upload file to S3 using presigned URL
 * @param {string} presignedUrl - The presigned URL
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<void>}
 */
export async function uploadFileToS3(presignedUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete upload workflow: get presigned URL and upload file
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result with file metadata
 */
export async function uploadFile(file, onProgress) {
  try {
    // Step 1: Get presigned URL
    const urlData = await getPresignedUploadUrl(file);
    
    // Step 2: Upload file to S3
    await uploadFileToS3(urlData.uploadUrl, file, onProgress);
    
    // Step 3: Return file metadata
    return {
      fileId: urlData.fileId,
      s3Key: urlData.s3Key,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  } catch (error) {
    console.error('Upload workflow failed:', error);
    throw error;
  }
}

/**
 * Check transcription status
 * @param {string} fileId - The file ID
 * @returns {Promise<Object>} Transcription status and data
 */
export async function checkTranscriptionStatus(fileId) {
  try {
    const response = await post({
      apiName: "ClinicaVoiceAPI",
      path: `/transcribe/${fileId}`,
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }).response;

    const data = await response.body.json();
    return data;
  } catch (error) {
    console.error('Error checking transcription status:', error);
    throw new Error('Failed to check transcription status');
  }
}