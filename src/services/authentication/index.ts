import IAuthentication, {ICreateUser} from '@/interface/authentication';
import {authService} from '@/lib/api';
import {AxiosError, AxiosResponse} from 'axios';

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
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('keepConnected', JSON.stringify(keepConnected));
      }
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }
  async register(data: ICreateUser): Promise<boolean> {
    try {
      const response = await authService.register(data);

      localStorage.setItem('auth_token', response.data.accessToken);
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            throw new Error('Erro ao criar conta. Tente novamente.');
          case 409:
            throw new Error('E-mail já cadastrado. Tente W outro.');
          case 500:
            throw new Error(
              'Erro interno do servidor. Tente novamente mais tarde.'
            );
          default:
            throw new Error('Erro desconhecido. Tente novamente.');
        }
      }
      return false;
    }
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
      localStorage.removeItem('refresh_token');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthenticationService();
