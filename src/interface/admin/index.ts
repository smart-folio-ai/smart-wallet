import {ICreateSubscription, ISubscription, IUpdateSubscription} from '@/interface/subscription';

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
