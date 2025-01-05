import { AUTH_ROUTES } from '~/constants/routes';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (AUTH_ROUTES.includes(to.path)) return;

  const now = Date.now();
  const { id, refreshCheck } = await db.users.refreshCheck();

  const router = useRouter();

  // if there is not a valid refresh token prevent user from leaving auth routes
  if ((refreshCheck ?? 0) < now) {
    if (AUTH_ROUTES.includes(from.path)) return abortNavigation();
    db.users.delete(id);
    return router.replace('/login');
  }
});
