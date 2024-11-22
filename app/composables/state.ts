import type { User } from '~/types/user';

export const db = await new IndexedDB().init();

export function useUserState() {
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
}
