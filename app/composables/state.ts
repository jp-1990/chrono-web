import type { User } from '~/types/user';

export const useUserState = () => {
  return useState<User>('userState', () => {
    return {
      id: '',
      email: '',
      role: '',
      activities: {},
      verified: false,
      givenName: '',
      familyName: '',
      img: ''
    };
  });
};
