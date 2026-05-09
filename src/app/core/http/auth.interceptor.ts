import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AnonymousIdService } from '@core/services/anonymous-id.service';

/**
 * Attaches identity material to every /api call:
 *   - JWT bearer when the user is logged in
 *   - X-Anonymous-Session-Id header for logged-out users (client-generated, persisted in
 *     localStorage). Replaces the cross-site-broken anon_id cookie.
 *   - withCredentials so any same-origin cookie still rides along (legacy / dev).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('/api/')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const anonId = inject(AnonymousIdService).get();
  const token = auth.token();

  let headers = req.headers.set('X-Anonymous-Session-Id', anonId);
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return next(
    req.clone({
      headers,
      withCredentials: true,
    }),
  );
};
