/**
 * Security utilities for production environment
 */

/**
 * Validate that all required environment variables are present
 */
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_AWS_USER_POOL_ID',
    'VITE_AWS_USER_POOL_CLIENT_ID',
    'VITE_AWS_IDENTITY_POOL_ID',
    'VITE_API_ENDPOINT',
    'VITE_S3_BUCKET'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    return false;
  }

  return true;
};

/**
 * Check if running in production mode
 */
export const isProduction = () => {
  return import.meta.env.PROD;
};

/**
 * Sanitize sensitive data from logs in production
 */
export const sanitizeForLogging = (data) => {
  if (!isProduction()) {
    return data; // Allow full logging in development
  }

  // In production, remove sensitive fields
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  return data;
};

/**
 * Validate API endpoint format
 */
export const validateApiEndpoint = (endpoint) => {
  if (!endpoint) return false;
  
  // Must be HTTPS in production
  if (isProduction() && !endpoint.startsWith('https://')) {
    console.error('❌ API endpoint must use HTTPS in production');
    return false;
  }
  
  // Must be a valid URL
  try {
    new URL(endpoint);
    return true;
  } catch {
    console.error('❌ Invalid API endpoint URL format');
    return false;
  }
};

/**
 * Security headers check (for development)
 */
export const checkSecurityHeaders = async (apiEndpoint) => {
  if (isProduction()) return; // Skip in production
  
  try {
    const response = await fetch(apiEndpoint, { method: 'OPTIONS' });
    const headers = response.headers;
    
    const securityHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    securityHeaders.forEach(header => {
      if (!headers.has(header)) {
        console.warn(`⚠️ Missing security header: ${header}`);
      }
    });
  } catch (error) {
    console.warn('⚠️ Could not check security headers:', error.message);
  }
};