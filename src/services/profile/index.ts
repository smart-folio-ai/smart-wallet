import {profileService as apiProfileService} from '@/server/api/api';
import {jwtDecode} from 'jwt-decode';

class ProfileServiceClass {
  private getToken() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');
    return token;
  }

  async getMyProfile() {
    this.getToken();
    const response = await apiProfileService.getMyProfile();
    return response.data;
  }

  async getProfile() {
    const token = this.getToken();
    const decoded = jwtDecode<{userId: string}>(token);
    const userId = decoded.userId;
    const response = await apiProfileService.getUser(userId);
    return response.data;
  }

  async updateProfile(profileId: string, data: any) {
    this.getToken();
    const response = await apiProfileService.updateProfile(profileId, data);
    return response.data;
  }

  async createProfile(userId: string, data: any) {
    this.getToken();
    const response = await apiProfileService.createProfile(userId, data);
    return response.data;
  }
}

export default new ProfileServiceClass();
