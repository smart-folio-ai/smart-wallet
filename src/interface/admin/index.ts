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

export type ManualGrantType = 'TRIAL_7_DAYS' | 'PERMANENT';

export type ManualGrantPayload = {
  email: string;
  planId: string;
  grantType: ManualGrantType;
  notes?: string;
};

export type UpdateUserRolePayload = {
  email: string;
  role: 'editor' | 'admin';
};

export type AdminPlanPayload = ICreateSubscription;
export type AdminPlanUpdatePayload = IUpdateSubscription;
export type AdminPlan = ISubscription;
