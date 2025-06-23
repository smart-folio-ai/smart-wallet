interface AddressInterface {
  getUsers: () => void;
  getAddressByUser: (userId: string) => Promise<AddressResponse>;
}

export interface AddressResponse {
  id: string;
  userId: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'HOME' | 'WORK' | 'OTHER';
}

export default AddressInterface;
