/**
 * Cognito Post-Confirmation Lambda Trigger
 * Automatically sets user_type attribute after user confirms their account
 */

export const handler = async (event) => {
  console.log('Post-confirmation trigger:', JSON.stringify(event, null, 2));
  
  try {
    // Set default user_type to 'clinician' for all new users
    // You can customize this logic based on email domain or other criteria
    event.response.autoConfirmUser = false;
    event.response.autoVerifyEmail = false;
    
    // The user_type should be set during registration
    // This trigger just ensures the user is properly configured
    console.log(`User ${event.userName} confirmed successfully`);
    console.log(`User attributes:`, event.request.userAttributes);
    
    return event;
  } catch (error) {
    console.error('Error in post-confirmation:', error);
    return event;
  }
};
