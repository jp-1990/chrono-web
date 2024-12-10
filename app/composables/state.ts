import type { User } from '~/types/user';

export const db = await new IndexedDB().init();

// export function useIndexedDB() {
//   const db = new IndexedDB().init();
//   return db;
// }

export function useUserState() {
  const user = useState<User>('userState', () => {
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

  function updateUserActivityColor(title: string, color: string) {
    const prevColor = user.value.activities[title];
    if (prevColor !== color) {
      user.value.activities[title] = color;
    }
  }

  return { user, updateUserActivityColor };
}
