// Environment variables - these will be read from .env file by Expo
const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EXPO_PUBLIC_SPRING_API_BASE_URL = process.env.EXPO_PUBLIC_SPRING_API_BASE_URL || 'http://localhost:8080/api/v1';
const EXPO_PUBLIC_ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
const EXPO_PUBLIC_STREAM_SECRET_KEY = process.env.EXPO_PUBLIC_STREAM_SECRET_KEY || 'YOUR_SECRET_KEY';
const EXPO_PUBLIC_STREAM_BASE_URL = process.env.EXPO_PUBLIC_STREAM_BASE_URL || 'http://172.20.10.2:8000';

// Validate required environment variables
if (!EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required in .env file');
}
if (!EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required in .env file');
}
if (!EXPO_PUBLIC_SPRING_API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_SPRING_API_BASE_URL is required in .env file');
}
if (!EXPO_PUBLIC_ENVIRONMENT) {
  throw new Error('EXPO_PUBLIC_ENVIRONMENT is required in .env file');
}

// API Configuration
export const API_CONFIG = {
  // Spring Boot Backend
  SPRING_API_BASE_URL: EXPO_PUBLIC_SPRING_API_BASE_URL,
  
  // Supabase Configuration
  SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY,
  
  // API Endpoints
  ENDPOINTS: {
    USERS: '/users',
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    HOMES: '/homes',
    DEVICES: '/devices',
    ACCESS_LOGS: '/access-logs',
    ACCESS_PERMISSIONS: '/access-permissions',
    FACE_PROFILES: '/face-profiles',
    RFID_CARDS: '/rfid-cards',
    APP_SETTINGS: '/app-settings',
    SECURITY_SETTINGS: '/security-settings',
    HOME_INVITATIONS: '/home-invitations',
    PERSONS: '/persons',
  },
  
  // Stream Configuration
  STREAM_BASE_URL: EXPO_PUBLIC_STREAM_BASE_URL,
  STREAM_SECRET_KEY: EXPO_PUBLIC_STREAM_SECRET_KEY,
  
  // Request timeouts
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment-specific configurations
export const getApiConfig = () => {
  const isDevelopment = EXPO_PUBLIC_ENVIRONMENT === 'development';
  
  return {
    ...API_CONFIG,
    SPRING_API_BASE_URL: isDevelopment 
      ? EXPO_PUBLIC_SPRING_API_BASE_URL
      : 'https://your-production-api.com/api', // Update with your production API URL
  };
};
