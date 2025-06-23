interface IUser {
  getUser: (userId: string) => Promise<UserResponse>;
}

export type UserResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  refreshToken: string;
};

export type IUserProfileResponse = {
  _id: string;
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  avatar?: string;
  createdAt?: string;
};

export type UserSettings = {
  notifications: {
    email: boolean;
    push: boolean;
    marketAlerts: boolean;
    portfolioUpdates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  preferences: {
    language: string;
    currency: string;
    theme: string;
  };
};
export default IUser;
