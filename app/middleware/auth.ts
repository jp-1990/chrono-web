import { abortNavigation, defineNuxtRouteMiddleware } from '#imports';
import { db } from '~/composables/state';
import { AUTH_ROUTES } from '~/constants/routes';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!AUTH_ROUTES.includes(to.path)) return;

  const now = Date.now();
  const { refreshCheck } = await db.users.refreshCheck();

  // if there is a valid refresh token prevent nav to auth routes
  if ((refreshCheck ?? 0) > now) {
    if (AUTH_ROUTES.includes(to.path)) return abortNavigation();
  }
});
