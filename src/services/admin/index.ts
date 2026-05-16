import {
  AdminOverviewResponse,
  AdminPlan,
  AdminPlanPayload,
  AdminPlanUpdatePayload,
  ManualGrantPayload,
  UpdateUserRolePayload,
} from '@/interface/admin';
import {adminService} from '@/server/api/api';

class AdminApiService {
  async getOverview(): Promise<AdminOverviewResponse> {
    const response = await adminService.getOverview();
    return response.data;
  }

  async getPlans(): Promise<AdminPlan[]> {
    const response = await adminService.getPlans();
    return response.data;
  }

  async createPlan(payload: AdminPlanPayload): Promise<AdminPlan> {
    const response = await adminService.createPlan(payload);
    return response.data;
  }

  async updatePlan(planId: string, payload: AdminPlanUpdatePayload): Promise<AdminPlan> {
    const response = await adminService.updatePlan(planId, payload);
    return response.data;
  }

  async deactivatePlan(planId: string): Promise<{message: string}> {
    const response = await adminService.deactivatePlan(planId);
    return response.data;
  }

  async grantSubscription(payload: ManualGrantPayload): Promise<{message: string}> {
    const response = await adminService.grantSubscription(payload);
    return response.data;
  }

  async updateUserRoleByEmail(payload: UpdateUserRolePayload): Promise<{message: string}> {
    const response = await adminService.updateUserRoleByEmail(payload);
    return response.data;
  }
}

export default new AdminApiService();
