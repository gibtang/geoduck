/**
 * Environment variable validation and configuration
 * All environment variables must be defined or the application will fail to start
 */

// Server-side environment variables (only available on the server)
const serverEnvSchema = {
  MONGODB_URI: process.env.MONGODB_URI,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
} as const;

// Client-side environment variables (available on both server and client)
const clientEnvSchema = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const;

// Validate client-side environment variables
function validateClientEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(clientEnvSchema)) {
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

// Validate client-side env vars on import (fail fast)
validateClientEnv();

// Export client-side environment variables (safe to use in both server and client components)
export const env = clientEnvSchema as {
  [K in keyof typeof clientEnvSchema]: string;
};

// Export server-side environment variables (only use in API routes and server components)
export const serverEnv = serverEnvSchema as {
  [K in keyof typeof serverEnvSchema]: string;
};
