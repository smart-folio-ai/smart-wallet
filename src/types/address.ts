export interface AddressResponse {
  _id: string;
  userId: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  createdAt: string;
  updatedAt: string;
  __v: number;
}
