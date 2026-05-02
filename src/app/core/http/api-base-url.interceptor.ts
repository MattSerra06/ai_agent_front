import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * Préfixe les requêtes /api/* par l'URL de base du back si configurée.
 * En dev, on laisse passer (proxy.conf.json prend le relais).
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBaseUrl;
  if (!base || !req.url.startsWith('/api')) {
    return next(req);
  }
  const url = base.replace(/\/$/, '') + req.url;
  return next(req.clone({ url }));
};
