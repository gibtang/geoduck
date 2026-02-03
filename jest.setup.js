// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/geoduck-test'
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'G-XXXXXXXXXX'

// Only set test API key if real key not already loaded (for integration tests)
if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
}

process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
