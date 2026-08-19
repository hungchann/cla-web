export type AccessTier = "free" | "registered" | "premium";

export interface AccessControlRule {
  isLocked: boolean;
  requiresAuth: boolean;
  requiresPremium: boolean;
  reason?: string;
}

export interface ContentAccessCheckOptions {
  isPremium: boolean;
  isAuthenticated: boolean;
  dailyQuotaUsed?: number;
  dailyQuotaLimit?: number;
}
