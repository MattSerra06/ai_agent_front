import {
  ApplicationConfig,
  ENVIRONMENT_INITIALIZER,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PreloadAllModules } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';

import { routes } from './app.routes';
import { errorInterceptor } from '@core/http/error.interceptor';
import { apiBaseUrlInterceptor } from '@core/http/api-base-url.interceptor';
import { authInterceptor } from '@core/http/auth.interceptor';
import { AuthService } from '@core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(
      withFetch(),
      // Order matters: apiBaseUrl prefixes the URL, auth attaches Bearer + credentials,
      // error finally surfaces messages and triggers the quota popup.
      withInterceptors([apiBaseUrlInterceptor, authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideAppInitializer(() => inject(AuthService).bootstrap()),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
      },
    },
  ],
};
