import { AUTH_ROUTES } from '~/constants/routes';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (AUTH_ROUTES.includes(to.path)) return;

  const now = Date.now();
  const { id, refreshCheck } = await db.users.refreshCheck();

  if ((refreshCheck ?? 0) < now) {
    if (AUTH_ROUTES.includes(from.path)) return abortNavigation();
    db.users.delete(id);
    return navigateTo('/login');
  }
});
