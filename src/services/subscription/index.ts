import {
  ICreateSubscription,
  ISubscription,
  IUpdateSubscription,
  IUpdateSubscriptionFeature,
  SubscriptionInterface,
} from '@/interface/subscription';
import {subscriptionService} from '@/server/api/api';
import {mockSubscriptionPlans} from '@/utils/mockData';

class Subscription implements SubscriptionInterface {
  async getPlans(): Promise<ISubscription[]> {
    try {
      const response = await subscriptionService.getPlans();
      return response.data;
    } catch (error) {
      console.log('Usando dados mockados de planos de assinatura');
      return mockSubscriptionPlans;
    }
  }

  async getById(id: string): Promise<ISubscription> {
    const response = await subscriptionService.getById(id);
    return response.data;
  }

  async getCurrentPlan(): Promise<ISubscription> {
    const response = await subscriptionService.getCurrentPlan();
    return response.data;
  }

  async createPlan(data: ICreateSubscription): Promise<ISubscription> {
    const response = await subscriptionService.createPlan(data);
    return response.data;
  }

  async upgradePlan(planId: string): Promise<IUpdateSubscription> {
    const response = await subscriptionService.upgradePlan(planId);
    return response.data;
  }

  async updateFeaturePlan(
    planId: string,
    data: IUpdateSubscriptionFeature
  ): Promise<IUpdateSubscription> {
    const response = await subscriptionService.updateFeaturePlan(planId, data);
    return response.data;
  }

  async createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{url: string}> {
    const response = await subscriptionService.createCheckoutSession(
      planId,
      userId,
      successUrl,
      cancelUrl
    );
    return response.data;
  }
}

export default new Subscription();
