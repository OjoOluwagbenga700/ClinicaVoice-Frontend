import { Amplify } from "aws-amplify";

// Validate required environment variables
const requiredEnvVars = ['REACT_APP_USER_POOL_ID', 'REACT_APP_USER_POOL_CLIENT_ID', 'REACT_APP_API_ENDPOINT', 'REACT_APP_S3_BUCKET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// AWS Amplify Configuration with Environment Variables

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      signUpVerificationMethod: "code",
      loginWith: { 
        email: true 
      },
    },
  },
  API: {
    endpoints: [
      {
        name: "ClinicaVoiceAPI",
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION || "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: process.env.REACT_APP_S3_BUCKET,
      region: process.env.REACT_APP_AWS_REGION || "us-east-1",
    },
  },
};

try {
  Amplify.configure(awsConfig);
} catch (error) {
  console.error('Failed to configure Amplify:', error);
  throw error;
}

if (process.env.NODE_ENV === 'development') {
  console.log('Amplify configured successfully');
}

export default awsConfig;