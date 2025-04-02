interface IAuthentication {
  authenticate(
    email: string,
    password: string,
    keepConnected: boolean
  ): Promise<boolean>;
  register(username: string, password: string): Promise<boolean>;
  logout(): Promise<boolean>;
}
export default IAuthentication;

export interface FormValues {
  email: string;
  password: string;
  keepConnect: boolean;
}

export interface IAuthenticationResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
}
