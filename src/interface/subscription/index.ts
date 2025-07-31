export interface SubscriptionInterface {
  getPlans(): Promise<ISubscription[]>;
  getCurrentPlan(): Promise<ISubscription>;
  upgradePlan(planId: string): Promise<IUpdateSubscription>;
  createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{url: string}>;
}

export interface ISubscription {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  stripePriceId: string;
  stripeProductId: string;
  isActive: boolean;
  features: string[];
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
  features: string[];
}

export interface IUpdateSubscription {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  intervalCount?: number;
  stripePriceId?: string;
  stripeProductId?: string;
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
