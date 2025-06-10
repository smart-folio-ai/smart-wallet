import IUser from '@/interface/users';

class Users implements IUser {
  async getUser(userId: string) {
    return null;
  }
}

export default new Users();
