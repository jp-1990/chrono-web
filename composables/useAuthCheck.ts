import { AUTH_ROUTES } from '~/constants/routes';

const authCheck = () => {
  const router = useRouter();
  const route = useRoute();

  const token = window.localStorage.getItem('token');
  const tokenExpires = window.localStorage.getItem('tokenExpires');

  const now = new Date().getTime();
  const tokenValid = token && tokenExpires && +tokenExpires > now;

  if (!tokenValid) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('tokenExpires');

    if (AUTH_ROUTES.includes(route.path ?? '')) return;
    router.push({ path: '/login' });
  }
};

export const useAuthCheck = () => {
  onUpdated(() => {
    authCheck();
  });
};
