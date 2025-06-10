interface IUser {
  getUser: (userId: string) => Promise<void>;
}

export default IUser;
