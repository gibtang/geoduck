import { UserTier } from '@/models/User';

export interface TierLimits {
  cooldownMs: number;
  retentionDays: number;
}

export const TIER_CONFIGS: Record<UserTier, TierLimits> = {
  free: {
    cooldownMs: 6 * 60 * 60 * 1000, // 6 hours
    retentionDays: 7,
  },
  paid_tier_1: {
    cooldownMs: 60 * 60 * 1000, // 1 hour
    retentionDays: 28,
  },
  admin: {
    cooldownMs: 0, // No limit
    retentionDays: 365, // 1 year
  },
};

export const TIER_NAMES: Record<UserTier, string> = {
  free: 'Free',
  paid_tier_1: 'Premium',
  admin: 'Admin',
};
