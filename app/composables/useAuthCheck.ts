import { AUTH_ROUTES } from '~/constants/routes';

const authCheck = () => {
  const router = useRouter();
  const route = useRoute();

  const hasRefreshCheck = document.cookie
    .split(';')
    .some((c) => c.trim().includes('refresh-check='));

  if (!hasRefreshCheck) {
    if (AUTH_ROUTES.includes(route.path ?? '')) return;
    router.push({ path: '/login' });
  }
};

export const useAuthCheck = () => {
  onUpdated(() => {
    authCheck();
  });
};
