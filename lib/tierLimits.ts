import { IUser } from '@/models/User';
import { TIER_CONFIGS } from './tierConfig';

export interface RateLimitCheck {
  allowed: boolean;
  retryAfter?: Date;
}

/**
 * Check if user can execute a prompt based on their tier's rate limit
 */
export function canExecute(user: IUser): RateLimitCheck {
  const config = TIER_CONFIGS[user.tier];

  // Admins bypass rate limiting
  if (config.cooldownMs === 0) {
    return { allowed: true };
  }

  // If user has never executed, allow it
  if (!user.lastExecutionAt) {
    return { allowed: true };
  }

  const now = new Date();
  const timeSinceLastExecution = now.getTime() - user.lastExecutionAt.getTime();

  if (timeSinceLastExecution < config.cooldownMs) {
    const nextAllowedTime = new Date(
      user.lastExecutionAt.getTime() + config.cooldownMs
    );
    return {
      allowed: false,
      retryAfter: nextAllowedTime,
    };
  }

  return { allowed: true };
}

/**
 * Get the retention cutoff date for a user's results
 */
export function getRetentionCutoff(user: IUser): Date {
  const config = TIER_CONFIGS[user.tier];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.retentionDays);
  return cutoff;
}

/**
 * Format a retry-after date as a human-readable string
 */
export function formatRetryAfter(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / (1000 * 60));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}
