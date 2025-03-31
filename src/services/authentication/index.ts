import IAuthentication from '@/interface/authentication';
import {authService} from '@/lib/api';
import {AxiosResponse} from 'axios';

class AuthenticationService implements IAuthentication {
  async authenticate(
    email: string,
    password: string,
    keepConnected: boolean
  ): Promise<boolean> {
    try {
      const response = await authService.login(email, password, keepConnected);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('keepConnected', JSON.stringify(keepConnected));
      }
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }
  register(username: string, password: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async logout(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    const response = authService.logout(token);
    try {
      if (!response) {
        return false;
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('keepConnected');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthenticationService();
