export type User = {
  id: string;
  name: string;
  email: string;
  photo: string;
  role: string;
  active: boolean;
};

export type LoginArgs = {
  email: string;
  password: string;
};
export type LoginRes = { token: string; tokenExpires: string; user: User };
