import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_23cH8bX6E",
      userPoolClientId: "7hn7q4dffj72k97der2lqe37is",
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
        endpoint: "https://lj0nce0o5e.execute-api.us-east-1.amazonaws.com",
        region: "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: "terraform-20251121155459706200000001",
      region: "us-east-1",
    },
  },
};

try {
  Amplify.configure(awsConfig);
} catch (error) {
  console.error('Amplify configuration failed:', error);
}

export default awsConfig;