import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_7fvXVi5oM",
      userPoolClientId: "16vaq7l91itotdblpngintd71n",
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
        endpoint: "https://r7le6kf535.execute-api.us-east-1.amazonaws.com",
        region: "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: "terraform-20251121023049872500000001",
      region: "us-east-1",
    },
  },
};

Amplify.configure(awsConfig);



export default awsConfig;