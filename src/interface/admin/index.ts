import {ICreateSubscription, ISubscription, IUpdateSubscription} from '@/interface/subscription';

/** Contagens agregadas de usuários — nunca dado pessoal (TRA-192). */
export type AdminUserCounts = {
  total: number;
  newLast7Days: number;
  newLast30Days: number;
  activeLast24h: number;
  activeLast7Days: number;
  activeLast30Days: number;
};

export type AdminOverviewResponse = {
  totalActiveSubscriptions: number;
  totalTrialSubscriptions: number;
  totalManualGrants: number;
  mostUsedPlan: {
    planId: string;
    planName: string;
    count: number;
  } | null;
  usersByPlan: Array<{
    planId: string;
    planName: string;
    count: number;
  }>;
  /** Opcional: API anterior ao TRA-192 não envia. */
  users?: AdminUserCounts;
};

export type ManualGrantType = 'TRIAL' | 'PERMANENT';

export type ManualGrantPayload = {
  email: string;
  planId: string;
  grantType: ManualGrantType;
  trialDurationDays?: number;
  discountPercent?: number;
  notes?: string;
};

export type ManualGrantHistoryItem = {
  id: string;
  userEmail: string;
  planId: string;
  planName: string;
  grantType: ManualGrantType | string;
  trialDurationDays?: number;
  discountPercent?: number;
  notes?: string;
  performedByEmail: string;
  createdAt: string;
  status: 'active' | 'expired';
};

export type ListManualGrantsQuery = {
  page?: number;
  limit?: number;
};

export type ListManualGrantsResponse = {
  items: ManualGrantHistoryItem[];
  page: number;
  limit: number;
  total: number;
};

export type UpdateUserRolePayload = {
  email: string;
  role: 'editor' | 'admin';
};

export type AdminPlanPayload = ICreateSubscription;
export type AdminPlanUpdatePayload = IUpdateSubscription;
export type AdminPlan = ISubscription;

export type WebhookStatus = {
  configured: boolean;
};

export type WebhookEvent = {
  id: string;
  type: string;
  created: string;
  livemode: boolean;
};
