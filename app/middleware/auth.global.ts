import { AUTH_ROUTES } from '~/constants/routes';

export default defineNuxtRouteMiddleware((to, from) => {
  // skip middleware on server
  if (process.server) return;

  if (AUTH_ROUTES.includes(to.path)) return;

  const token = window.localStorage.getItem('token');
  const tokenExpires = window.localStorage.getItem('tokenExpires');

  const now = new Date().getTime();
  const tokenValid = token && tokenExpires && +tokenExpires > now;

  if (!tokenValid) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('tokenExpires');

    if (AUTH_ROUTES.includes(from.path)) return abortNavigation();
    return navigateTo('/login');
  }
});
