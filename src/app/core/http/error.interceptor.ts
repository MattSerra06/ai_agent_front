import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isStreamingChat =
        req.url.includes('/api/chat') &&
        !req.url.endsWith('/sync') &&
        !req.url.includes('/stop');
      if (!isStreamingChat) {
        const msg =
          err.error?.error ?? err.error?.message ?? err.message ?? 'Erreur réseau';
        snack.open(msg, 'Fermer', { duration: 4500, panelClass: 'lm-snack-err' });
      }
      return throwError(() => err);
    }),
  );
};
