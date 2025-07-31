import {SubscriptionInterface} from '@/interface/subscription';
import apiClient, {profileService, subscriptionService} from '@/server/api/api';
import {
  ICreateSubscription,
  ISubscription,
  IUpdateSubscription,
  IUpdateSubscriptionFeature,
  IUserSubscription,
} from '@/types/subscription';

class Subscription implements SubscriptionInterface {
  async getPlans(): Promise<ISubscription[]> {
    const response = await subscriptionService.getPlans();
    return response.data;
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
    console.log('CREATE CHECKOUT:', response.data);
    return response.data;
  }
}

export default new Subscription();
