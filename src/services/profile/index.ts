import {profileService} from '@/server/api/api';
import {jwtDecode} from 'jwt-decode';

class Profile {
  async getProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    const decoded = jwtDecode<{userId: string}>(token);
    const userId = decoded.userId;
    const response = await profileService.getUser(userId);
    return response.data;
  }

  // async updateProfile(data: any) {
  //   const token = localStorage.getItem('access_token');
  //   if (!token) throw new Error('Token não encontrado');
  //   const decoded = jwtDecode<{userId: string}>(token!);
  //   const userId = decoded.userId;
  //   const response = await authService.updateUser(userId, data);
  //   return response.data;
  // }
}

export default new Profile();
