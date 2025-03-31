interface IAuthentication {
  authenticate(
    email: string,
    password: string,
    keepConnected: boolean
  ): Promise<boolean>;
  register(username: string, password: string): Promise<boolean>;
  logout(): Promise<void>;
}
export default IAuthentication;

export interface FormValues {
  email: string;
  password: string;
  keepConnect: boolean;
}
