import { onUpdated } from 'vue';
import { useRoute, useRouter } from '#imports';
import { AUTH_ROUTES } from '~/constants/routes';
import { db } from './state';

const authCheck = async () => {
  const router = useRouter();
  const route = useRoute();

  const now = Date.now();
  const { id, refreshCheck } = await db.users.refreshCheck();

  if ((refreshCheck ?? 0) < now) {
    if (AUTH_ROUTES.includes(route.path ?? '')) return;
    db.users.delete(id);
    router.replace({ path: '/login' });
  }
};

export const useAuthCheck = () => {
  onUpdated(() => {
    authCheck();
  });
};
