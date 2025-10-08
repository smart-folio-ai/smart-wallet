import IUser, {UserResponse} from '@/interface/users';
import {profileService} from '@/server/api/api';

class Users implements IUser {
  async getUser(userId: string): Promise<UserResponse> {
    console.log('userId in service', userId);
    const response = await profileService.getUser(userId);
    return response.data;
  }

  async update(userId: string, data: UserResponse): Promise<UserResponse> {
    const response = await profileService.updateUser(userId, data);
    return response.data;
  }
}

export default new Users();
