/**
 * Error ID constants for error tracking and categorization
 * Used for Sentry/analytics correlation and debugging
 */
export const ErrorIds = {
  // Authentication errors
  SIGNIN_FAILED: 'auth_signin_failed',
  SIGNUP_FAILED: 'auth_signup_failed',
  GOOGLE_SIGNIN_FAILED: 'auth_google_signin_failed',
  USER_CREATION_FAILED: 'auth_user_creation_failed',
  SESSION_EXPIRED: 'auth_session_expired',

  // Database errors
  MONGODB_CONNECTION_FAILED: 'db_connection_failed',
  KEYWORDS_FETCH_FAILED: 'db_keywords_fetch_failed',
  KEYWORD_CREATION_FAILED: 'db_keyword_creation_failed',
  KEYWORD_DELETION_FAILED: 'db_keyword_deletion_failed',
  KEYWORD_UPDATE_FAILED: 'db_keyword_update_failed',

  // API errors
  API_USER_CREATION_FAILED: 'api_user_creation_failed',
  API_KEYWORD_NOT_FOUND: 'api_keyword_not_found',
  API_UNAUTHORIZED: 'api_unauthorized',
  API_VALIDATION_ERROR: 'api_validation_error',
} as const;

export type ErrorId = typeof ErrorIds[keyof typeof ErrorIds];
