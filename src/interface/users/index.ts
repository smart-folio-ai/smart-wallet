interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
interface IUser {
  createUser: (user: User) => Promise<boolean>;
  getUser: (userId: string) => Promise<User | null>;
}

export default IUser;
