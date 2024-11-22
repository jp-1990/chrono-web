import { AUTH_ROUTES } from '~/constants/routes';

export default defineNuxtRouteMiddleware((to, from) => {
  // skip middleware on server
  if (process.server) return;

  if (AUTH_ROUTES.includes(to.path)) return;

  const hasRefreshCheck = document.cookie
    .split(';')
    .some((c) => c.trim().includes('refresh-check='));

  if (!hasRefreshCheck) {
    if (AUTH_ROUTES.includes(from.path)) return abortNavigation();
    return navigateTo('/login');
  }
});
