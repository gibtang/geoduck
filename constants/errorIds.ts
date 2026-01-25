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
  PRODUCTS_FETCH_FAILED: 'db_products_fetch_failed',
  PRODUCT_CREATION_FAILED: 'db_product_creation_failed',
  PRODUCT_DELETION_FAILED: 'db_product_deletion_failed',
  PRODUCT_UPDATE_FAILED: 'db_product_update_failed',

  // API errors
  API_USER_CREATION_FAILED: 'api_user_creation_failed',
  API_PRODUCT_NOT_FOUND: 'api_product_not_found',
  API_UNAUTHORIZED: 'api_unauthorized',
  API_VALIDATION_ERROR: 'api_validation_error',
} as const;

export type ErrorId = typeof ErrorIds[keyof typeof ErrorIds];
