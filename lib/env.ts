/**
 * Environment variable validation and configuration
 * All environment variables must be defined or the application will fail to start
 */

const envSchema = {
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // Firebase Configuration (client-side)
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

  // OpenRouter API Key
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  // App Configuration
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const;

// Validate all required environment variables
function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(envSchema)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((key) => `  - ${key}`).join('\n')}\n\nPlease define these variables in your .env file`
    );
  }
}

// Validate on import (fail fast)
validateEnv();

// Export validated environment variables
export const env = envSchema as {
  [K in keyof typeof envSchema]: string;
};
