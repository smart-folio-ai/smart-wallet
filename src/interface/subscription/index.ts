export interface SubscriptionInterface {
  getPlans(): Promise<ISubscription[]>;
  getCurrentPlan(): Promise<CurrentSubscriptionResponse>;
  upgradePlan(planId: string): Promise<IUpdateSubscription>;
  createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
    billingInterval?: 'monthly' | 'annual',
  ): Promise<{url: string}>;
}

/**
 * Nível de acesso do plano — número livre (TRA-182). Não há lista fixa de
 * nomes: o admin define o nível de cada plano em /admin/plans.
 */
export type UserPlanTier = number;

export interface ISubscription {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  accessLevel: UserPlanTier;
  stripePriceId: string;
  stripeProductId: string;
  annualPrice?: number;
  annualStripePriceId?: string;
  isFeatured?: boolean;
  isComingSoon?: boolean;
  isActive: boolean;
  features: string[];
  activeSubscriberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSubscription {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  accessLevel: UserPlanTier;
  features: string[];
  annualPrice?: number;
  annualStripePriceId?: string;
  isFeatured?: boolean;
  isComingSoon?: boolean;
}

export interface IUpdateSubscription {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  intervalCount?: number;
  accessLevel?: UserPlanTier;
  stripePriceId?: string;
  stripeProductId?: string;
  annualPrice?: number;
  annualStripePriceId?: string;
  isFeatured?: boolean;
  isComingSoon?: boolean;
}

export interface IUpdateSubscriptionFeature {
  feature: string[];
}

export interface IUserSubscription {
  _id: string;
  userId: string;
  subscriptionId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICurrentUserSubscription {
  _id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  cancelAtPeriodEnd: boolean;
  plan: ISubscription;
}

export interface SubscriptionInvoice {
  id: string;
  number: string | null;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | null;
  description: string | null;
  total: number;
  currency: string;
  createdAt: string;
  dueDate: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
}

export interface CurrentSubscriptionResponse {
  hasSubscription: boolean;
  subscription?: {
    _id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    quantity?: number;
  } | null;
  plan?: ISubscription | null;
}
