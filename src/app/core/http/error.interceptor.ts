import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuotaPromptService } from '@core/services/quota-prompt.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const quota = inject(QuotaPromptService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 429) {
        // Anonymous free quota exhausted -> open the login prompt instead of a snackbar.
        quota.prompt();
        return throwError(() => err);
      }

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
