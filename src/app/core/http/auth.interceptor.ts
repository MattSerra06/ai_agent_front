import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

/**
 * Attaches the JWT bearer token (when present) and forces credentials inclusion
 * so the anonymous-session cookie travels with every API call.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('/api/')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.token();

  const headers = token
    ? req.headers.set('Authorization', `Bearer ${token}`)
    : req.headers;

  return next(
    req.clone({
      headers,
      withCredentials: true,
    }),
  );
};
