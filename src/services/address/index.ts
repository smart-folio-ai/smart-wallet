import AddressInterface, {AddressResponse} from '@/interface/address';
import {authService, profileService} from '@/server/api/api';
import {jwtDecode} from 'jwt-decode';

class Address implements AddressInterface {
  async getAddressByUser(userId: string): Promise<AddressResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    const response = await profileService.getAddressUser(userId);
    return response.data;
  }
}

export default new Address();
