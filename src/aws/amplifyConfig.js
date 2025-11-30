import { Amplify } from "aws-amplify";
import { validateEnvironment, validateApiEndpoint, checkSecurityHeaders, sanitizeForLogging } from "../utils/security.js";

// Environment-based AWS Amplify Configuration - NO HARDCODED CREDENTIALS
const getAwsConfig = () => {
  // Get all required environment variables
  const requiredConfig = {
    userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
    identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
    s3Bucket: import.meta.env.VITE_S3_BUCKET,
    region: import.meta.env.VITE_AWS_REGION || "us-east-1"
  };

  // Validate that all required variables are present
  const missingVars = Object.entries(requiredConfig)
    .filter(([key, value]) => !value && key !== 'region') // region has a default
    .map(([key]) => `VITE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingVars.length > 0) {
    const errorMsg = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMsg);
    console.error('📝 Please check your .env file or environment configuration');
    throw new Error(errorMsg);
  }

  // Validate API endpoint format
  if (!validateApiEndpoint(requiredConfig.apiEndpoint)) {
    throw new Error("Invalid API endpoint configuration");
  }

  // Build configuration object
  const config = {
    Auth: {
      Cognito: {
        userPoolId: requiredConfig.userPoolId,
        userPoolClientId: requiredConfig.userPoolClientId,
        identityPoolId: requiredConfig.identityPoolId,
      },
    },
    API: {
      REST: {
        ClinicaVoiceAPI: {
          endpoint: requiredConfig.apiEndpoint,
          region: requiredConfig.region,
        }
      }
    },
    Storage: {
      S3: {
        bucket: requiredConfig.s3Bucket,
        region: requiredConfig.region,
      },
    },
  };

  // Check security headers in development
  if (!import.meta.env.PROD) {
    checkSecurityHeaders(requiredConfig.apiEndpoint);
  }

  return config;
};

const awsConfig = getAwsConfig();
Amplify.configure(awsConfig);

// Log configuration (sanitized for production)
const logConfig = sanitizeForLogging({
  environment: import.meta.env.MODE,
  apiEndpoint: awsConfig.API.endpoints[0].endpoint,
  region: awsConfig.API.endpoints[0].region,
  userPoolId: awsConfig.Auth.Cognito.userPoolId,
  bucket: awsConfig.Storage.S3.bucket
});

console.log("✅ Amplify configured successfully with environment-based config");
console.log("🔒 Configuration:", logConfig);

export default awsConfig;