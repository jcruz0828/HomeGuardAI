// Environment variable types for TypeScript
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_SPRING_API_BASE_URL: string;
    EXPO_PUBLIC_ENVIRONMENT: string;
    EXPO_PUBLIC_STREAM_SECRET_KEY?: string;
    EXPO_PUBLIC_STREAM_BASE_URL?: string;
  }
}
