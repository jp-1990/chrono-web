export type User = {
  id: string;
  email: string;
  role: string;
  activities: Record<string, string>;
  verified: boolean;
  givenName: string;
  familyName: string;
  img: string;
  _refreshCheck?: number;
};

export type PostLoginParams = {
  email: string;
  password: string;
};

export type PostRegisterParams = {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
};

// ------------------------------------------------------
// todo: old - remove

export type LoginArgs = {
  email: string;
  password: string;
};
export type LoginRes = { token: string; tokenExpires: string; user: User };

export type SignupArgs = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type SignupRes = boolean;
