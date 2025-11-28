import { Amplify } from "aws-amplify";

// Real AWS Amplify Configuration
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_Kwelk23z7",
      userPoolClientId: "1n6llna74l8e28b57kpinaqtbe",
    },
  },
  API: {
    endpoints: [{
      name: "ClinicaVoiceAPI",
      endpoint: "https://f8ei30p416.execute-api.us-east-1.amazonaws.com/prod",
      region: "us-east-1",
    }],
  },
  Storage: {
    S3: {
      bucket: "clinicavoice-storage-prod-q69z3e2c",
      region: "us-east-1",
    },
  },
};


Amplify.configure(awsConfig);

console.log("✅ Real Amplify configured successfully");

export default awsConfig;