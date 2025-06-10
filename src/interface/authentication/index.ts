interface IAuthentication {
  authenticate(
    email: string,
    password: string,
    keepConnected: boolean
  ): Promise<boolean>;
  register(data: ICreateUser): Promise<boolean>;
  logout(): Promise<boolean>;
}
export default IAuthentication;

export type FormValues = {
  email: string;
  password: string;
  keepConnect: boolean;
};

export type IAuthenticationResponse = {
  token: string;
  refreshToken: string;
  expiresIn: string;
};

export type ICreateUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type IResponseCreateUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  accessToken: string;
};
