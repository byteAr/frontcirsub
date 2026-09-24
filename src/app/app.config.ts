import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

// Sólo registra los datos de es-AR para poder pedirlos explícitamente en un
// pipe (por ejemplo el importe de los reintegros). No cambia el LOCALE_ID por
// defecto, así ninguna otra vista cambia de formato.
registerLocaleData(localeEsAr);


import { providePrimeNG } from 'primeng/config';
import Material from '@primeng/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';




import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
        theme: {
            preset: Material
        },
        ripple: true
    }),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerImmediately'
          })

  ]
};
