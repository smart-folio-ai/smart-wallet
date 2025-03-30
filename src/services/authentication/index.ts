import IAuthentication from '@/interface/authentication';
import {authService} from '@/lib/api';

class AuthenticationService implements IAuthentication {
  async authenticate(
    email: string,
    password: string,
    keepConnected: boolean
  ): Promise<boolean> {
    try {
      const response = await authService.login(email, password, keepConnected);
      console.log('Response:', email, password, keepConnected);
      if (response.data.token) {
        console.log('data:', response.data);
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('keepConnected', JSON.stringify(keepConnected));
        console.log('Login successful');
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
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export default new AuthenticationService();
